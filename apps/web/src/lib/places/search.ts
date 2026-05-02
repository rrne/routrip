'use server';

import type { Spot } from '@routrip/shared';
import { searchKakaoPlaces } from '@/lib/kakao/local-search';

export type SearchResult =
  | { ok: true; spots: Spot[] }
  | { ok: false; error: string };

export async function searchPlaces(query: string): Promise<SearchResult> {
  const q = query.trim();
  if (!q) return { ok: true, spots: [] };

  try {
    const spots = await searchKakaoPlaces(q);
    return { ok: true, spots };
  } catch (e) {
    const message = e instanceof Error ? e.message : '검색 중 오류가 발생했습니다.';
    return { ok: false, error: message };
  }
}
