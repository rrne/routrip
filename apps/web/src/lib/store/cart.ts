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
    }),
    {
      name: 'routrip-cart',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
