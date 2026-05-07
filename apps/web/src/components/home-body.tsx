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
};

// 첫 방문엔 picker만 (헤더 X), 선택 후엔 헤더 + 지도/장바구니.
export function HomeBody({ isLoggedIn }: Props) {
  const regionChosen = useCart((s) => s.regionChosen);
  const resetToRegionPicker = useCart((s) => s.resetToRegionPicker);
  const [hydrated, setHydrated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);

    // 프로필 로드
    if (isLoggedIn) {
      const loadProfile = async () => {
        const supabase = await createClient();
        const { data: user } = await supabase.auth.getUser();

        if (user.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.user.id)
            .single();

          if (profile?.username) {
            setUsername(profile.username);
          }
        }
      };

      loadProfile();
    }
  }, [isLoggedIn]);

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
              className="rounded-md px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              그룹
            </Link>
          )}
          {isLoggedIn ? (
            <Link
              href="/mypage"
              aria-label="내 정보"
              className="flex cursor-pointer items-center gap-2 rounded-full px-3 py-1 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
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
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
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
