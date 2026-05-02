import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type Params = Promise<{ token: string }>;

type AcceptResult = { ok: true; trip_id: string } | { ok: false; error: string };

export default async function InviteAcceptPage({ params }: { params: Params }) {
  const { token } = await params;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  // 로그인 안 했으면 → 로그인 후 다시 이 페이지로 (next 사용)
  if (!userData.user) redirect(`/login?next=/invite/${token}`);

  const { data, error } = await supabase.rpc('accept_invite', { p_token: token });

  // RPC 호출 자체가 실패한 경우
  if (error) {
    return (
      <ErrorView
        title="초대 처리 실패"
        message={error.message}
      />
    );
  }

  const result = data as AcceptResult;

  // RPC가 ok:false 리턴한 경우 (만료/잘못된 토큰 등)
  if (!result.ok) {
    return <ErrorView title="초대를 수락할 수 없어요" message={result.error} />;
  }

  redirect(`/trips/${result.trip_id}`);
}

function ErrorView({ title, message }: { title: string; message: string }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-base font-medium text-zinc-900 dark:text-zinc-50">{title}</p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
      <Link
        href="/"
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        홈으로
      </Link>
    </main>
  );
}
