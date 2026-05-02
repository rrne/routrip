import Link from 'next/link';
import { redirect } from 'next/navigation';
import { signupAction } from '@/lib/auth/actions';
import { createClient } from '@/lib/supabase/server';

type SearchParams = Promise<{ error?: string }>;

export default async function SignupPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect('/');

  const { error } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="flex w-full flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            회원가입
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">routrip 시작하기</p>
        </div>

        <form action={signupAction} className="flex flex-col gap-3">
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
            minLength={6}
            autoComplete="new-password"
            placeholder="비밀번호 (6자 이상)"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <button
            type="submit"
            className="mt-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            가입하기
          </button>
        </form>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          이미 계정이 있나요?{' '}
          <Link
            href="/login"
            className="font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-50"
          >
            로그인
          </Link>
        </p>
      </div>
    </main>
  );
}
