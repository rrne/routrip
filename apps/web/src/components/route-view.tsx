'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { optimizeRoute } from '@/lib/route/optimize';
import { useCart } from '@/lib/store/cart';

type Props = {
  user: User | null;
};

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export function RouteView({ user }: Props) {
  const items = useCart((s) => s.items);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const route = useMemo(() => (items.length >= 2 ? optimizeRoute(items) : null), [items]);

  if (!hydrated) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">불러오는 중…</p>
      </main>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <Link
          href="/"
          aria-label="홈으로"
          className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
        >
          ←
        </Link>
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          최적 경로
        </h1>
      </header>

      {!route ? (
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            경로를 계산하려면 최소 2개 이상의 장소를 담아주세요.
          </p>
          <Link
            href="/"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            장소 담으러 가기
          </Link>
        </main>
      ) : (
        <>
          <section className="border-b border-zinc-200 px-4 py-5 text-center dark:border-zinc-800">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">총 이동거리</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {formatDistance(route.totalDistanceMeters)}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
              {route.spots.length}개 장소 · 직선 거리 기준
            </p>
          </section>

          <ol className="flex-1 overflow-y-auto px-4 py-2">
            {route.spots.map((spot, idx) => {
              const leg = route.legs[idx];
              return (
                <li key={spot.id}>
                  <div className="flex items-start gap-3 py-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {spot.name}
                      </p>
                      <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {spot.address}
                      </p>
                    </div>
                  </div>
                  {leg && (
                    <div className="ml-3.5 flex items-center gap-2 border-l border-dashed border-zinc-300 py-1 pl-6 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                      <span>↓</span>
                      <span>{formatDistance(leg.distanceMeters)}</span>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="flex gap-2 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <Link
              href="/"
              className="flex-1 rounded-lg border border-zinc-300 px-4 py-2.5 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              처음으로
            </Link>
            {user ? (
              <button
                type="button"
                disabled
                title="저장 기능 준비 중"
                className="flex-1 cursor-not-allowed rounded-lg bg-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
              >
                저장하기 (준비중)
              </button>
            ) : (
              <Link
                href="/login?next=/route"
                className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                로그인하고 저장
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
