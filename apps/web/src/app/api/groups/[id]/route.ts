import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/groups/[id] - 그룹 상세 조회
export async function GET(
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

    const { data, error } = await supabase
      .from('groups')
      .select('*, group_members(id, user_id, can_edit, profiles!group_members_user_id_fkey(username))')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: '그룹을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('그룹 상세 조회 에러:', error);
    return NextResponse.json({ error: '그룹 조회에 실패했습니다.' }, { status: 500 });
  }
}

// PATCH /api/groups/[id] - 그룹 정보 수정 (owner만)
export async function PATCH(
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

    if (group.owner_id !== user.user.id) {
      return NextResponse.json({ error: '그룹 owner만 수정할 수 있습니다.' }, { status: 403 });
    }

    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: '그룹 이름을 입력해주세요.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('groups')
      .update({ name: name.trim() })
      .eq('id', id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data?.[0]);
  } catch (error) {
    console.error('그룹 수정 에러:', error);
    return NextResponse.json({ error: '그룹 수정에 실패했습니다.' }, { status: 500 });
  }
}

// DELETE /api/groups/[id] - 그룹 삭제 (owner만)
export async function DELETE(
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

    if (group.owner_id !== user.user.id) {
      return NextResponse.json({ error: '그룹 owner만 삭제할 수 있습니다.' }, { status: 403 });
    }

    const { error } = await supabase.from('groups').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('그룹 삭제 에러:', error);
    return NextResponse.json({ error: '그룹 삭제에 실패했습니다.' }, { status: 500 });
  }
}
