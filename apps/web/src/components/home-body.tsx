'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CartDrawer } from '@/components/cart-drawer';
import { CartSearchBar } from '@/components/cart-search-bar';
import { Logo } from '@/components/logo';
import { RegionAwareMap } from '@/components/region-aware-map';
import { RegionPicker } from '@/components/region-picker';
import { RegionToggle } from '@/components/region-toggle';
import { useCart } from '@/lib/store/cart';
import { createClient } from '@/lib/supabase/client';

type Props = {
  isLoggedIn: boolean;
  initialUsername?: string | null;
};

// 첫 방문엔 picker만 (헤더 X), 선택 후엔 헤더 + 지도/장바구니.
export function HomeBody({ isLoggedIn, initialUsername }: Props) {
  const regionChosen = useCart((s) => s.regionChosen);
  const resetToRegionPicker = useCart((s) => s.resetToRegionPicker);
  const [hydrated, setHydrated] = useState(false);
  const [username, setUsername] = useState<string | null>(initialUsername ?? null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return <div className="flex-1" />;
  }

  if (!regionChosen) {
    return <RegionPicker />;
  }

  return (
    <>
      <header className="flex items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <button
          type="button"
          onClick={resetToRegionPicker}
          className="flex cursor-pointer items-center gap-2"
          aria-label="지역 선택으로 돌아가기"
        >
          <Logo size={32} />
          <h1 className="truncate text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            routrip
          </h1>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <RegionToggle />
          {isLoggedIn && (
            <Link
              href="/groups"
              aria-label="그룹"
              title="그룹"
              className="rounded-md p-1 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </Link>
          )}
          {isLoggedIn ? (
            <Link
              href="/mypage"
              aria-label="내 정보"
              className="flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-1 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M12 14c-4.418 0-8 1.79-8 4v2h16v-2c0-2.21-3.582-4-8-4z" />
              </svg>
              {username && <span className="text-xs font-medium">{username}</span>}
            </Link>
          ) : (
            <Link
              href="/login"
              className="cursor-pointer rounded-md px-3 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800"
            >
              로그인
            </Link>
          )}
        </div>
      </header>
      <CartSearchBar />
      <div className="relative flex-1">
        <RegionAwareMap className="absolute inset-0" />
        <CartDrawer />
      </div>
    </>
  );
}
