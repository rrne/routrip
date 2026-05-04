'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import type { Spot } from '@routrip/shared';
import { SearchBar } from '@/components/search-bar';
import { ShareSheet } from '@/components/share-sheet';
import { buildRoute, optimizeRoute } from '@/lib/route/optimize';
import { deleteTripAction, updateTripAction } from '@/lib/trips/actions';

type Member = { user_id: string; role: 'owner' | 'editor' };

type Props = {
  tripId: string;
  initialName: string;
  initialSpots: Spot[];
  members: Member[];
  currentUserId: string;
  isOwner: boolean;
  createdAt: string;
};

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

function sameSpots(a: Spot[], b: Spot[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((s, i) => s.id === b[i].id);
}

export function TripDetailEditor({
  tripId,
  initialName,
  initialSpots,
  members,
  currentUserId,
  isOwner,
  createdAt,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [spots, setSpots] = useState<Spot[]>(initialSpots);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const route = useMemo(() => (spots.length >= 2 ? buildRoute(spots) : null), [spots]);

  const isDirty = name !== initialName || !sameSpots(spots, initialSpots);

  const handleAdd = (spot: Spot) => {
    setSpots((prev) => (prev.some((s) => s.id === spot.id) ? prev : [...prev, spot]));
  };
  const isAdded = (id: string) => spots.some((s) => s.id === id);
  const handleRemove = (id: string) => setSpots((prev) => prev.filter((s) => s.id !== id));
  const handleMove = (id: string, dir: 'up' | 'down') => {
    setSpots((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const target = dir === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };
  const handleAutoSort = () => {
    if (spots.length < 2) return;
    setSpots(optimizeRoute(spots).spots);
  };
  const handleCancel = () => {
    setName(initialName);
    setSpots(initialSpots);
    setError(null);
  };
  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await updateTripAction({ tripId, name, spots });
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };
  const handleDelete = () => {
    if (!confirm('이 여행을 삭제할까요? 되돌릴 수 없습니다.')) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteTripAction(tripId);
      if (result.ok) {
        router.push('/trips');
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <Link
          href="/trips"
          aria-label="여행 목록으로"
          className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
        >
          ←
        </Link>
        <div className="min-w-0 flex-1">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="여행 이름"
            className="w-full truncate bg-transparent text-lg font-semibold tracking-tight text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-50"
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            {formatDate(createdAt)}
            {members.length > 1 && ` · 함께 ${members.length}명`}
          </p>
        </div>
        <ShareSheet
          tripId={tripId}
          currentUserId={currentUserId}
          isOwner={isOwner}
          members={members}
        />
      </header>

      <SearchBar onAdd={handleAdd} isAdded={isAdded} placeholder="장소 추가하기" />

      {route ? (
        <section className="border-b border-zinc-200 px-4 py-4 text-center dark:border-zinc-800">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">총 이동거리</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {formatDistance(route.totalDistanceMeters)}
          </p>
          <button
            type="button"
            onClick={handleAutoSort}
            className="mt-2 rounded-md px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            자동 정렬
          </button>
        </section>
      ) : (
        <section className="border-b border-zinc-200 px-4 py-4 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          최소 2개 이상의 장소를 담아주세요.
        </section>
      )}

      <ol className="flex-1 overflow-y-auto px-4 py-2">
        {spots.length === 0 ? (
          <li className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            장소가 없습니다. 위 검색창에서 추가해보세요.
          </li>
        ) : (
          spots.map((spot, idx) => {
            const leg = route?.legs[idx];
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
                      onClick={() => handleMove(spot.id, 'up')}
                      disabled={idx === 0}
                      aria-label={`${spot.name} 위로`}
                      className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(spot.id, 'down')}
                      disabled={idx === spots.length - 1}
                      aria-label={`${spot.name} 아래로`}
                      className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(spot.id)}
                      aria-label={`${spot.name} 제거`}
                      className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {leg && (
                  <div className="ml-3.5 flex items-center gap-2 border-l border-dashed border-zinc-300 py-1 pl-6 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                    <span>↓</span>
                    <span>{formatDistance(leg.distanceMeters)}</span>
                  </div>
                )}
              </li>
            );
          })
        )}
      </ol>

      <div className="border-t border-zinc-200 dark:border-zinc-800">
        {error && (
          <p className="border-b border-red-200 bg-red-50 px-4 py-2 text-center text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}
        {isDirty ? (
          <div className="flex gap-2 px-4 py-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || spots.length < 2 || !name.trim()}
              className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isPending ? '저장 중…' : '변경사항 저장'}
            </button>
          </div>
        ) : (
          <div className="flex gap-2 px-4 py-3">
            <Link
              href="/trips"
              className="flex-1 rounded-lg border border-zinc-300 px-4 py-2.5 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              내 여행 목록
            </Link>
            {isOwner && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="rounded-lg border border-red-300 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
              >
                삭제
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
