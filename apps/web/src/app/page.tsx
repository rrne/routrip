import { redirect } from 'next/navigation';
import { KakaoMapView } from '@/components/kakao-map';
import { signoutAction } from '@/lib/auth/actions';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/login');

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            routrip
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">{data.user.email}</p>
        </div>
        <form action={signoutAction}>
          <button
            type="submit"
            className="rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            로그아웃
          </button>
        </form>
      </header>
      <KakaoMapView className="flex-1" />
    </div>
  );
}
