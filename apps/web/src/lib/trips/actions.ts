'use server';

import { revalidatePath } from 'next/cache';
import type { Region, Spot } from '@routrip/shared';
import { buildRoute } from '@/lib/route/optimize';
import { createClient } from '@/lib/supabase/server';

type SaveTripInput = {
  name: string;
  spots: Spot[];
  region: Region;
  groupId?: string;
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

  // 그룹 여행이면 권한 확인
  if (input.groupId) {
    const { data: member } = await supabase
      .from('group_members')
      .select('can_edit')
      .eq('group_id', input.groupId)
      .eq('user_id', userData.user.id)
      .maybeSingle();

    if (!member || !(member as { can_edit: boolean }).can_edit) {
      return { ok: false, error: '이 그룹에 여행을 추가할 권한이 없습니다.' };
    }
  }

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
    // @ts-expect-error - supabase type inference issue
    .insert({
      user_id: userData.user.id,
      name: trimmedName,
      region: input.region,
      group_id: input.groupId ?? null,
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

type UpdateTripInput = {
  tripId: string;
  name: string;
  spots: Spot[];
};

export async function updateTripAction(
  input: UpdateTripInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.spots || input.spots.length < 2) {
    return { ok: false, error: '최소 2개 이상의 장소가 필요합니다.' };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, error: '로그인이 필요합니다.' };

  const route = buildRoute(input.spots);

  // 1) spots upsert (신규 spot도 들어올 수 있음)
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

  // 2) trip 메타 갱신 (이름, 총거리). RLS로 collaborator/owner만 가능.
  const trimmedName = input.name.trim() || '내 여행';
  const { error: tripError } = await supabase
    .from('trips')
    .update({
      name: trimmedName,
      total_distance_meters: Math.round(route.totalDistanceMeters),
    })
    .eq('id', input.tripId);
  if (tripError) return { ok: false, error: `여행 갱신 실패: ${tripError.message}` };

  // 3) trip_spots 전체 교체 (delete + bulk insert)
  const { error: deleteError } = await supabase
    .from('trip_spots')
    .delete()
    .eq('trip_id', input.tripId);
  if (deleteError) return { ok: false, error: `기존 스팟 삭제 실패: ${deleteError.message}` };

  const tripSpotRows = route.spots.map((s, position) => {
    const spotId = placeIdToSpotId.get(s.kakaoPlaceId ?? s.id);
    return spotId ? { trip_id: input.tripId, spot_id: spotId, position } : null;
  });

  if (tripSpotRows.some((r) => r === null)) {
    return { ok: false, error: '스팟 매핑 실패' };
  }

  const { error: insertError } = await supabase
    .from('trip_spots')
    .insert(tripSpotRows as Exclude<(typeof tripSpotRows)[number], null>[]);

  if (insertError) {
    return { ok: false, error: `스팟 저장 실패: ${insertError.message}` };
  }

  revalidatePath(`/trips/${input.tripId}`);
  revalidatePath('/trips');
  return { ok: true };
}

export async function deleteTripAction(
  tripId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, error: '로그인이 필요합니다.' };

  // RLS의 "Users can delete their own trips" 정책으로 owner만 통과.
  const { error } = await supabase.from('trips').delete().eq('id', tripId);
  if (error) return { ok: false, error: `삭제 실패 (소유자만 가능): ${error.message}` };

  revalidatePath('/trips');
  return { ok: true };
}
