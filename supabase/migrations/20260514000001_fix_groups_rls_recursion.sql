----------------------------------------------------------------------
-- group_members SELECT 정책의 RLS 무한 재귀 해결
--
-- 기존 정책은 group_members 안에서 다시 group_members를 조회해 RLS가
-- 재귀 호출됨. security definer 함수로 멤버십 체크를 빼서 재귀를 차단.
----------------------------------------------------------------------

create or replace function public.is_group_member(gid uuid, uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = uid
  );
$$;

revoke all on function public.is_group_member(uuid, uuid) from public;
grant execute on function public.is_group_member(uuid, uuid) to authenticated, anon, service_role;

-- group_members SELECT 정책 교체
drop policy if exists "Users can view group members of their groups" on public.group_members;
create policy "Users can view group members of their groups"
  on public.group_members for select
  using (
    exists (
      select 1 from public.groups
      where groups.id = group_members.group_id and groups.owner_id = auth.uid()
    )
    or public.is_group_member(group_members.group_id, auth.uid())
  );

-- groups SELECT 정책 교체 (얘도 group_members를 직접 조회해서 재귀 유발)
drop policy if exists "Users can view groups they're a member of" on public.groups;
create policy "Users can view groups they're a member of"
  on public.groups for select
  using (
    owner_id = auth.uid()
    or public.is_group_member(id, auth.uid())
  );
