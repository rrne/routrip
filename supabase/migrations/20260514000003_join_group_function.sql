----------------------------------------------------------------------
-- 코드로 모임 가입 — RLS를 우회하기 위해 security definer 함수 사용
--
-- 일반 사용자는 group_members 에 INSERT 권한이 없음 (owner만 가능).
-- 코드 매칭 검증 후 자기 자신을 멤버로 추가할 수 있도록 별도 함수 제공.
----------------------------------------------------------------------

create or replace function public.join_group_by_code(p_code text)
returns table (group_id uuid, already_member boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_group_id uuid;
  v_owner_id uuid;
  v_is_member boolean;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  if p_code is null or length(trim(p_code)) = 0 then
    raise exception 'code required' using errcode = '22023';
  end if;

  select id, owner_id into v_group_id, v_owner_id
    from public.groups
    where code = upper(trim(p_code));

  if v_group_id is null then
    raise exception 'group not found' using errcode = 'P0002';
  end if;

  if v_owner_id = v_uid then
    return query select v_group_id, true;
    return;
  end if;

  select exists (
    select 1 from public.group_members
    where group_id = v_group_id and user_id = v_uid
  ) into v_is_member;

  if v_is_member then
    return query select v_group_id, true;
    return;
  end if;

  insert into public.group_members (group_id, user_id, can_edit)
    values (v_group_id, v_uid, false);

  return query select v_group_id, false;
end;
$$;

revoke all on function public.join_group_by_code(text) from public;
grant execute on function public.join_group_by_code(text) to authenticated;
