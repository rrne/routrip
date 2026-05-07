import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/groups/[id]/members - 멤버 추가
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // owner 확인
    const { data: group, error: fetchError } = await supabase
      .from('groups')
      .select('owner_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !group) {
      return NextResponse.json({ error: '그룹을 찾을 수 없습니다.' }, { status: 404 });
    }

    if ((group as { owner_id: string }).owner_id !== user.user.id) {
      return NextResponse.json({ error: '그룹 owner만 멤버를 추가할 수 있습니다.' }, { status: 403 });
    }

    const { username, can_edit } = await request.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: '닉네임을 입력해주세요.' }, { status: 400 });
    }

    // 닉네임으로 사용자 찾기
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.trim())
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 자신을 추가할 수 없음
    if (profile.id === user.user.id) {
      return NextResponse.json({ error: '자신을 멤버로 추가할 수 없습니다.' }, { status: 400 });
    }

    // 멤버 추가
    const { data, error } = await supabase
      .from('group_members')
      // @ts-expect-error - supabase type inference issue
      .insert([{ group_id: id, user_id: profile.id, can_edit: can_edit ?? false }])
      .select('id, user_id, can_edit, profiles:user_id(id, username)');

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: '이미 그룹에 속한 멤버입니다.' }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data?.[0], { status: 201 });
  } catch (error) {
    console.error('멤버 추가 에러:', error);
    return NextResponse.json({ error: '멤버 추가에 실패했습니다.' }, { status: 500 });
  }
}
