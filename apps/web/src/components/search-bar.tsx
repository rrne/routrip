'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import type { Spot } from '@routrip/shared';
import { searchPlaces } from '@/lib/places/search';
import { useCart } from '@/lib/store/cart';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Spot[]>([]);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  const cartItems = useCart((s) => s.items);
  const addToCart = useCart((s) => s.add);
  const cartIds = new Set(cartItems.map((i) => i.id));

  // 디바운스 검색
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      startTransition(async () => {
        const places = await searchPlaces(q);
        setResults(places);
      });
    }, 200);
    return () => clearTimeout(handle);
  }, [query]);

  // 바깥 클릭 시 결과 닫기
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleAdd = (spot: Spot) => {
    addToCart(spot);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative border-b border-zinc-200 dark:border-zinc-800">
      <div className="px-4 py-2">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="장소 검색 (예: 경복궁, 강남역, 명동)"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 max-h-80 overflow-y-auto border-b border-zinc-200 bg-white shadow-md dark:border-zinc-800 dark:bg-zinc-950">
          <ul>
            {results.map((spot) => {
              const inCart = cartIds.has(spot.id);
              return (
                <li key={spot.id}>
                  <button
                    type="button"
                    disabled={inCart}
                    onClick={() => handleAdd(spot)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-900"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {spot.name}
                      </p>
                      <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {spot.address}
                      </p>
                    </div>
                    {inCart ? (
                      <span className="shrink-0 rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        담음
                      </span>
                    ) : (
                      <span className="shrink-0 text-xs font-medium text-zinc-900 dark:text-zinc-50">
                        + 담기
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {open && query.trim() && results.length === 0 && (
        <div className="absolute left-0 right-0 top-full z-20 border-b border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-500 shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          검색 결과가 없습니다.
        </div>
      )}
    </div>
  );
}
