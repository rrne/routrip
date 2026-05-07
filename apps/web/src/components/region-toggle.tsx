'use client';

import { useEffect, useState } from 'react';
import type { Region } from '@routrip/shared';
import { useCart } from '@/lib/store/cart';

const LABELS: Record<Region, { flag: string; text: string }> = {
  domestic: { flag: '🇰🇷', text: '국내' },
  overseas: { flag: '🌏', text: '해외' },
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
      !confirm(
        `${LABELS[next].text}로 바꾸면 담은 ${items.length}개 장소가 모두 삭제됩니다. 계속할까요?`,
      )
    ) {
      return;
    }
    setRegion(next);
  };

  const current = LABELS[display];

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex cursor-pointer items-center gap-1 rounded-full border border-zinc-300 px-2 py-0.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      title={`${current.text} (탭하여 전환)`}
    >
      <span aria-hidden>{current.flag}</span>
      <span>{current.text}</span>
    </button>
  );
}
