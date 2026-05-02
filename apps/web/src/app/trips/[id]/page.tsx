import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type Params = Promise<{ id: string }>;

function formatDistance(meters: number | null): string {
  if (meters == null) return '—';
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

export default async function TripDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect(`/login?next=/trips/${id}`);

  const { data, error } = await supabase
    .from('trips')
    .select(
      `
      id,
      name,
      total_distance_meters,
      created_at,
      trip_spots (
        position,
        spots (
          id,
          name,
          address,
          category,
          lat,
          lng
        )
      )
    `,
    )
    .eq('id', id)
    .single();

  if (error || !data) notFound();

  const orderedSpots = [...data.trip_spots]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((ts) => ts.spots)
    .filter((s): s is NonNullable<typeof s> => s !== null);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <Link
          href="/trips"
          aria-label="여행 목록으로"
          className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
        >
          ←
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {data.name}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">{formatDate(data.created_at)}</p>
        </div>
      </header>

      <section className="border-b border-zinc-200 px-4 py-5 text-center dark:border-zinc-800">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">총 이동거리</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {formatDistance(data.total_distance_meters)}
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
          {orderedSpots.length}개 장소 · 직선 거리 기준
        </p>
      </section>

      <ol className="flex-1 overflow-y-auto px-4 py-2">
        {orderedSpots.map((spot, idx) => (
          <li key={spot.id} className="flex items-start gap-3 py-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900">
              {idx + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {spot.name}
              </p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{spot.address}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="flex gap-2 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <Link
          href="/trips"
          className="flex-1 rounded-lg border border-zinc-300 px-4 py-2.5 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          내 여행 목록
        </Link>
        <Link
          href="/"
          className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          새 여행 만들기
        </Link>
      </div>
    </div>
  );
}
