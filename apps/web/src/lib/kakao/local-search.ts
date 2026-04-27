import 'server-only';
import type { Spot } from '@routrip/shared';

type KakaoLocalDoc = {
  id: string;
  place_name: string;
  road_address_name?: string;
  address_name: string;
  category_name: string;
  x: string;
  y: string;
};

type KakaoLocalResponse = {
  documents: KakaoLocalDoc[];
  meta: { total_count: number; pageable_count: number; is_end: boolean };
};

export async function searchKakaoPlaces(query: string, page = 1): Promise<Spot[]> {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) throw new Error('KAKAO_REST_API_KEY 환경변수가 없습니다.');

  const url = new URL('https://dapi.kakao.com/v2/local/search/keyword.json');
  url.searchParams.set('query', query);
  url.searchParams.set('page', String(page));
  url.searchParams.set('size', '15');

  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${key}` },
    next: { revalidate: 60 },
  });

  if (!res.ok) throw new Error(`Kakao 장소 검색 실패: ${res.status}`);

  const data: KakaoLocalResponse = await res.json();

  return data.documents.map((d) => ({
    id: d.id,
    name: d.place_name,
    address: d.road_address_name || d.address_name,
    category: d.category_name,
    location: { lat: Number(d.y), lng: Number(d.x) },
    kakaoPlaceId: d.id,
  }));
}
