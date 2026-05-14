import { notFound, redirect } from 'next/navigation';
import type { Region, Spot } from '@routrip/shared';
import { TripDetailEditor } from '@/components/trip-detail-editor';
import { createClient } from '@/lib/supabase/server';

type Params = Promise<{ id: string }>;

export default async function TripDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect(`/login?next=/trips/${id}`);

  const [tripResult, membersResult] = await Promise.all([
    supabase
      .from('trips')
      .select(
        `
        id,
        name,
        user_id,
        region,
        created_at,
        start_date,
        end_date,
        trip_spots (
          position,
          spots (
            id,
            kakao_place_id,
            name,
            address,
            category,
            lat,
            lng
          )
        )
      `,
      )
      .eq('id', id)
      .single(),
    supabase.from('trip_collaborators').select('user_id, role').eq('trip_id', id),
  ]);

  const { data, error } = tripResult;
  if (error || !data) notFound();

  const initialSpots: Spot[] = [...data.trip_spots]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((ts) => ts.spots)
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .map((s) => ({
      id: s.kakao_place_id,
      kakaoPlaceId: s.kakao_place_id,
      name: s.name,
      address: s.address,
      category: s.category ?? undefined,
      location: { lat: s.lat, lng: s.lng },
    }));

  const members = membersResult.data ?? [];
  const isOwner = data.user_id === userData.user.id;

  return (
    <TripDetailEditor
      tripId={data.id}
      initialName={data.name}
      initialSpots={initialSpots}
      region={data.region as Region}
      members={members}
      currentUserId={userData.user.id}
      isOwner={isOwner}
      createdAt={data.created_at}
      initialStartDate={data.start_date}
      initialEndDate={data.end_date}
    />
  );
}
