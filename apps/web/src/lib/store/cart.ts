'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Region, Spot } from '@routrip/shared';

type CartState = {
  items: Spot[];
  // /route 페이지에서 잠근 스팟 id (자동 정렬 시 위치 유지). 새로고침해도 유지.
  lockedIds: string[];
  // 국내/해외 여행 모드. 지도/검색 provider 결정 (Kakao vs Google).
  region: Region;
  add: (spot: Spot) => void;
  remove: (spotId: string) => void;
  clear: () => void;
  has: (spotId: string) => boolean;
  move: (spotId: string, direction: 'up' | 'down') => void;
  setItems: (items: Spot[]) => void;
  toggleLock: (spotId: string) => void;
  isLocked: (spotId: string) => boolean;
  setRegion: (region: Region) => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      lockedIds: [],
      region: 'domestic',
      add: (spot) =>
        set((s) => (s.items.some((i) => i.id === spot.id) ? s : { items: [...s.items, spot] })),
      remove: (spotId) =>
        set((s) => ({
          items: s.items.filter((i) => i.id !== spotId),
          lockedIds: s.lockedIds.filter((id) => id !== spotId),
        })),
      clear: () => set({ items: [], lockedIds: [] }),
      has: (spotId) => get().items.some((i) => i.id === spotId),
      move: (spotId, direction) =>
        set((s) => {
          const idx = s.items.findIndex((i) => i.id === spotId);
          if (idx === -1) return s;
          const target = direction === 'up' ? idx - 1 : idx + 1;
          if (target < 0 || target >= s.items.length) return s;
          const next = [...s.items];
          [next[idx], next[target]] = [next[target], next[idx]];
          return { items: next };
        }),
      setItems: (items) =>
        set((s) => ({
          items,
          // 더 이상 cart에 없는 락은 정리
          lockedIds: s.lockedIds.filter((id) => items.some((i) => i.id === id)),
        })),
      toggleLock: (spotId) =>
        set((s) =>
          s.lockedIds.includes(spotId)
            ? { lockedIds: s.lockedIds.filter((id) => id !== spotId) }
            : { lockedIds: [...s.lockedIds, spotId] },
        ),
      isLocked: (spotId) => get().lockedIds.includes(spotId),
      // region 변경 시 cart는 비움 (국내↔해외 spot이 섞이면 의미없음)
      setRegion: (region) =>
        set((s) => (s.region === region ? s : { region, items: [], lockedIds: [] })),
    }),
    {
      name: 'routrip-cart',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
