import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// 사람이 읽기 좋은 6자 코드 (혼동되는 O/0, I/1 제외)
function generateGroupCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  let out = '';
  for (let i = 0; i < length; i++) out += chars[arr[i] % chars.length];
  return out;
}

// POST /api/groups - 그룹 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const description =
      typeof body.description === 'string' && body.description.trim().length > 0
        ? body.description.trim()
        : null;
    const coverImageUrl =
      typeof body.cover_image_url === 'string' && body.cover_image_url.length > 0
        ? body.cover_image_url
        : null;

    if (name.length === 0) {
      return NextResponse.json({ error: '그룹 이름을 입력해주세요.' }, { status: 400 });
    }
    if (name.length > 60) {
      return NextResponse.json({ error: '그룹 이름은 60자 이하로 작성해주세요.' }, { status: 400 });
    }

    // 코드 충돌 시 최대 5번 재시도
    let inserted: unknown = null;
    let lastError: { message: string } | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateGroupCode();
      const { data, error } = await supabase
        .from('groups')
        // @ts-expect-error - groups 타입이 db types에 아직 반영되지 않음
        .insert([{ owner_id: user.user.id, name, description, cover_image_url: coverImageUrl, code }])
        .select()
        .single();

      if (!error) {
        inserted = data;
        break;
      }
      // 23505 = unique_violation → code 재발급 후 재시도
      if ((error as { code?: string }).code === '23505') {
        lastError = error;
        continue;
      }
      lastError = error;
      break;
    }

    if (!inserted) {
      return NextResponse.json(
        { error: lastError?.message ?? '그룹 생성에 실패했습니다.' },
        { status: 500 },
      );
    }

    return NextResponse.json(inserted, { status: 201 });
  } catch (error) {
    console.error('그룹 생성 에러:', error);
    return NextResponse.json({ error: '그룹 생성에 실패했습니다.' }, { status: 500 });
  }
}

// GET /api/groups - 내 그룹 목록 조회
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name, owner_id, created_at, group_members(id, user_id, can_edit)')
      .order('created_at', { ascending: false });

    if (groupsError) {
      console.error('그룹 목록 조회 Supabase 에러:', groupsError);
      return NextResponse.json({ error: groupsError.message }, { status: 500 });
    }

    type GroupRow = {
      id: string;
      name: string;
      owner_id: string;
      created_at: string;
      cover_image_url?: string | null;
      description?: string | null;
      group_members?: Array<{ id: string; user_id: string; can_edit: boolean }>;
    };
    const typedGroups = (groups ?? []) as unknown as GroupRow[];

    if (typedGroups.length === 0) {
      return NextResponse.json([]);
    }

    const userIds = Array.from(
      new Set(
        typedGroups.flatMap((g) => g.group_members?.map((m) => m.user_id) ?? []),
      ),
    );

    let profilesMap: Record<string, { id: string; username: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      if (profilesError) {
        console.error('프로필 조회 에러:', profilesError);
      } else if (profiles) {
        profilesMap = Object.fromEntries(profiles.map((p) => [p.id, p]));
      }
    }

    const result = typedGroups.map((g) => ({
      ...g,
      group_members: (g.group_members ?? []).map((m) => ({
        ...m,
        profiles: profilesMap[m.user_id] ?? null,
      })),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('그룹 목록 조회 에러:', error);
    return NextResponse.json({ error: '그룹 목록 조회에 실패했습니다.' }, { status: 500 });
  }
}
