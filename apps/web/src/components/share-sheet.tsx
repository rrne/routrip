'use client';

import { useState, useTransition } from 'react';
import { createInviteAction } from '@/lib/trips/invite-actions';

type Member = {
  user_id: string;
  role: 'owner' | 'editor';
};

type Props = {
  tripId: string;
  currentUserId: string;
  isOwner: boolean;
  members: Member[];
};

export function ShareSheet({ tripId, currentUserId, isOwner, members }: Props) {
  const [open, setOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    setError(null);
    setCopyState('idle');
    startTransition(async () => {
      const result = await createInviteAction(tripId);
      if (result.ok) {
        setInviteUrl(`${window.location.origin}/invite/${result.token}`);
      } else {
        setError(result.error);
      }
    });
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 1500);
    } catch {
      setError('복사에 실패했어요. 직접 선택해서 복사해주세요.');
    }
  };

  const close = () => {
    setOpen(false);
    setError(null);
    setCopyState('idle');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md px-2 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800"
      >
        공유
      </button>

      {open && (
        <div className="fixed inset-0 z-30 flex flex-col">
          <div
            role="presentation"
            onClick={close}
            className="absolute inset-0 bg-black/40"
          />
          <div className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[80dvh] w-full max-w-md flex-col rounded-t-xl bg-white shadow-xl dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">공유</h2>
              <button
                type="button"
                onClick={close}
                aria-label="닫기"
                className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* 초대 링크 — owner만 보임 */}
              {isOwner ? (
                <section className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    초대 링크
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                    링크를 받은 사람이 로그인하면 일정에 자동 합류해요. 7일 후 만료.
                  </p>

                  {inviteUrl ? (
                    <div className="mt-3 flex flex-col gap-2">
                      <input
                        type="text"
                        readOnly
                        value={inviteUrl}
                        onFocus={(e) => e.currentTarget.select()}
                        className="rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleCopy}
                          className="flex-1 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                          {copyState === 'copied' ? '복사됨!' : '링크 복사'}
                        </button>
                        <button
                          type="button"
                          onClick={handleCreate}
                          disabled={isPending}
                          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                        >
                          새 링크
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={isPending}
                      className="mt-3 w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      {isPending ? '생성 중…' : '초대 링크 만들기'}
                    </button>
                  )}

                  {error && (
                    <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
                      {error}
                    </p>
                  )}
                </section>
              ) : (
                <section className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    소유자만 초대 링크를 만들 수 있어요.
                  </p>
                </section>
              )}

              {/* 멤버 목록 */}
              <section className="px-4 py-4">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  함께하는 사람 ({members.length}명)
                </p>
                <ul className="mt-3 space-y-2">
                  {members.map((m) => {
                    const isMe = m.user_id === currentUserId;
                    const initial = m.user_id.slice(0, 2).toUpperCase();
                    return (
                      <li key={m.user_id} className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                          {initial}
                        </span>
                        <div className="flex-1 text-sm text-zinc-900 dark:text-zinc-50">
                          {isMe ? '나' : `사용자 ${m.user_id.slice(0, 6)}`}
                        </div>
                        <span
                          className={
                            m.role === 'owner'
                              ? 'rounded bg-zinc-900 px-2 py-0.5 text-xs font-medium text-white dark:bg-zinc-50 dark:text-zinc-900'
                              : 'rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                          }
                        >
                          {m.role === 'owner' ? '소유자' : '멤버'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
