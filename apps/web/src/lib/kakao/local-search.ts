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

  if (!res.ok) {
    let detail = `${res.status}`;
    try {
      const errBody = (await res.json()) as { errorType?: string; message?: string };
      if (errBody.message) detail = `${res.status} ${errBody.errorType ?? ''} ${errBody.message}`.trim();
    } catch {
      // 본문이 JSON이 아닌 경우 status만
    }
    throw new Error(`Kakao 장소 검색 실패: ${detail}`);
  }

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
