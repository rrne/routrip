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

  if (loading) return <div className="p-4">로딩 중...</div>;
  if (!group) return <div className="p-4">그룹을 찾을 수 없습니다.</div>;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-4">
        {/* 헤더 */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-500 hover:text-blue-600 mb-4"
          >
            ← 뒤로가기
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{group.name}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {isOwner ? '그룹 관리자' : '멤버'}
              </p>
            </div>
            {isOwner && (
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                + 멤버 추가
              </button>
            )}
          </div>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

        {/* 멤버 목록 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h2 className="font-semibold mb-4">멤버 ({group.group_members.length + 1}명)</h2>

          <div className="space-y-2 mb-4">
            {/* Owner */}
            <div className="bg-white border border-gray-200 rounded p-3 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">그룹 관리자</p>
                <p className="text-xs text-gray-500 mt-1">편집 권한</p>
              </div>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                Owner
              </span>
            </div>

            {/* 멤버들 */}
            {group.group_members.map((member) => (
              <div
                key={member.id}
                className="bg-white border border-gray-200 rounded p-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-gray-900">{member.profiles.username}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {member.can_edit ? '편집 권한' : '보기만 가능'}
                  </p>
                </div>
                {isOwner && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleEdit(member.user_id, member.can_edit)}
                      className={`text-xs px-2 py-1 rounded ${
                        member.can_edit
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {member.can_edit ? '편집 해제' : '편집 권한'}
                    </button>
                    <button
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                    >
                      제거
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 그룹 여행 섹션 (나중에 추가) */}
        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <h2 className="font-semibold mb-4">그룹 여행</h2>
          <p className="text-gray-500 text-sm">곧 추가될 예정입니다.</p>
        </div>
      </div>

      {/* 멤버 추가 모달 */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">멤버 추가</h2>

            <input
              type="text"
              placeholder="닉네임으로 검색..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />

            {searchLoading && <p className="text-gray-500 text-sm">검색 중...</p>}

            {searchResults.length === 0 && searchQuery && !searchLoading && (
              <p className="text-gray-500 text-sm">검색 결과가 없습니다.</p>
            )}

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleAddMember(user.id, user.username)}
                  className="w-full text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded p-3 transition"
                >
                  <p className="font-medium">{user.username}</p>
                </button>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setShowAddMemberModal(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
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
