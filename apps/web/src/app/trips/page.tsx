'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

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

export default function TripsListPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrips = async () => {
      const supabase = await createClient();

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push('/login?next=/trips');
        return;
      }

      const { data, error: err } = await supabase
        .from('trips')
        .select('id, name, total_distance_meters, created_at, trip_spots(id)')
        .order('created_at', { ascending: false });

      if (err) {
        setError(err.message);
      } else {
        setTrips(data || []);
      }
      setLoading(false);
    };

    loadTrips();
  }, [router]);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <button
          onClick={() => router.back()}
          aria-label="뒤로가기"
          className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
        >
          ←
        </button>
        <h1 className="flex-1 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          내 여행
        </h1>
        <Link
          href="/"
          className="rounded-md px-3 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800"
        >
          + 새 여행
        </Link>
      </header>

      {loading ? (
        <main className="flex flex-1 items-center justify-center">
          <p className="text-sm text-zinc-500">로딩 중...</p>
        </main>
      ) : error ? (
        <main className="flex flex-1 items-center justify-center px-6 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">
            여행을 불러오지 못했습니다: {error.message}
          </p>
        </main>
      ) : !trips || trips.length === 0 ? (
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            아직 저장한 여행이 없어요.
          </p>
          <Link
            href="/"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            첫 여행 만들기
          </Link>
        </main>
      ) : (
        <ul className="flex-1 divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-900">
          {trips.map((trip) => (
            <li key={trip.id}>
              <Link
                href={`/trips/${trip.id}`}
                className="flex items-center justify-between gap-3 px-4 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {trip.name}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {formatDate(trip.created_at)} · {trip.trip_spots.length}개 장소 ·{' '}
                    {formatDistance(trip.total_distance_meters)}
                  </p>
                </div>
                <span className="text-zinc-400 dark:text-zinc-600">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
