'use client';

import type { Region } from '@routrip/shared';
import { Logo } from '@/components/logo';
import { useCart } from '@/lib/store/cart';

const OPTIONS: Array<{
  region: Region;
  flag: string;
  title: string;
  subtitle: string;
}> = [
  { region: 'domestic', flag: '🇰🇷', title: '국내 여행', subtitle: '카카오 지도 · 한국 장소 검색' },
  { region: 'overseas', flag: '🌏', title: '해외 여행', subtitle: '구글 지도 · 글로벌 장소 검색' },
];

export function RegionPicker() {
  const setRegion = useCart((s) => s.setRegion);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="flex w-full flex-col items-center gap-8">
        <div className="flex flex-col items-center text-center">
          <Logo size={88} priority />
          <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            어떤 여행이세요?
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            나중에 헤더에서 다시 바꿀 수 있어요.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          {OPTIONS.map((opt) => (
            <button
              key={opt.region}
              type="button"
              onClick={() => setRegion(opt.region)}
              className="flex items-center gap-4 rounded-xl border border-zinc-300 bg-white px-4 py-4 text-left transition-colors hover:border-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-50 dark:hover:bg-zinc-800"
            >
              <span className="text-3xl" aria-hidden>
                {opt.flag}
              </span>
              <span className="flex-1">
                <span className="block text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  {opt.title}
                </span>
                <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                  {opt.subtitle}
                </span>
              </span>
              <span aria-hidden className="text-zinc-400 dark:text-zinc-600">
                →
              </span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
