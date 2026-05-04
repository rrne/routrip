'use client';

import { useEffect, useState } from 'react';
import { CartDrawer } from '@/components/cart-drawer';
import { CartSearchBar } from '@/components/cart-search-bar';
import { RegionAwareMap } from '@/components/region-aware-map';
import { RegionPicker } from '@/components/region-picker';
import { useCart } from '@/lib/store/cart';

// 첫 방문 시 region 선택 화면, 이후엔 검색바 + 지도 + 장바구니.
export function HomeBody() {
  const regionChosen = useCart((s) => s.regionChosen);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  // 하이드레이션 끝나기 전엔 빈 화면 (picker가 깜빡 보였다 사라지는 걸 방지)
  if (!hydrated) {
    return <div className="flex-1" />;
  }

  if (!regionChosen) {
    return <RegionPicker />;
  }

  return (
    <>
      <CartSearchBar />
      <div className="relative flex-1">
        <RegionAwareMap className="absolute inset-0" />
        <CartDrawer />
      </div>
    </>
  );
}
