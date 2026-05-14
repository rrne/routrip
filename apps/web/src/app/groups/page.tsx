'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Group {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  cover_image_url?: string | null;
  description?: string | null;
  group_members: Array<{ id: string; user_id: string; can_edit: boolean }>;
}

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch('/api/groups');
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? '그룹 목록을 불러올 수 없습니다.');
        }
        const data = await res.json();
        setGroups(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

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
        <h1 className="flex-1 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          그룹
        </h1>
        <Link
          href="/groups/join"
          className="rounded-md px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
        >
          코드로 합류
        </Link>
        <Link
          href="/groups/new"
          className="rounded-md px-2.5 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800"
        >
          + 만들기
        </Link>
      </header>

      {error && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <main className="flex flex-1 items-center justify-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">로딩 중...</p>
        </main>
      ) : groups.length === 0 ? (
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">참여 중인 그룹이 없습니다.</p>
          <div className="flex gap-2">
            <Link
              href="/groups/new"
              className="rounded-lg bg-[#134e5e] px-4 py-2 text-sm font-medium text-white hover:bg-[#0f3f4c]"
            >
              첫 그룹 만들기
            </Link>
            <Link
              href="/groups/join"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              코드로 합류
            </Link>
          </div>
        </main>
      ) : (
        <ul className="flex-1 divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-900">
          {groups.map((group) => (
            <li key={group.id}>
              <Link
                href={`/groups/${group.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
                  {group.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={group.cover_image_url}
                      alt={group.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#134e5e] to-[#71b280] text-base font-bold uppercase text-white">
                      {group.name.trim().charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {group.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {group.description ?? `멤버 ${group.group_members.length + 1}명`}
                  </p>
                </div>
                <span className="text-zinc-400 dark:text-zinc-600">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
