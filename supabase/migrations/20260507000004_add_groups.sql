----------------------------------------------------------------------
-- groups 테이블 (그룹 정보)
----------------------------------------------------------------------
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index groups_owner_id_idx on public.groups (owner_id);

alter table public.groups enable row level security;

create policy "Users can create groups"
  on public.groups for insert
  with check (auth.uid() = owner_id);

create policy "Only group owner can update group"
  on public.groups for update
  using (auth.uid() = owner_id);

create policy "Only group owner can delete group"
  on public.groups for delete
  using (auth.uid() = owner_id);

----------------------------------------------------------------------
-- group_members 테이블 (그룹 멤버 관리)
----------------------------------------------------------------------
create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  can_edit boolean not null default false,
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create index group_members_group_id_idx on public.group_members (group_id);
create index group_members_user_id_idx on public.group_members (user_id);

alter table public.group_members enable row level security;

create policy "Users can view group members of their groups"
  on public.group_members for select
  using (
    exists (
      select 1 from public.groups
      where groups.id = group_members.group_id and groups.owner_id = auth.uid()
    ) or
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id and gm.user_id = auth.uid()
    )
  );

create policy "Only group owner can manage members"
  on public.group_members for insert
  with check (
    exists (
      select 1 from public.groups
      where groups.id = group_members.group_id and groups.owner_id = auth.uid()
    )
  );

create policy "Only group owner can update members"
  on public.group_members for update
  using (
    exists (
      select 1 from public.groups
      where groups.id = group_members.group_id and groups.owner_id = auth.uid()
    )
  );

create policy "Only group owner can remove members"
  on public.group_members for delete
  using (
    exists (
      select 1 from public.groups
      where groups.id = group_members.group_id and groups.owner_id = auth.uid()
    )
  );

----------------------------------------------------------------------
-- groups select 정책 (group_members 테이블 존재 후 추가)
----------------------------------------------------------------------
create policy "Users can view groups they're a member of"
  on public.groups for select
  using (
    owner_id = auth.uid() or
    exists (
      select 1 from public.group_members
      where group_members.group_id = groups.id and group_members.user_id = auth.uid()
    )
  );

----------------------------------------------------------------------
-- trips 테이블 수정 (group_id 추가)
----------------------------------------------------------------------
alter table public.trips
add column group_id uuid references public.groups on delete set null;

create index trips_group_id_idx on public.trips (group_id);

----------------------------------------------------------------------
-- RLS 정책 수정 (그룹 여행 접근 권한)
----------------------------------------------------------------------
-- 기존 정책 삭제 (존재하면)
drop policy if exists "Users can view their own trips" on public.trips;
drop policy if exists "Users can insert their own trips" on public.trips;
drop policy if exists "Users can update their own trips" on public.trips;
drop policy if exists "Users can delete their own trips" on public.trips;

-- 새로운 정책 추가
create policy "Users can view their own trips or group trips"
  on public.trips for select
  using (
    auth.uid() = user_id or
    (group_id is not null and exists (
      select 1 from public.group_members
      where group_members.group_id = trips.group_id and group_members.user_id = auth.uid()
    ))
  );

create policy "Users can insert trips (own or group)"
  on public.trips for insert
  with check (
    auth.uid() = user_id and
    (group_id is null or exists (
      select 1 from public.group_members
      where group_members.group_id = trips.group_id and group_members.user_id = auth.uid()
    ))
  );

create policy "Users can update trips (own or group with edit permission)"
  on public.trips for update
  using (
    auth.uid() = user_id or
    (group_id is not null and exists (
      select 1 from public.group_members
      where group_members.group_id = trips.group_id
        and group_members.user_id = auth.uid()
        and group_members.can_edit = true
    ))
  );

create policy "Users can delete trips (own or group owner)"
  on public.trips for delete
  using (
    auth.uid() = user_id or
    (group_id is not null and exists (
      select 1 from public.groups
      where groups.id = trips.group_id and groups.owner_id = auth.uid()
    ))
  );

----------------------------------------------------------------------
-- 트리거: updated_at 자동 갱신
----------------------------------------------------------------------
create trigger set_groups_updated_at
  before update on public.groups
  for each row execute function public.set_updated_at();
