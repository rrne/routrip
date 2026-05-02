'use server';

import { revalidatePath } from 'next/cache';
import type { Spot } from '@routrip/shared';
import { buildRoute } from '@/lib/route/optimize';
import { createClient } from '@/lib/supabase/server';

type SaveTripInput = {
  name: string;
  spots: Spot[];
};

export async function saveTripAction(
  input: SaveTripInput,
): Promise<{ ok: true; tripId: string } | { ok: false; error: string }> {
  if (!input.spots || input.spots.length < 2) {
    return { ok: false, error: '최소 2개 이상의 장소가 필요합니다.' };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, error: '로그인이 필요합니다.' };

  // 사용자가 정한 순서를 그대로 저장 — 거리만 다시 계산해서 신뢰 (client 값 미신뢰).
  const route = buildRoute(input.spots);

  // 1) spots upsert (kakao_place_id 기준 dedup, 없으면 신규)
  const spotRows = route.spots.map((s) => ({
    kakao_place_id: s.kakaoPlaceId ?? s.id,
    name: s.name,
    address: s.address,
    category: s.category ?? null,
    lat: s.location.lat,
    lng: s.location.lng,
  }));

  const { data: spotsData, error: spotsError } = await supabase
    .from('spots')
    .upsert(spotRows, { onConflict: 'kakao_place_id' })
    .select('id, kakao_place_id');

  if (spotsError) return { ok: false, error: `스팟 저장 실패: ${spotsError.message}` };

  const placeIdToSpotId = new Map(spotsData.map((s) => [s.kakao_place_id, s.id]));

  // 2) trip insert
  const trimmedName = input.name.trim() || '내 여행';
  const { data: tripData, error: tripError } = await supabase
    .from('trips')
    .insert({
      user_id: userData.user.id,
      name: trimmedName,
      total_distance_meters: Math.round(route.totalDistanceMeters),
      optimized_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (tripError || !tripData)
    return { ok: false, error: `여행 저장 실패: ${tripError?.message ?? '알 수 없는 오류'}` };

  // 3) trip_spots bulk insert (최적화된 순서로)
  const tripSpotRows = route.spots.map((s, position) => {
    const spotId = placeIdToSpotId.get(s.kakaoPlaceId ?? s.id);
    return spotId ? { trip_id: tripData.id, spot_id: spotId, position } : null;
  });

  if (tripSpotRows.some((r) => r === null)) {
    return { ok: false, error: '스팟 매핑 실패: 일부 장소를 저장하지 못했습니다.' };
  }

  const { error: tripSpotsError } = await supabase
    .from('trip_spots')
    .insert(tripSpotRows as Exclude<(typeof tripSpotRows)[number], null>[]);

  if (tripSpotsError) {
    // 부분 실패 시 trip은 남는데 spots 매핑은 실패 — 일단 그대로 두고 에러 리턴 (사용자가 재시도하거나 수동 정리)
    return { ok: false, error: `여행 스팟 저장 실패: ${tripSpotsError.message}` };
  }

  revalidatePath('/trips');
  return { ok: true, tripId: tripData.id };
}
