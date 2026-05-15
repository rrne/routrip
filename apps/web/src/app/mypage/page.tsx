'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfileAction, updatePasswordAction, signoutAction } from '@/lib/auth/actions';
import { useCart } from '@/lib/store/cart';
import { createClient } from '@/lib/supabase/client';

export default function MyPage() {
  const router = useRouter();
  const resetToRegionPicker = useCart((s) => s.resetToRegionPicker);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleSignout = async () => {
    // 로그아웃 직전에 region picker 로 초기화 — 로그아웃 후 홈 진입 시 메인부터
    resetToRegionPicker();
    await signoutAction();
  };

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        router.push('/login?next=/mypage');
        return;
      }

      setUser(userData.user);

      // 먼저 프로필 생성 API 호출 (프로필이 없으면 생성)
      await fetch('/api/profile', { method: 'POST' }).catch(() => {});

      let { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id);

      if (profileData && profileData.length > 0) {
        setProfile(profileData[0]);
      }
      setLoading(false);
    };

    loadProfile();

  }, [router]);

  useEffect(() => {
    if (showProfileModal || showPasswordModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showProfileModal, showPasswordModal]);

  const handleUpdateProfile = async (formData: FormData) => {
    try {
      const result = await updateProfileAction(formData);
      console.log('Update result:', result);

      if (result.startsWith('success=')) {
        const successMsg = result.substring(8); // 'success=' 제거

        // JSON 형식의 프로필 데이터가 있으면 파싱
        try {
          const updatedProfile = JSON.parse(successMsg);
          if (updatedProfile && updatedProfile.username) {
            setProfile(updatedProfile);
            setMessage('success=닉네임이 변경되었습니다.');
          } else {
            setMessage(result);
          }
        } catch {
          // JSON 파싱 실패하면 원본 메시지 사용
          setMessage(result);
        }

        setShowProfileModal(false);
      } else {
        setMessage(result);
      }
    } catch (error) {
      console.error('Error in handleUpdateProfile:', error);
      setMessage(`error=${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const handleUpdatePassword = async (formData: FormData) => {
    const result = await updatePasswordAction(formData);
    setMessage(result);
    if (result.startsWith('success=')) {
      setShowPasswordModal(false);
      setTimeout(() => router.refresh(), 500);
    }
  };

  if (loading) {
    return <div className="flex flex-1 items-center justify-center">로딩 중...</div>;
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <Link
          href="/"
          aria-label="홈으로"
          className="cursor-pointer rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="h-5 w-5"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          내 정보
        </h1>
      </header>

      <main className="flex flex-1 flex-col gap-6 px-4 py-6">
        {message && (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              message.startsWith('success=')
                ? 'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-100'
                : 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-100'
            }`}
          >
            {message.split('=')[1]}
          </div>
        )}

        {/* 이메일 */}
        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">로그인 계정</p>
          <p className="mt-1 break-all text-base text-zinc-900 dark:text-zinc-50">
            {user?.email}
          </p>
        </section>

        {/* 닉네임 변경 */}
        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">닉네임</p>
              <p className="mt-1 text-base text-zinc-900 dark:text-zinc-50">
                {profile?.username || '미설정'}
              </p>
            </div>
            <button
              onClick={() => setShowProfileModal(true)}
              className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              변경
            </button>
          </div>
        </section>

        {/* 내 여행 목록 */}
        <Link
          href="/trips"
          className="cursor-pointer flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          내 여행 목록
          <span aria-hidden className="text-zinc-400">›</span>
        </Link>

        {/* 비밀번호 변경 */}
        <button
          onClick={() => setShowPasswordModal(true)}
          className="cursor-pointer w-full rounded-xl border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          비밀번호 변경
        </button>

        {/* 로그아웃 */}
        <div className="mt-auto">
          <button
            type="button"
            onClick={handleSignout}
            className="cursor-pointer w-full rounded-xl border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            로그아웃
          </button>
        </div>
      </main>

      {/* 닉네임 변경 모달 */}
      {showProfileModal && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/30 p-0 sm:items-center"
          onClick={() => setShowProfileModal(false)}
        >
          <div
            className="w-full rounded-t-2xl bg-white p-6 dark:bg-zinc-900 rounded-b-none sm:max-w-md sm:rounded-xl sm:rounded-b-none"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              닉네임 변경
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleUpdateProfile(formData);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  새 닉네임
                </label>
                <input
                  type="text"
                  name="username"
                  defaultValue={profile?.username || ''}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  placeholder="닉네임을 입력해주세요"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="cursor-pointer flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="cursor-pointer flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-100"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 비밀번호 변경 모달 */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/30 p-0 sm:items-center"
          onClick={() => setShowPasswordModal(false)}
        >
          <div
            className="w-full rounded-t-2xl bg-white p-6 dark:bg-zinc-900 rounded-b-none sm:max-w-md sm:rounded-xl sm:rounded-b-none"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              비밀번호 변경
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleUpdatePassword(formData);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  name="newPassword"
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  placeholder="새 비밀번호 (6자 이상)"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  placeholder="비밀번호 확인"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="cursor-pointer flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="cursor-pointer flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-100"
                >
                  변경
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
