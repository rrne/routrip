'use client';

import type { Region, Spot } from '@routrip/shared';
import { loadKakaoMaps } from '@/lib/kakao/loader';
import { searchPlacesGoogle } from './search-google';

export type SearchResult =
  | { ok: true; spots: Spot[] }
  | { ok: false; error: string };

async function searchPlacesKakao(query: string): Promise<SearchResult> {
  let kakao;
  try {
    kakao = await loadKakaoMaps();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'SDK 로드 실패' };
  }

  return new Promise<SearchResult>((resolve) => {
    const places = new kakao.maps.services.Places();
    places.keywordSearch(
      query,
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

// region에 따라 provider 분기 — 'domestic' = 카카오, 'overseas' = 구글.
export async function searchPlaces(
  query: string,
  region: Region = 'domestic',
): Promise<SearchResult> {
  const q = query.trim();
  if (!q) return { ok: true, spots: [] };
  return region === 'overseas' ? searchPlacesGoogle(q) : searchPlacesKakao(q);
}
