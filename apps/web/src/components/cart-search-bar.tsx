'use client';

import { SearchBar } from '@/components/search-bar';
import { useCart } from '@/lib/store/cart';

// home 페이지용 — SearchBar를 cart store와 연결.
export function CartSearchBar() {
  const add = useCart((s) => s.add);
  const has = useCart((s) => s.has);
  const region = useCart((s) => s.region);
  return <SearchBar onAdd={add} isAdded={has} region={region} />;
}
