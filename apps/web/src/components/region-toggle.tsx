'use client';

import { useEffect, useState } from 'react';
import type { Region } from '@routrip/shared';
import { useCart } from '@/lib/store/cart';

const LABELS: Record<Region, string> = {
  domestic: '국내',
  overseas: '해외',
};

export function RegionToggle() {
  const region = useCart((s) => s.region);
  const regionChosen = useCart((s) => s.regionChosen);
  const setRegion = useCart((s) => s.setRegion);
  const items = useCart((s) => s.items);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  // 아직 picker 단계면 헤더 토글 숨김 (선택 충돌 방지)
  if (!hydrated || !regionChosen) return null;

  const display = region;

  const toggle = () => {
    const next: Region = region === 'domestic' ? 'overseas' : 'domestic';
    if (
      items.length > 0 &&
      !confirm(`${LABELS[next]} 모드로 바꾸면 담은 ${items.length}개 장소가 모두 삭제됩니다. 계속할까요?`)
    ) {
      return;
    }
    setRegion(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-full border border-zinc-300 px-2.5 py-0.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      title={`현재 ${LABELS[display]} 모드`}
    >
      {LABELS[display]} 모드
    </button>
  );
}
