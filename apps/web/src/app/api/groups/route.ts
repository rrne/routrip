import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/groups - 그룹 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: '그룹 이름을 입력해주세요.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('groups')
      .insert([{ owner_id: user.user.id, name: name.trim() }])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data?.[0], { status: 201 });
  } catch (error) {
    console.error('그룹 생성 에러:', error);
    return NextResponse.json({ error: '그룹 생성에 실패했습니다.' }, { status: 500 });
  }
}

// GET /api/groups - 내 그룹 목록 조회
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 내가 owner인 그룹 + 내가 멤버인 그룹
    const { data, error } = await supabase
      .from('groups')
      .select('*, group_members(id, user_id, can_edit, profiles!group_members_user_id_fkey(username))')
      .or(`owner_id.eq.${user.user.id},id.in.(select group_id from group_members where user_id=${user.user.id})`)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('그룹 목록 조회 에러:', error);
    return NextResponse.json({ error: '그룹 목록 조회에 실패했습니다.' }, { status: 500 });
  }
}
