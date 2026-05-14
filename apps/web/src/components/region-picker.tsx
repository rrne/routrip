'use client';

import type { Region } from '@routrip/shared';
import { useCart } from '@/lib/store/cart';

type Option = {
  region: Region;
  title: string;
  subtitle: string;
  description: string;
  illustration: 'peninsula' | 'globe';
};

const OPTIONS: Option[] = [
  {
    region: 'domestic',
    title: '국내',
    subtitle: 'Domestic',
    description: '제주부터 강릉까지, 가까운 곳부터',
    illustration: 'peninsula',
  },
  {
    region: 'overseas',
    title: '해외',
    subtitle: 'Worldwide',
    description: '도쿄, 파리, 그 어디든',
    illustration: 'globe',
  },
];

export function RegionPicker() {
  const setRegion = useCart((s) => s.setRegion);

  return (
    <main className="flex flex-1 flex-col px-6 pt-20 pb-10">
      <header className="flex flex-col items-start">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
          Destination
        </p>
        <h2 className="mt-3 text-[30px] font-extrabold leading-[1.4] tracking-tight text-zinc-900 dark:text-zinc-50">
          다음 여행은,
          <br />
          어디에서 시작할까요
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          가고 싶은 곳을 담아서 최단의 루트를 계산해드립니다.
          <br />
          친구들과 함께 여행계획을 짜보아요!
        </p>
      </header>

      <div className="flex flex-1 flex-col justify-center gap-3 pt-8 pb-24">
        {OPTIONS.map((opt) => (
          <button
            key={opt.region}
            type="button"
            onClick={() => setRegion(opt.region)}
            className="group relative flex cursor-pointer items-center gap-5 overflow-hidden rounded-2xl border border-zinc-200 bg-white px-5 py-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#134e5e] hover:shadow-[0_8px_24px_-12px_rgba(19,78,94,0.35)] dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-[#134e5e] dark:hover:shadow-[0_8px_24px_-12px_rgba(19,78,94,0.5)]"
          >
            <span
              aria-hidden
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-50 text-zinc-700 transition-colors group-hover:bg-[#134e5e] group-hover:text-zinc-50 dark:bg-zinc-900 dark:text-zinc-300 dark:group-hover:bg-[#134e5e] dark:group-hover:text-zinc-50"
            >
              {opt.illustration === 'peninsula' ? <PeninsulaIcon /> : <GlobeIcon />}
            </span>

            <span className="flex flex-1 flex-col">
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
                {opt.subtitle}
              </span>
              <span className="mt-0.5 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {opt.title} 여행
              </span>
              <span className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {opt.description}
              </span>
            </span>

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className="h-5 w-5 shrink-0 text-zinc-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#134e5e] dark:text-zinc-700 dark:group-hover:text-[#134e5e]"
            >
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </button>
        ))}
      </div>

    </main>
  );
}

function PeninsulaIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="h-7 w-7"
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
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="h-7 w-7"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.8 3.8 5.8 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-5.8-3.8-9s1.3-6.2 3.8-9z" />
    </svg>
  );
}
