'use server';

import { createClient } from '@/lib/supabase/server';

type CreateInviteResult =
  | { ok: true; token: string; expiresAt: string }
  | { ok: false; error: string };

// 초대 토큰 생성 — UUID v4에서 하이픈만 제거 (32자 hex)
function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

export async function createInviteAction(tripId: string): Promise<CreateInviteResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, error: '로그인이 필요합니다.' };

  const token = generateToken();

  const { data, error } = await supabase
    .from('trip_invites')
    .insert({
      trip_id: tripId,
      token,
      created_by: userData.user.id,
    })
    .select('token, expires_at')
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? '초대 링크 생성 실패. (소유자만 생성 가능)',
    };
  }

  return { ok: true, token: data.token, expiresAt: data.expires_at };
}
