import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// PATCH /api/groups/[id]/members/[userId] - 멤버 권한 변경
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId } = await params;
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
      return NextResponse.json({ error: '그룹 owner만 멤버 권한을 변경할 수 있습니다.' }, { status: 403 });
    }

    const { can_edit } = await request.json();

    if (typeof can_edit !== 'boolean') {
      return NextResponse.json({ error: '권한 정보가 필요합니다.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('group_members')
      // @ts-expect-error - supabase type inference issue
      .update({ can_edit })
      .eq('group_id', id)
      .eq('user_id', userId)
      .select('id, user_id, can_edit, profiles:user_id(id, username)');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: '멤버를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('멤버 권한 변경 에러:', error);
    return NextResponse.json({ error: '멤버 권한 변경에 실패했습니다.' }, { status: 500 });
  }
}

// DELETE /api/groups/[id]/members/[userId] - 멤버 제거
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId } = await params;
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // owner 확인 또는 자신 제거
    const { data: group, error: fetchError } = await supabase
      .from('groups')
      .select('owner_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !group) {
      return NextResponse.json({ error: '그룹을 찾을 수 없습니다.' }, { status: 404 });
    }

    // owner이거나 자신을 제거하는 경우만 허용
    if ((group as { owner_id: string }).owner_id !== user.user.id && user.user.id !== userId) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', id)
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('멤버 제거 에러:', error);
    return NextResponse.json({ error: '멤버 제거에 실패했습니다.' }, { status: 500 });
  }
}
