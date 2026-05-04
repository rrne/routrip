'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CartDrawer } from '@/components/cart-drawer';
import { CartSearchBar } from '@/components/cart-search-bar';
import { Logo } from '@/components/logo';
import { RegionAwareMap } from '@/components/region-aware-map';
import { RegionPicker } from '@/components/region-picker';
import { RegionToggle } from '@/components/region-toggle';
import { signoutAction } from '@/lib/auth/actions';
import { useCart } from '@/lib/store/cart';

type Props = {
  userEmail: string | null;
};

// 첫 방문엔 picker만 (헤더 X), 선택 후엔 헤더 + 지도/장바구니.
export function HomeBody({ userEmail }: Props) {
  const regionChosen = useCart((s) => s.regionChosen);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  if (!hydrated) {
    return <div className="flex-1" />;
  }

  if (!regionChosen) {
    return <RegionPicker />;
  }

  return (
    <>
      <header className="flex items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex min-w-0 items-center gap-2">
          <Logo size={32} />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              routrip
            </h1>
            {userEmail ? (
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-500">{userEmail}</p>
            ) : (
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-500">여행 일정 최적화</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <RegionToggle />
          {userEmail ? (
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
      <CartSearchBar />
      <div className="relative flex-1">
        <RegionAwareMap className="absolute inset-0" />
        <CartDrawer />
      </div>
    </>
  );
}
