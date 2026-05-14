'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import type { User } from '@supabase/supabase-js';
import { DateRangePicker } from '@/components/date-range-picker';
import { Select } from '@/components/select';
import { buildRoute, optimizeRoute } from '@/lib/route/optimize';
import { useCart } from '@/lib/store/cart';
import { saveTripAction } from '@/lib/trips/actions';

type Props = {
  user: User | null;
};

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function defaultTripName(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} 여정`;
}

export function RouteView({ user }: Props) {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const lockedIds = useCart((s) => s.lockedIds);
  const region = useCart((s) => s.region);
  const move = useCart((s) => s.move);
  const setItems = useCart((s) => s.setItems);
  const clearCart = useCart((s) => s.clear);
  const toggleLock = useCart((s) => s.toggleLock);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  // 사용자가 cart에서 정한 순서를 그대로 사용. 거리만 계산.
  const route = useMemo(() => (items.length >= 2 ? buildRoute(items) : null), [items]);

  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groups, setGroups] = useState<
    Array<{ id: string; name: string; cover_image_url: string | null }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // 기간 미리보기 ( N박 / 당일치기 )
  const stayLabel = useMemo(() => {
    if (!startDate || !endDate) return null;
    if (startDate > endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return '당일치기';
    return `${diff}박 ${diff + 1}일`;
  }, [startDate, endDate]);

  const startNaming = async () => {
    setName(defaultTripName());
    setError(null);
    setGroupId(null);
    setStartDate('');
    setEndDate('');
    setNaming(true);

    // 사용자 그룹 목록 로드
    if (user) {
      try {
        const res = await fetch('/api/groups');
        if (res.ok) {
          const data = await res.json();
          setGroups(
            data.map((g: any) => ({
              id: g.id,
              name: g.name,
              cover_image_url: g.cover_image_url ?? null,
            })),
          );
        }
      } catch {
        // 그룹 로드 실패해도 개인 여행은 가능
      }
    }
  };

  const handleAutoSort = () => {
    if (items.length < 2) return;
    const optimized = optimizeRoute(items, { lockedSpotIds: lockedIds });
    setItems(optimized.spots);
  };

  const handleSave = () => {
    setError(null);
    if (startDate && endDate && startDate > endDate) {
      setError('종료일이 시작일보다 빠를 수 없습니다.');
      return;
    }
    startTransition(async () => {
      const result = await saveTripAction({
        name,
        spots: items,
        region,
        groupId: groupId ?? undefined,
        startDate: startDate || null,
        endDate: endDate || null,
      });
      if (result.ok) {
        clearCart();
        router.push(`/trips/${result.tripId}`);
      } else {
        setError(result.error);
      }
    });
  };

  if (!hydrated) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">불러오는 중…</p>
      </main>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <Link
          href="/"
          aria-label="홈으로"
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
        </Link>
        <h1 className="flex-1 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          여정
        </h1>
        {route && (
          <button
            type="button"
            onClick={handleAutoSort}
            className="rounded-md px-2 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800"
          >
            자동 정렬
          </button>
        )}
      </header>

      {!route ? (
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            경로를 계산하려면 최소 2개 이상의 장소를 담아주세요.
          </p>
          <Link
            href="/"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            장소 담으러 가기
          </Link>
        </main>
      ) : (
        <>
          <section className="border-b border-zinc-200 px-4 py-5 text-center dark:border-zinc-800">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">총 이동거리</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {formatDistance(route.totalDistanceMeters)}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
              {route.spots.length}개 장소 · 직선 거리 기준
            </p>
          </section>

          <ol className="flex-1 overflow-y-auto px-4 py-2">
            {route.spots.map((spot, idx) => {
              const leg = route.legs[idx];
              const locked = lockedIds.includes(spot.id);
              return (
                <li key={spot.id}>
                  <div className="flex items-center gap-2 py-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {spot.name}
                      </p>
                      <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {spot.address}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center">
                      <button
                        type="button"
                        onClick={() => toggleLock(spot.id)}
                        aria-label={`${spot.name} ${locked ? '잠금 해제' : '위치 고정'}`}
                        title={locked ? '잠금 해제' : '위치 고정'}
                        className={
                          locked
                            ? 'rounded-md p-1 text-[#134e5e] hover:bg-zinc-100 dark:text-[#7fb5c4] dark:hover:bg-zinc-800'
                            : 'rounded-md p-1 text-zinc-300 hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-400'
                        }
                      >
                        {locked ? <LockIcon /> : <UnlockIcon />}
                      </button>
                      <button
                        type="button"
                        onClick={() => move(spot.id, 'up')}
                        disabled={idx === 0}
                        aria-label={`${spot.name} 위로`}
                        className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-20 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                      >
                        <ChevronUpIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(spot.id, 'down')}
                        disabled={idx === route.spots.length - 1}
                        aria-label={`${spot.name} 아래로`}
                        className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-20 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                      >
                        <ChevronDownIcon />
                      </button>
                    </div>
                  </div>
                  {leg && (
                    <div className="ml-3.5 border-l border-dashed border-zinc-300 py-1 pl-6 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                      {formatDistance(leg.distanceMeters)}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="border-t border-zinc-200 dark:border-zinc-800">
            {error && (
              <p className="border-b border-red-200 bg-red-50 px-4 py-2 text-center text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {error}
              </p>
            )}
            {user && naming ? (
              <div className="flex flex-col gap-2 px-4 py-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="여정 이름"
                  autoFocus
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#134e5e] focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
                {groups.length > 0 && (
                  <GroupSelectRow
                    groupId={groupId}
                    groups={groups}
                    onChange={(v) => setGroupId(v || null)}
                  />
                )}
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(s, e) => {
                    setStartDate(s);
                    setEndDate(e);
                  }}
                />
                <p className="text-right text-[11px] text-zinc-500 dark:text-zinc-400">
                  {stayLabel ?? '기간을 정하지 않으면 비워두세요'}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNaming(false)}
                    disabled={isPending}
                    className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isPending || !name.trim()}
                    className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    {isPending ? '저장 중…' : '저장 확인'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 px-4 py-3">
                <Link
                  href="/"
                  className="flex-1 rounded-lg border border-zinc-300 px-4 py-2.5 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  처음으로
                </Link>
                {user ? (
                  <button
                    type="button"
                    onClick={startNaming}
                    className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    저장하기
                  </button>
                ) : (
                  <Link
                    href="/login?next=/route"
                    className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    로그인하고 저장
                  </Link>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

type GroupOption = { id: string; name: string; cover_image_url: string | null };

function GroupSelectRow({
  groupId,
  groups,
  onChange,
}: {
  groupId: string | null;
  groups: GroupOption[];
  onChange: (value: string) => void;
}) {
  const selectedGroup = groupId ? groups.find((g) => g.id === groupId) : null;
  return (
    <Select
      value={groupId ?? ''}
      onChange={onChange}
      ariaLabel="여정 그룹"
      leading={<GroupAvatar group={selectedGroup} />}
      options={[
        { value: '', label: '개인 여정', icon: <PersonIcon /> },
        ...groups.map((g) => ({
          value: g.id,
          label: g.name,
          icon: <UsersIcon />,
        })),
      ]}
    />
  );
}

function PersonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="h-3.5 w-3.5"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="h-3.5 w-3.5"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function GroupAvatar({ group }: { group: GroupOption | null | undefined }) {
  if (!group) {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className="h-3.5 w-3.5"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </span>
    );
  }
  const letter = group.name.trim().charAt(0).toUpperCase() || '?';
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#134e5e] to-[#71b280] text-[10px] font-bold text-white">
      {group.cover_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={group.cover_image_url}
          alt={group.name}
          className="h-full w-full object-cover"
        />
      ) : (
        letter
      )}
    </span>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="h-4 w-4"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function UnlockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="h-4 w-4"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 7.5-2" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="h-4 w-4"
    >
      <path d="M18 15l-6-6-6 6" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="h-4 w-4"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
