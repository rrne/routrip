'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { setSessionMarker, clearSessionMarker } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

const ADJECTIVES = [
  '행복한', '신나는', '빠른', '느린', '큰', '작은', '밝은', '어두운',
  '차가운', '따뜻한', '용감한', '부드러운', '강한', '약한', '똑똑한',
  '우아한', '귀여운', '무서운', '재미있는', '조용한', '시끄러운', '깔끔한',
  '지저분한', '친절한', '거친', '부유한', '못난', '아름다운', '못생긴',
];

const NOUNS = [
  '별', '구름', '바람', '산', '강', '숲', '꽃', '나무',
  '태양', '달', '바다', '하늘', '눈', '비', '바위', '모래',
  '안경', '우산', '모자', '신발', '책', '펜', '열쇠', '시계',
  '카페', '공원', '길', '다리', '계단', '문', '창문', '의자',
];

function generateRandomNickname(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adjective}${noun}`;
}

function withError(path: string, message: string, next?: string): never {
  const params = new URLSearchParams({ error: message });
  if (next) params.set('next', next);
  redirect(`${path}?${params.toString()}`);
}

// open-redirect 방지: 같은 사이트의 path만 허용
function safeNext(value: FormDataEntryValue | null): string {
  const v = String(value ?? '');
  return v.startsWith('/') && !v.startsWith('//') ? v : '/';
}

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = safeNext(formData.get('next'));
  const remember = formData.get('remember') === 'on';

  if (!email || !password)
    withError('/login', '이메일과 비밀번호를 모두 입력해주세요.', next === '/' ? undefined : next);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) withError('/login', error.message, next === '/' ? undefined : next);

  await setSessionMarker(remember);
  revalidatePath('/', 'layout');
  redirect(next);
}

export async function signupAction(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) withError('/signup', '이메일과 비밀번호를 모두 입력해주세요.');
  if (password.length < 6) withError('/signup', '비밀번호는 6자 이상이어야 합니다.');

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) withError('/signup', error.message);

  // 이메일 확인 ON: 메일 발송 후 미확인 상태. OFF: 즉시 세션 생성됨.
  revalidatePath('/', 'layout');
  redirect('/login?message=signup_success');
}

export async function signoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  await clearSessionMarker();
  revalidatePath('/', 'layout');
  redirect('/');
}

// 프로필이 없으면 먼저 생성 (INSERT 시도)
async function ensureProfileExists(supabase: any, userId: string): Promise<void> {
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (!existing) {
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const randomUsername = generateRandomNickname();
      const { error } = await supabase
        .from('profiles')
        .insert([{ id: userId, username: randomUsername }])
        .select();

      if (!error) {
        return;
      }

      if (error.code === '23505') {
        // UNIQUE 제약조건 위반 - 다시 시도
        attempts++;
        continue;
      }

      // 다른 에러는 로깅
      console.warn('⚠️ Failed to create profile:', error);
      return;
    }

    console.warn('⚠️ Failed to create profile after 5 attempts (nickname collision)');
  }
}

export async function updateProfileAction(formData: FormData): Promise<string> {
  const username = String(formData.get('username') ?? '').trim();

  if (!username) return 'error=닉네임을 입력해주세요.';

  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return 'error=로그인이 필요합니다.';

  console.log('📝 Updating profile for user:', user.user.id, 'with username:', username);

  // 먼저 프로필이 없으면 생성
  await ensureProfileExists(supabase, user.user.id);

  // 업데이트 후 업데이트된 프로필 반환
  const { error, data } = await supabase
    .from('profiles')
    .update({ username })
    .eq('id', user.user.id)
    .select();

  console.log('📝 Update response:', { error, data });

  if (error) return `error=${error.message}`;

  revalidatePath('/mypage');

  // 업데이트된 프로필 정보를 JSON으로 반환
  if (data && data.length > 0) {
    return `success=${JSON.stringify(data[0])}`;
  }

  return 'success=닉네임이 변경되었습니다.';
}

export async function updatePasswordAction(formData: FormData): Promise<string> {
  const newPassword = String(formData.get('newPassword') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  if (!newPassword || !confirmPassword) return 'error=새 비밀번호를 입력해주세요.';
  if (newPassword.length < 6) return 'error=비밀번호는 6자 이상이어야 합니다.';
  if (newPassword !== confirmPassword) return 'error=비밀번호가 일치하지 않습니다.';

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) return `error=${error.message}`;

  revalidatePath('/mypage');
  return 'success=비밀번호가 변경되었습니다.';
}
