'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from '@/lib/store/cart';

export function CartDrawer() {
  const items = useCart((s) => s.items);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);

  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // localStorage 복원 후에만 카운트 표시 (SSR mismatch 방지)
  useEffect(() => setHydrated(true), []);

  const count = hydrated ? items.length : 0;

  return (
    <div className="absolute inset-x-0 bottom-0 z-10 border-t border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {open ? '⌄' : '⌃'} 담은 스팟
          </span>
          <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900">
            {count}
          </span>
        </div>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {count >= 2 ? '경로 계산 가능' : count === 1 ? '1개 더 담아주세요' : '검색해서 담아보세요'}
        </span>
      </button>

      {open && (
        <div className="max-h-[60dvh] overflow-y-auto border-t border-zinc-200 dark:border-zinc-800">
          {count === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              아직 담은 장소가 없어요.
            </p>
          ) : (
            <>
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {items.map((spot, idx) => (
                  <li key={spot.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
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
                    <button
                      type="button"
                      onClick={() => remove(spot.id)}
                      className="shrink-0 rounded-md p-1 text-xs text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                      aria-label={`${spot.name} 제거`}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={clear}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                >
                  비우기
                </button>
                {count >= 2 ? (
                  <Link
                    href="/route"
                    className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    경로 계산하기
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="flex-1 cursor-not-allowed rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white opacity-40 dark:bg-zinc-50 dark:text-zinc-900"
                  >
                    경로 계산하기
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
