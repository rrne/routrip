'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const CODE_LENGTH = 6;

export default function JoinGroupPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const handleChange = (raw: string) => {
    const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH);
    setCode(cleaned);
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== CODE_LENGTH) {
      setError(`${CODE_LENGTH}자리 코드를 입력해주세요.`);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error ?? '가입에 실패했어요.');
      }
      router.push(`/groups/${body.group_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <button
          onClick={() => router.back()}
          aria-label="뒤로가기"
          className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="h-5 w-5"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="flex-1 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          그룹 합류
        </h1>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 pt-16 pb-10">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#134e5e]/10 text-[#134e5e] dark:bg-[#7fb5c4]/15 dark:text-[#7fb5c4]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="h-8 w-8"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M19 8v6" />
            <path d="M22 11h-6" />
          </svg>
        </div>

        <h2 className="mt-6 text-center text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          초대 코드 입력
        </h2>
        <p className="mt-2 max-w-xs text-center text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          친구에게 받은 6자리 코드를 입력하면
          <br />
          그룹에 자동으로 합류돼요.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 flex w-full max-w-xs flex-col items-center">
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            value={code}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="ABCD12"
            aria-label="초대 코드"
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-4 text-center font-mono text-2xl font-bold tracking-[0.3em] text-zinc-900 uppercase placeholder:text-zinc-300 placeholder:tracking-[0.3em] focus:border-[#134e5e] focus:outline-none focus:ring-2 focus:ring-[#134e5e]/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            autoFocus
          />

          {error && (
            <p className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || code.length !== CODE_LENGTH}
            className="mt-6 w-full rounded-xl bg-[#134e5e] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_-12px_rgba(19,78,94,0.6)] transition-colors hover:bg-[#0f3f4c] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? '참가하는 중…' : '참가하기'}
          </button>
        </form>
      </main>
    </div>
  );
}
