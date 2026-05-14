import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/groups/[id] - 그룹 상세 (멤버 + 여행 목록 + 경로)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 1) 그룹 본체 + 멤버 (profiles 임베드 X — FK 부재로 별도 조회)
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select(
        'id, name, owner_id, description, cover_image_url, code, created_at, group_members(id, user_id, can_edit, joined_at)',
      )
      .eq('id', id)
      .maybeSingle();

    if (groupError) {
      return NextResponse.json({ error: groupError.message }, { status: 500 });
    }
    if (!group) {
      return NextResponse.json({ error: '그룹을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 2) owner + 멤버 user_id 모아서 profiles 조회
    const typedGroup = group as unknown as {
      owner_id: string;
      group_members: Array<{ id: string; user_id: string; can_edit: boolean; joined_at: string }>;
    };
    const userIds = Array.from(
      new Set([typedGroup.owner_id, ...typedGroup.group_members.map((m) => m.user_id)]),
    );
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', userIds);

    const profilesMap: Record<string, { id: string; username: string | null }> = {};
    for (const p of profiles ?? []) {
      profilesMap[(p as { id: string }).id] = p as { id: string; username: string | null };
    }

    // 3) 이 그룹의 여행 목록
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select('id, name, region, trip_date, total_distance_meters, optimized_at, created_at')
      .eq('group_id', id)
      .order('created_at', { ascending: false });

    if (tripsError) {
      console.error('그룹 여행 조회 에러:', tripsError);
    }

    // 4) 각 여행의 스팟(경로) — trip_spots + spots
    const tripIds = (trips ?? []).map((t) => (t as { id: string }).id);
    let spotsByTrip: Record<
      string,
      Array<{ position: number | null; name: string; address: string }>
    > = {};
    if (tripIds.length > 0) {
      const { data: tripSpots } = await supabase
        .from('trip_spots')
        .select('trip_id, position, spots(name, address)')
        .in('trip_id', tripIds)
        .order('position', { ascending: true });

      spotsByTrip = (tripSpots ?? []).reduce<typeof spotsByTrip>((acc, row) => {
        const r = row as unknown as {
          trip_id: string;
          position: number | null;
          spots: { name: string; address: string } | null;
        };
        if (!r.spots) return acc;
        (acc[r.trip_id] ??= []).push({
          position: r.position,
          name: r.spots.name,
          address: r.spots.address,
        });
        return acc;
      }, {});
    }

    // 5) 응답 조립
    const response = {
      id: typedGroup.owner_id ? (group as { id: string }).id : id,
      ...group,
      owner: profilesMap[typedGroup.owner_id] ?? { id: typedGroup.owner_id, username: null },
      members: typedGroup.group_members.map((m) => ({
        id: m.id,
        user_id: m.user_id,
        can_edit: m.can_edit,
        joined_at: m.joined_at,
        profile: profilesMap[m.user_id] ?? { id: m.user_id, username: null },
      })),
      trips: (trips ?? []).map((t) => {
        const trip = t as {
          id: string;
          name: string;
          region: string;
          trip_date: string | null;
          total_distance_meters: number | null;
          optimized_at: string | null;
          created_at: string;
        };
        return {
          ...trip,
          spots: spotsByTrip[trip.id] ?? [],
        };
      }),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('그룹 상세 조회 에러:', error);
    return NextResponse.json({ error: '그룹 조회에 실패했습니다.' }, { status: 500 });
  }
}

// PATCH /api/groups/[id] - 그룹 정보 수정 (owner만)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { data: group, error: fetchError } = await supabase
      .from('groups')
      .select('owner_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !group) {
      return NextResponse.json({ error: '그룹을 찾을 수 없습니다.' }, { status: 404 });
    }
    if ((group as { owner_id: string }).owner_id !== user.user.id) {
      return NextResponse.json({ error: '그룹 owner만 수정할 수 있습니다.' }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (typeof body.name === 'string' && body.name.trim().length > 0) {
      updates.name = body.name.trim();
    }
    if (typeof body.description === 'string') {
      updates.description = body.description.trim() || null;
    }
    if (typeof body.cover_image_url === 'string' || body.cover_image_url === null) {
      updates.cover_image_url = body.cover_image_url;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: '수정할 내용이 없습니다.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('groups')
      // @ts-expect-error - supabase type inference issue
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data?.[0]);
  } catch (error) {
    console.error('그룹 수정 에러:', error);
    return NextResponse.json({ error: '그룹 수정에 실패했습니다.' }, { status: 500 });
  }
}

// DELETE /api/groups/[id] - 그룹 삭제 (owner만)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { data: group, error: fetchError } = await supabase
      .from('groups')
      .select('owner_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !group) {
      return NextResponse.json({ error: '그룹을 찾을 수 없습니다.' }, { status: 404 });
    }
    if ((group as { owner_id: string }).owner_id !== user.user.id) {
      return NextResponse.json({ error: '그룹 owner만 삭제할 수 있습니다.' }, { status: 403 });
    }

    const { error } = await supabase.from('groups').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('그룹 삭제 에러:', error);
    return NextResponse.json({ error: '그룹 삭제에 실패했습니다.' }, { status: 500 });
  }
}
