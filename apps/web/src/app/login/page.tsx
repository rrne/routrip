import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Logo } from '@/components/logo';
import { loginAction } from '@/lib/auth/actions';
import { createClient } from '@/lib/supabase/server';

type SearchParams = Promise<{ error?: string; message?: string; next?: string }>;

// Supabase 영문 에러 메시지 → 한글
function translateError(raw: string): string {
  if (raw.includes('Email not confirmed'))
    return '이메일 인증이 완료되지 않았어요. 가입 시 받은 메일에서 인증 링크를 클릭해주세요.';
  if (raw.includes('Invalid login credentials'))
    return '이메일 또는 비밀번호가 올바르지 않아요.';
  return raw;
}

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
        <div className="flex flex-col items-center text-center">
          <Logo size={72} priority />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            routrip
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">로그인해서 일정을 짜보세요</p>
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
          <label className="flex items-center gap-2 px-1 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              name="remember"
              defaultChecked
              className="routrip-check h-[18px] w-[18px] shrink-0 cursor-pointer appearance-none rounded-md border border-zinc-300 bg-white transition-colors checked:border-[#134e5e] checked:bg-[#134e5e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#134e5e]/30 dark:border-zinc-700 dark:bg-zinc-900"
            />
            자동 로그인
          </label>
          <button
            type="submit"
            className="mt-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            로그인
          </button>
        </form>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm leading-relaxed text-red-700 dark:bg-red-950 dark:text-red-300">
            {translateError(error)}
          </p>
        )}
        {message === 'signup_success' && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-relaxed text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
            <p className="font-semibold">📧 가입 완료! 이메일을 확인해주세요</p>
            <p className="mt-2">
              방금 입력한 이메일로 인증 메일을 보냈어요. 메일 안의 <strong>"Confirm your mail"</strong> 링크를 클릭하면 로그인할 수 있습니다.
            </p>
            <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
              메일이 안 보이면 스팸함도 확인해보세요. 몇 분 내로 도착하지 않으면 입력한 이메일이 정확한지 다시 확인해주세요.
            </p>
          </div>
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
