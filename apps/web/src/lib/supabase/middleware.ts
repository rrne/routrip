import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@routrip/db';
import { SESSION_MARKER_COOKIE } from '@/lib/auth/session';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 자동 로그인 윈도우 만료 검사 — Supabase 세션은 살아있는데
  // SESSION_MARKER_COOKIE가 만료되어 사라진 경우 강제 로그아웃 (60일 윈도우 끝).
  const marker = request.cookies.get(SESSION_MARKER_COOKIE)?.value;
  if (user && !marker) {
    await supabase.auth.signOut();
  }

  return response;
}
