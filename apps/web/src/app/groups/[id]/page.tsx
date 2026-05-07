'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Member {
  id: string;
  user_id: string;
  can_edit: boolean;
  profiles: { username: string };
}

interface Group {
  id: string;
  name: string;
  owner_id: string;
  group_members: Member[];
}

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.id as string;
  const router = useRouter();

  const [group, setGroup] = useState<Group | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; username: string }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 현재 사용자 정보
        const userRes = await fetch('/api/profile');
        if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUserId(userData.id);
        }

        // 그룹 정보
        const groupRes = await fetch(`/api/groups/${groupId}`);
        if (!groupRes.ok) throw new Error('그룹을 찾을 수 없습니다.');
        const groupData = await groupRes.json();
        setGroup(groupData);
        setIsOwner(groupData.owner_id === currentUserId);
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [groupId, currentUserId]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await fetch(`/api/search/users?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        // 이미 그룹에 속한 멤버 제외
        const existingIds = new Set(group?.group_members.map((m) => m.user_id));
        setSearchResults(data.filter((user: any) => !existingIds.has(user.id)));
      }
    } catch {
      setError('검색에 실패했습니다.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddMember = async (userId: string, username: string) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, can_edit: false }),
      });

      if (!res.ok) throw new Error('멤버 추가에 실패했습니다.');

      setSearchQuery('');
      setSearchResults([]);
      setShowAddMemberModal(false);

      // 그룹 정보 새로고침
      const groupRes = await fetch(`/api/groups/${groupId}`);
      if (groupRes.ok) {
        setGroup(await groupRes.json());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('멤버를 제거하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/groups/${groupId}/members/${userId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('멤버 제거에 실패했습니다.');

      // 그룹 정보 새로고침
      const groupRes = await fetch(`/api/groups/${groupId}`);
      if (groupRes.ok) {
        setGroup(await groupRes.json());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  const handleToggleEdit = async (memberId: string, currentCanEdit: boolean) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ can_edit: !currentCanEdit }),
      });

      if (!res.ok) throw new Error('권한 변경에 실패했습니다.');

      // 그룹 정보 새로고침
      const groupRes = await fetch(`/api/groups/${groupId}`);
      if (groupRes.ok) {
        setGroup(await groupRes.json());
      }
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
          {group?.name}
        </h1>
        {isOwner && (
          <button
            onClick={() => setShowAddMemberModal(true)}
            className="rounded-md px-3 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800"
          >
            + 멤버 추가
          </button>
        )}
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
      ) : (
        <>
          {/* 멤버 목록 */}
          <ul className="flex-1 divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-900">
            {/* Owner */}
            <li className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    그룹 관리자
                  </p>
                </div>
              </div>
            </li>

            {/* 멤버들 */}
            {group?.group_members.map((member) => (
              <li key={member.id} className="px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {member.profiles.username}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {member.can_edit ? '편집 권한' : '보기만 가능'}
                    </p>
                  </div>
                  {isOwner && (
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => handleToggleEdit(member.user_id, member.can_edit)}
                        className={`rounded-md px-2 py-1 text-xs font-medium ${
                          member.can_edit
                            ? 'text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950'
                            : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {member.can_edit ? '해제' : '승인'}
                      </button>
                      <button
                        onClick={() => handleRemoveMember(member.user_id)}
                        className="rounded-md px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                      >
                        제거
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* 멤버 추가 모달 */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black bg-opacity-50">
          <div className="w-full rounded-t-lg bg-white dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                멤버 추가
              </h2>
            </div>
            <form className="flex flex-col gap-3 px-4 py-4">
              <input
                type="text"
                placeholder="닉네임으로 검색..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                autoFocus
              />

              {searchLoading && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">검색 중...</p>
              )}

              {searchResults.length === 0 && searchQuery && !searchLoading && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">검색 결과가 없습니다.</p>
              )}

              <div className="max-h-64 overflow-y-auto space-y-2">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleAddMember(user.id, user.username)}
                    className="w-full text-left rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
                  >
                    {user.username}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAddMemberModal(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                닫기
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
