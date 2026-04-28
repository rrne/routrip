'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

function withError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) withError('/login', '이메일과 비밀번호를 모두 입력해주세요.');

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) withError('/login', error.message);

  revalidatePath('/', 'layout');
  redirect('/');
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
  revalidatePath('/', 'layout');
  redirect('/login');
}
