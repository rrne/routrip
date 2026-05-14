'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Profile {
  id: string;
  username: string | null;
}

interface Member {
  id: string;
  user_id: string;
  can_edit: boolean;
  joined_at: string;
  profile: Profile;
}

interface TripSpot {
  position: number | null;
  name: string;
  address: string;
}

interface Trip {
  id: string;
  name: string;
  region: 'domestic' | 'overseas';
  trip_date: string | null;
  total_distance_meters: number | null;
  optimized_at: string | null;
  created_at: string;
  spots: TripSpot[];
}

interface GroupDetail {
  id: string;
  name: string;
  owner_id: string;
  description: string | null;
  cover_image_url: string | null;
  code: string | null;
  owner: Profile;
  members: Member[];
  trips: Trip[];
}

function formatDistance(meters: number | null): string {
  if (meters == null) return '거리 미산정';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.id as string;
  const router = useRouter();

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const [codeCopied, setCodeCopied] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const isOwner = !!group && group.owner_id === currentUserId;
  const fallbackLetter = group?.name.trim().charAt(0).toUpperCase() ?? '?';

  const refresh = async () => {
    const res = await fetch(`/api/groups/${groupId}`);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error ?? '그룹을 불러올 수 없습니다.');
    }
    setGroup(await res.json());
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [userRes] = await Promise.all([fetch('/api/profile'), refresh()]);
        if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUserId(userData.id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('멤버를 제거하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('멤버 제거에 실패했습니다.');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  const handleCopyCode = async () => {
    if (!group?.code) return;
    const text = group.code;
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch {}
    if (!ok) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {}
    }
    if (ok) {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 1500);
    }
  };

  const handleToggleEdit = async (userId: string, currentCanEdit: boolean) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ can_edit: !currentCanEdit }),
      });
      if (!res.ok) throw new Error('권한 변경에 실패했습니다.');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">로딩 중...</p>
      </main>
    );
  }

  if (!group) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{error || '그룹을 찾을 수 없습니다.'}</p>
        <button
          onClick={() => router.push('/groups')}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          그룹 목록으로
        </button>
      </main>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <button
          onClick={() => router.back()}
          aria-label="뒤로가기"
          className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
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
        </button>
        <h1 className="flex-1 truncate text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {group.name}
        </h1>
        {group.code && (
          <button
            type="button"
            onClick={handleCopyCode}
            aria-label="초대 코드 복사"
            className="flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-1 transition-colors hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          >
            <span className="font-mono text-[11px] font-medium tracking-[0.18em] text-zinc-600 dark:text-zinc-400">
              {group.code}
            </span>
            {codeCopied ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                className="h-3.5 w-3.5 text-[#134e5e] dark:text-[#7fb5c4]"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        )}
      </header>

      {error && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Hero */}
        <section className="flex flex-col items-center px-6 pt-8 pb-6">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#134e5e] to-[#71b280] text-white shadow-[0_8px_24px_-12px_rgba(19,78,94,0.4)]">
            {group.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={group.cover_image_url} alt={group.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl font-bold uppercase">{fallbackLetter}</span>
            )}
          </div>
          <h2 className="mt-4 text-center text-xl font-bold text-zinc-900 dark:text-zinc-50">{group.name}</h2>
          {group.description && (
            <p className="mt-1.5 max-w-xs text-center text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {group.description}
            </p>
          )}
        </section>

        {/* 멤버 */}
        <section className="px-6 pb-8">
          <div className="mb-3">
            <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              멤버 {group.members.length + 1}명
            </h3>
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-4">
            <MemberCell username={group.owner.username} isOwner />
            {group.members.map((m) => (
              <MemberCell
                key={m.id}
                username={m.profile.username}
                onClick={isOwner ? () => setSelectedMember(m) : undefined}
              />
            ))}
          </div>
        </section>

        {/* 여정 목록 */}
        <section className="border-t border-zinc-100 px-6 pt-6 pb-10 dark:border-zinc-900">
          <div className="mb-3">
            <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              여정 {group.trips.length}개
            </h3>
          </div>

          {group.trips.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                className="h-6 w-6 text-zinc-300 dark:text-zinc-600"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  아직 함께한 여정이 없어요
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                  친구들과 첫 여정을 계획해볼까요?
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/?group=${group.id}`)}
                className="mt-2 flex items-center gap-1 rounded-lg bg-[#134e5e] px-4 py-2 text-sm font-medium text-white hover:bg-[#0f3f4c]"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                  className="h-2.5 w-2.5"
                >
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
                새 여정
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {group.trips.map((trip) => (
                <li key={trip.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/trips/${trip.id}`)}
                    className="flex w-full flex-col gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-left transition-colors hover:border-[#134e5e] hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-[#134e5e] dark:hover:bg-zinc-900"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          {trip.name || '이름 없는 여정'}
                        </p>
                        <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-500">
                          {trip.region === 'domestic' ? '국내' : '해외'}
                          {trip.trip_date && ` · ${new Date(trip.trip_date).toLocaleDateString('ko-KR')}`}
                          {' · '}
                          {formatDistance(trip.total_distance_meters)}
                        </p>
                      </div>
                      <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                        {trip.spots.length}곳
                      </span>
                    </div>

                    {trip.spots.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                        {trip.spots.slice(0, 4).map((spot, i) => (
                          <span key={`${trip.id}-${i}`} className="flex items-center gap-1.5">
                            <span className="rounded-md bg-[#134e5e]/10 px-2 py-0.5 text-[11px] font-medium text-[#134e5e] dark:bg-[#7fb5c4]/15 dark:text-[#7fb5c4]">
                              {spot.name}
                            </span>
                            {i < Math.min(trip.spots.length, 4) - 1 && (
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden
                                className="h-3 w-3 text-zinc-300 dark:text-zinc-700"
                              >
                                <path d="M9 18l6-6-6-6" />
                              </svg>
                            )}
                          </span>
                        ))}
                        {trip.spots.length > 4 && (
                          <span className="text-[11px] text-zinc-400 dark:text-zinc-600">
                            +{trip.spots.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* 멤버 액션 시트 (owner 전용) */}
      {selectedMember && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/50"
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="w-full rounded-t-2xl bg-white px-4 pt-4 pb-6 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <UserIcon size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {selectedMember.profile.username ?? '이름 없음'}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-500">
                  {selectedMember.can_edit ? '편집 가능' : '보기만 가능'}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  handleToggleEdit(selectedMember.user_id, selectedMember.can_edit);
                  setSelectedMember(null);
                }}
                className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {selectedMember.can_edit ? '편집 권한 해제' : '편집 권한 부여'}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleRemoveMember(selectedMember.user_id);
                  setSelectedMember(null);
                }}
                className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
              >
                그룹에서 제거
              </button>
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function UserIcon({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const wrapClass = size === 'md' ? 'h-10 w-10' : 'h-8 w-8';
  const svgClass = size === 'md' ? 'h-6 w-6' : 'h-5 w-5';
  return (
    <span
      className={`flex shrink-0 items-center justify-center text-zinc-500 dark:text-zinc-400 ${wrapClass}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className={svgClass}
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </span>
  );
}

function MemberCell({
  username,
  isOwner = false,
  onClick,
}: {
  username: string | null;
  isOwner?: boolean;
  onClick?: () => void;
}) {
  const display = username ?? '이름 없음';
  const content = (
    <>
      <UserIcon size="md" />
      <span className="flex w-full items-center justify-center gap-0.5">
        <span className="truncate text-[11px] font-medium text-zinc-800 dark:text-zinc-200">
          {display}
        </span>
        {isOwner && (
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-label="관리자"
            className="h-3 w-3 shrink-0 text-amber-400"
          >
            <path d="M12 2l2.39 6.95H21l-5.7 4.14 2.18 6.91L12 15.77l-5.48 4.23 2.18-6.91L3 8.95h6.61z" />
          </svg>
        )}
      </span>
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-14 flex-col items-center gap-1.5 transition-opacity hover:opacity-70"
      >
        {content}
      </button>
    );
  }
  return <div className="flex w-14 flex-col items-center gap-1.5">{content}</div>;
}
