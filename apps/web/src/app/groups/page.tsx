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

  if (loading) return <div className="p-4">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">그룹</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            + 그룹 만들기
          </button>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

        {groups.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>참여 중인 그룹이 없습니다.</p>
            <p className="text-sm mt-2">그룹을 만들어서 다른 사람들과 여행을 공유하세요!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900">{group.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      멤버 {group.group_members.length + 1}명
                    </p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(group.created_at).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 그룹 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">새 그룹 만들기</h2>
            <form onSubmit={handleCreateGroup}>
              <input
                type="text"
                placeholder="그룹 이름"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                >
                  만들기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewGroupName('');
                    setError('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
