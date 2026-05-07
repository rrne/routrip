import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/search/users?q=nickname - 닉네임으로 사용자 검색
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const query = request.nextUrl.searchParams.get('q');

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: '검색어를 입력해주세요.' }, { status: 400 });
    }

    // 유사도 검색 (ilike 사용)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', `%${query.trim()}%`)
      .neq('id', user.user.id)
      .limit(10);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('사용자 검색 에러:', error);
    return NextResponse.json({ error: '사용자 검색에 실패했습니다.' }, { status: 500 });
  }
}
