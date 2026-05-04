'use client';

import type { Spot } from '@routrip/shared';
import { loadGoogleMaps } from '@/lib/google/loader';
import type { SearchResult } from './search';

// Google Places API (New) — Place.searchByText.
// JS 키 + HTTP referrer 화이트리스트로 검증되므로 서버 IP 등록 불필요.
export async function searchPlacesGoogle(query: string): Promise<SearchResult> {
  const q = query.trim();
  if (!q) return { ok: true, spots: [] };

  let google;
  try {
    google = await loadGoogleMaps();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'SDK 로드 실패' };
  }

  try {
    const { Place } = await google.maps.importLibrary('places');
    const { places } = await Place.searchByText({
      textQuery: q,
      fields: ['id', 'displayName', 'formattedAddress', 'location', 'primaryTypeDisplayName'],
      language: 'ko',
      maxResultCount: 15,
    });

    const spots: Spot[] = (places ?? []).map((p) => {
      const name = typeof p.displayName === 'string' ? p.displayName : p.displayName?.text ?? '';
      const category = p.primaryTypeDisplayName?.text ?? p.primaryType ?? undefined;
      return {
        id: p.id,
        kakaoPlaceId: p.id, // 스팟 식별용 — provider 무관 외부 id로 사용
        name,
        address: p.formattedAddress ?? '',
        category,
        location: { lat: p.location.lat(), lng: p.location.lng() },
      };
    });

    return { ok: true, spots };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '검색 중 오류가 발생했습니다.' };
  }
}
