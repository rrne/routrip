import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/groups/join - 코드로 모임 가입
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
    if (!code) {
      return NextResponse.json({ error: '코드를 입력해주세요.' }, { status: 400 });
    }

    // @ts-expect-error - join_group_by_code 함수는 db types 에 아직 반영되지 않음
    const { data, error } = await supabase.rpc('join_group_by_code', { p_code: code });

    if (error) {
      if ((error as { code?: string }).code === 'P0002') {
        return NextResponse.json({ error: '해당 코드의 모임을 찾을 수 없어요.' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const row = (data as unknown as Array<{ group_id: string; already_member: boolean }> | null)?.[0];
    if (!row) {
      return NextResponse.json({ error: '가입 처리에 실패했어요.' }, { status: 500 });
    }

    return NextResponse.json({ group_id: row.group_id, already_member: row.already_member });
  } catch (error) {
    console.error('모임 가입 에러:', error);
    return NextResponse.json({ error: '모임 가입에 실패했습니다.' }, { status: 500 });
  }
}
