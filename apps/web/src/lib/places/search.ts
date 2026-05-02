'use client';

import type { Spot } from '@routrip/shared';
import { loadKakaoMaps } from '@/lib/kakao/loader';

export type SearchResult =
  | { ok: true; spots: Spot[] }
  | { ok: false; error: string };

// 카카오 Maps SDK의 services.Places로 클라이언트 사이드 검색.
// REST 키 IP 화이트리스트가 아닌 JS 키 + 도메인 화이트리스트로 검증되므로
// localhost와 Vercel(고정 IP 없음) 모두에서 동일하게 작동.
export async function searchPlaces(query: string): Promise<SearchResult> {
  const q = query.trim();
  if (!q) return { ok: true, spots: [] };

  let kakao;
  try {
    kakao = await loadKakaoMaps();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'SDK 로드 실패' };
  }

  return new Promise<SearchResult>((resolve) => {
    const places = new kakao.maps.services.Places();
    places.keywordSearch(
      q,
      (data, status) => {
        if (status === 'OK') {
          const spots: Spot[] = data.map((d) => ({
            id: d.id,
            name: d.place_name,
            address: d.road_address_name || d.address_name,
            category: d.category_name,
            location: { lat: Number(d.y), lng: Number(d.x) },
            kakaoPlaceId: d.id,
          }));
          resolve({ ok: true, spots });
        } else if (status === 'ZERO_RESULT') {
          resolve({ ok: true, spots: [] });
        } else {
          resolve({ ok: false, error: '검색 중 오류가 발생했습니다.' });
        }
      },
      { size: 15 },
    );
  });
}
