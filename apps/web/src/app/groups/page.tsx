'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Group {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  group_members: Array<{ id: string; user_id: string; can_edit: boolean }>;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [error, setError] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/groups');
      if (!res.ok) throw new Error('그룹 목록을 불러올 수 없습니다.');
      const data = await res.json();
      setGroups(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      setError('그룹 이름을 입력해주세요.');
      return;
    }

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName }),
      });

      if (!res.ok) throw new Error('그룹 생성에 실패했습니다.');

      setNewGroupName('');
      setShowCreateModal(false);
      setError('');
      await fetchGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <button
          onClick={() => router.back()}
          aria-label="뒤로가기"
          className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
        >
          ←
        </button>
        <h1 className="flex-1 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          그룹
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-md px-3 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800"
        >
          + 그룹 만들기
        </button>
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
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            참여 중인 그룹이 없습니다.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            첫 그룹 만들기
          </button>
        </main>
      ) : (
        <ul className="flex-1 divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-900">
          {groups.map((group) => (
            <li key={group.id}>
              <Link
                href={`/groups/${group.id}`}
                className="flex items-center justify-between gap-3 px-4 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {group.name}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    멤버 {group.group_members.length + 1}명
                  </p>
                </div>
                <span className="text-zinc-400 dark:text-zinc-600">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* 그룹 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black bg-opacity-50">
          <div className="w-full rounded-t-lg bg-white dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                새 그룹 만들기
              </h2>
            </div>
            <form onSubmit={handleCreateGroup} className="flex flex-col gap-3 px-4 py-4">
              <input
                type="text"
                placeholder="그룹 이름"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewGroupName('');
                    setError('');
                  }}
                  className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  만들기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
