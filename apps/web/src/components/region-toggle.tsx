'use client';

import { useEffect, useState } from 'react';
import type { Region } from '@routrip/shared';
import { useCart } from '@/lib/store/cart';

const LABELS: Record<Region, string> = {
  domestic: '국내',
  overseas: 'Global',
};

type Props = {
  className?: string;
};

export function RegionToggle({ className = '' }: Props) {
  const region = useCart((s) => s.region);
  const regionChosen = useCart((s) => s.regionChosen);
  const setRegion = useCart((s) => s.setRegion);
  const items = useCart((s) => s.items);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  if (!hydrated || !regionChosen) return null;

  const next: Region = region === 'domestic' ? 'overseas' : 'domestic';

  const toggle = () => {
    if (
      items.length > 0 &&
      !confirm(
        `${LABELS[next]}로 바꾸면 담은 ${items.length}개 장소가 모두 삭제됩니다. 계속할까요?`,
      )
    ) {
      return;
    }
    setRegion(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`현재 ${LABELS[region]} — 탭하여 ${LABELS[next]}로 전환`}
      title={`${LABELS[region]} → ${LABELS[next]}`}
      className={`flex h-14 w-14 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-full border border-zinc-200 bg-white text-[#134e5e] shadow-[0_6px_16px_-6px_rgba(0,0,0,0.25)] transition-all hover:scale-105 hover:border-[#134e5e] active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-[#7fb5c4] ${className}`}
    >
      {next === 'domestic' ? <PeninsulaIcon /> : <GlobeIcon />}
      <span className="text-[9px] font-semibold tracking-wide">{LABELS[next]}</span>
    </button>
  );
}

function PeninsulaIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="h-5 w-5"
    >
      <path d="M3 18l5-7 3.5 4.5L15 11l6 7" />
      <path d="M3 18h18" />
      <circle cx="16" cy="6" r="1.2" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="h-5 w-5"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.8 3.8 5.8 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-5.8-3.8-9s1.3-6.2 3.8-9z" />
    </svg>
  );
}
