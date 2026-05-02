import Link from 'next/link';
import { redirect } from 'next/navigation';
import { OAuthButtons } from '@/components/oauth-buttons';
import { loginAction } from '@/lib/auth/actions';
import { createClient } from '@/lib/supabase/server';

type SearchParams = Promise<{ error?: string; message?: string; next?: string }>;

const MESSAGES: Record<string, string> = {
  signup_success: '가입 완료! 이메일 확인 후 로그인해주세요.',
};

function safeNext(value: string | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const params = await searchParams;
  const next = safeNext(params.next);
  if (data.user) redirect(next);

  const { error, message } = params;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="flex w-full flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            routrip
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">로그인해서 일정을 짜보세요</p>
        </div>

        <OAuthButtons next={next} />

        <div className="flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-600">
          <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          <span>또는 이메일</span>
          <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        </div>

        <form action={loginAction} className="flex flex-col gap-3">
          {next !== '/' && <input type="hidden" name="next" value={next} />}
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="이메일"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="비밀번호"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <button
            type="submit"
            className="mt-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            로그인
          </button>
        </form>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}
        {message && MESSAGES[message] && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-center text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
            {MESSAGES[message]}
          </p>
        )}

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          처음이신가요?{' '}
          <Link
            href="/signup"
            className="font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-50"
          >
            회원가입
          </Link>
        </p>
      </div>
    </main>
  );
}
