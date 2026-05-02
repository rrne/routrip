import { NextResponse, type NextRequest } from 'next/server';
import { setSessionMarker } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // 이메일 인증/OAuth 완료 시점에는 기본 persistent (60일) 윈도우.
      await setSessionMarker(true);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('인증에 실패했습니다.')}`);
}
