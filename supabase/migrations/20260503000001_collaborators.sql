-- routrip 2단계 스키마: 일정 공유 / 공동 편집
-- 추가 테이블: trip_collaborators (멤버), trip_invites (초대 토큰)
-- RLS 정책 확장: trip/trip_spots에 collaborator 접근 허용
-- RPC: accept_invite (토큰으로 collaborator 합류)

----------------------------------------------------------------------
-- 1. trip_collaborators — 일정의 멤버 (owner + editor)
----------------------------------------------------------------------
create table public.trip_collaborators (
  trip_id uuid not null references public.trips on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null default 'editor' check (role in ('owner', 'editor')),
  invited_by uuid references auth.users on delete set null,
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create index trip_collaborators_user_id_idx on public.trip_collaborators (user_id);

alter table public.trip_collaborators enable row level security;

----------------------------------------------------------------------
-- 2. trip_invites — 초대 링크 토큰 (URL에 들어가는 random string)
----------------------------------------------------------------------
create table public.trip_invites (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips on delete cascade,
  token text unique not null,
  created_by uuid not null references auth.users on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create index trip_invites_token_idx on public.trip_invites (token);
create index trip_invites_trip_id_idx on public.trip_invites (trip_id);

alter table public.trip_invites enable row level security;

----------------------------------------------------------------------
-- 3. 헬퍼 함수 — RLS 정책에서 사용 (security definer로 재귀 방지)
----------------------------------------------------------------------
create or replace function public.is_trip_member(p_trip_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from trip_collaborators
    where trip_id = p_trip_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_trip_owner(p_trip_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from trips
    where id = p_trip_id and user_id = auth.uid()
  );
$$;

----------------------------------------------------------------------
-- 4. trips SELECT 정책 확장 — collaborator도 볼 수 있게
--    INSERT/UPDATE/DELETE는 owner만 (기존 정책 유지)
----------------------------------------------------------------------
drop policy "Users can view their own trips" on public.trips;

create policy "Members can view trips"
  on public.trips for select
  using (public.is_trip_member(id));

----------------------------------------------------------------------
-- 5. trip_spots — collaborator도 모든 작업 가능 (공동 편집)
----------------------------------------------------------------------
drop policy "Users can view trip_spots for their own trips" on public.trip_spots;
drop policy "Users can insert trip_spots into their own trips" on public.trip_spots;
drop policy "Users can update trip_spots in their own trips" on public.trip_spots;
drop policy "Users can delete trip_spots from their own trips" on public.trip_spots;

create policy "Members can view trip_spots"
  on public.trip_spots for select
  using (public.is_trip_member(trip_id));

create policy "Members can insert trip_spots"
  on public.trip_spots for insert
  with check (public.is_trip_member(trip_id));

create policy "Members can update trip_spots"
  on public.trip_spots for update
  using (public.is_trip_member(trip_id));

create policy "Members can delete trip_spots"
  on public.trip_spots for delete
  using (public.is_trip_member(trip_id));

----------------------------------------------------------------------
-- 6. trip_collaborators RLS
----------------------------------------------------------------------
-- 같은 trip의 멤버끼리 서로의 멤버십 row를 볼 수 있음
create policy "Members can view fellow collaborators"
  on public.trip_collaborators for select
  using (public.is_trip_member(trip_id));

-- owner만 다른 멤버 추가 가능 (실제로는 accept_invite RPC를 통해 추가됨)
create policy "Owner can add collaborators"
  on public.trip_collaborators for insert
  with check (public.is_trip_owner(trip_id));

-- owner는 누구든 제거 가능. 본인은 본인을 제거(나가기) 가능.
create policy "Owner or self can remove collaborators"
  on public.trip_collaborators for delete
  using (public.is_trip_owner(trip_id) or user_id = auth.uid());

----------------------------------------------------------------------
-- 7. trip_invites RLS — owner만 모든 작업 가능
--    (초대 받는 쪽은 RPC accept_invite 사용)
----------------------------------------------------------------------
create policy "Owner can manage invites"
  on public.trip_invites for all
  using (public.is_trip_owner(trip_id))
  with check (public.is_trip_owner(trip_id));

----------------------------------------------------------------------
-- 8. 트리거 — trip 생성 시 owner를 trip_collaborators에 자동 등록
----------------------------------------------------------------------
create or replace function public.handle_new_trip()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.trip_collaborators (trip_id, user_id, role, invited_by)
  values (new.id, new.user_id, 'owner', new.user_id);
  return new;
end;
$$;

create trigger on_trip_created
  after insert on public.trips
  for each row execute function public.handle_new_trip();

----------------------------------------------------------------------
-- 9. 기존 데이터 backfill — 이미 만든 trip의 owner를 trip_collaborators에 추가
----------------------------------------------------------------------
insert into public.trip_collaborators (trip_id, user_id, role, invited_by)
select id, user_id, 'owner', user_id from public.trips
on conflict do nothing;

----------------------------------------------------------------------
-- 10. RPC accept_invite — 토큰으로 collaborator 합류
--     security definer 로 RLS 우회 (token만 유효하면 누구든 합류 가능)
----------------------------------------------------------------------
create or replace function public.accept_invite(p_token text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite trip_invites%rowtype;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return json_build_object('ok', false, 'error', '로그인이 필요합니다.');
  end if;

  select * into v_invite from trip_invites where token = p_token;
  if v_invite.id is null then
    return json_build_object('ok', false, 'error', '유효하지 않은 초대 링크입니다.');
  end if;
  if v_invite.expires_at < now() then
    return json_build_object('ok', false, 'error', '만료된 초대 링크입니다.');
  end if;

  insert into trip_collaborators (trip_id, user_id, role, invited_by)
  values (v_invite.trip_id, v_user_id, 'editor', v_invite.created_by)
  on conflict (trip_id, user_id) do nothing;

  return json_build_object('ok', true, 'trip_id', v_invite.trip_id);
end;
$$;
