import 'server-only';
import { cookies } from 'next/headers';

// 자동 로그인 마커 쿠키 — 이 쿠키가 살아있는 동안만 Supabase 세션을 유효 처리.
// 브라우저가 maxAge 지나면 자동 삭제 → 미들웨어에서 supabase.auth.signOut() 발동.
export const SESSION_MARKER_COOKIE = 'routrip_login_at';
export const SESSION_MAX_AGE_SECONDS = 60 * 24 * 60 * 60; // 60일

// persistent=true 면 60일 maxAge 쿠키 (브라우저 닫아도 유지),
// persistent=false 면 session 쿠키 (브라우저 닫으면 사라짐 → 다음 방문에 자동 로그아웃).
export async function setSessionMarker(persistent: boolean): Promise<void> {
  const store = await cookies();
  store.set(SESSION_MARKER_COOKIE, String(Date.now()), {
    ...(persistent ? { maxAge: SESSION_MAX_AGE_SECONDS } : {}),
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function clearSessionMarker(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_MARKER_COOKIE);
}
