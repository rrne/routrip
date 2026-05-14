import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// 현재 로그인한 사용자 프로필
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', userData.user.id)
      .maybeSingle();
    return NextResponse.json({
      id: userData.user.id,
      username: (profile as { username: string | null } | null)?.username ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    // 프로필이 없으면 생성
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.user.id)
      .maybeSingle();

    if (!existing) {
      const defaultUsername = user.user.email?.split('@')[0] || 'user';
      const { error } = await supabase
        .from('profiles')
        .insert([{ id: user.user.id, username: defaultUsername }]);

      if (error && error.code !== '23505') {
        console.error('Profile creation error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500 }
    );
  }
}
