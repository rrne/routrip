'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Provider = 'google' | 'kakao';

type Props = {
  next?: string;
};

const LABELS: Record<Provider, string> = {
  google: 'Google로 계속하기',
  kakao: '카카오로 계속하기',
};

export function OAuthButtons({ next = '/' }: Props) {
  const [loading, setLoading] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (provider: Provider) => {
    setLoading(provider);
    setError(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });

    if (oauthError) {
      setLoading(null);
      setError(oauthError.message);
    }
    // 성공 시 브라우저가 provider 페이지로 리다이렉트됨 (이 함수는 반환 안 함)
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => handleSignIn('google')}
        disabled={loading !== null}
        className="flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
      >
        <span aria-hidden className="text-base">G</span>
        {loading === 'google' ? '이동 중…' : LABELS.google}
      </button>
      <button
        type="button"
        onClick={() => handleSignIn('kakao')}
        disabled={loading !== null}
        className="flex items-center justify-center gap-2 rounded-lg border border-yellow-400 bg-yellow-300 px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-yellow-400 disabled:opacity-50"
      >
        <span aria-hidden className="text-base">K</span>
        {loading === 'kakao' ? '이동 중…' : LABELS.kakao}
      </button>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
