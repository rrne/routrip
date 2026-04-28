'use server';

import type { Spot } from '@routrip/shared';
import { MOCK_SPOTS } from './mock-data';

// 카카오 OPEN_MAP_AND_LOCAL 권한 풀리면 이 함수만 카카오 Local API 호출로 교체하면 됨.
// 형태(Spot[])는 동일하게 유지.
export async function searchPlaces(query: string): Promise<Spot[]> {
  const q = query.trim();
  if (!q) return [];

  const lowered = q.toLowerCase();
  return MOCK_SPOTS.filter(
    (s) =>
      s.name.toLowerCase().includes(lowered) ||
      s.address.toLowerCase().includes(lowered) ||
      (s.category?.toLowerCase().includes(lowered) ?? false),
  );
}
