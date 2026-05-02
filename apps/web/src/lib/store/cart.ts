'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Spot } from '@routrip/shared';

type CartState = {
  items: Spot[];
  add: (spot: Spot) => void;
  remove: (spotId: string) => void;
  clear: () => void;
  has: (spotId: string) => boolean;
  move: (spotId: string, direction: 'up' | 'down') => void;
  setItems: (items: Spot[]) => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (spot) =>
        set((s) => (s.items.some((i) => i.id === spot.id) ? s : { items: [...s.items, spot] })),
      remove: (spotId) => set((s) => ({ items: s.items.filter((i) => i.id !== spotId) })),
      clear: () => set({ items: [] }),
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
      setItems: (items) => set({ items }),
    }),
    {
      name: 'routrip-cart',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
