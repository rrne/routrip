import Link from 'next/link';
import { HomeBody } from '@/components/home-body';
import { RegionToggle } from '@/components/region-toggle';
import { signoutAction } from '@/lib/auth/actions';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            routrip
          </h1>
          {user ? (
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-500">{user.email}</p>
          ) : (
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-500">여행 일정 최적화</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <RegionToggle />
          {user ? (
            <>
              <Link
                href="/trips"
                className="rounded-md px-2 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800"
              >
                내 여행
              </Link>
              <form action={signoutAction}>
                <button
                  type="submit"
                  className="rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                >
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md px-3 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800"
            >
              로그인
            </Link>
          )}
        </div>
      </header>
      <HomeBody />
    </div>
  );
}
