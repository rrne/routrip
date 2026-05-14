'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

type CreatedGroup = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  cover_image_url: string | null;
};

async function fileToCompressedDataUrl(file: File, maxDim = 800, quality = 0.82): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('이미지를 읽을 수 없습니다.'));
    reader.readAsDataURL(file);
  });
  const img = new Image();
  img.src = dataUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('이미지를 로드할 수 없습니다.'));
  });
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('이미지를 처리할 수 없습니다.');
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
}

export default function NewGroupPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [created, setCreated] = useState<CreatedGroup | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');

  const handleImagePick = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있어요.');
      return;
    }
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setCoverImage(dataUrl);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 처리 중 오류가 발생했어요.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('그룹 이름을 입력해주세요.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          cover_image_url: coverImage,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error ?? '그룹 생성에 실패했습니다.');
      }
      setCreated(body as CreatedGroup);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // execCommand 폴백으로 시도
    }
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  };

  const handleCopy = async (text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } else {
      setError('복사에 실패했어요. 직접 선택해 복사해주세요.');
    }
  };

  const handleShare = async () => {
    if (!created) return;
    const text = `${created.name} 그룹에 초대합니다.\n초대 코드: ${created.code}`;
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: 'routrip 그룹 초대', text });
        return;
      } catch {
        // 사용자가 취소했거나 실패한 경우 fallback 으로 복사
      }
    }
    const ok = await copyToClipboard(text);
    if (ok) {
      setShareState('copied');
      setTimeout(() => setShareState('idle'), 2000);
    } else {
      setError('공유 내용 복사에 실패했어요.');
    }
  };

  if (created) {
    const fallbackLetter = created.name.trim().charAt(0).toUpperCase() || '?';
    return (
      <div className="relative flex flex-1 flex-col">
        <button
          onClick={() => router.push('/groups')}
          aria-label="목록으로"
          className="absolute top-4 left-4 z-10 rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
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

        <main className="flex flex-1 flex-col items-center px-6 pt-20 pb-10">
          {/* Hero avatar */}
          <div className="relative">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#134e5e] to-[#71b280] text-white shadow-[0_8px_24px_-12px_rgba(19,78,94,0.5)]">
              {created.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={created.cover_image_url}
                  alt={created.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold uppercase">{fallbackLetter}</span>
              )}
            </div>
            <span
              aria-hidden
              className="absolute -right-0.5 -bottom-0.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#134e5e] text-white shadow-sm dark:border-zinc-950"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </span>
          </div>

          {/* Title */}
          <h2 className="mt-8 text-center text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            {created.name}
          </h2>
          {created.description && (
            <p className="mt-2 max-w-xs text-center text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {created.description}
            </p>
          )}

          {/* Invitation code section */}
          <div className="mt-12 flex w-full max-w-xs flex-col items-center">
            <p className="font-mono text-[34px] font-bold tracking-[0.32em] text-zinc-900 dark:text-zinc-50">
              {created.code}
            </p>

            <button
              type="button"
              onClick={() => handleCopy(created.code)}
              className="mt-3 flex items-center gap-1.5 text-xs font-medium text-zinc-500 underline-offset-4 hover:text-[#134e5e] hover:underline dark:text-zinc-400 dark:hover:text-[#7fb5c4]"
            >
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
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              {copied ? '복사됐어요' : '코드 복사'}
            </button>

            <p className="mt-6 text-center text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              친구에게 코드를 전해주세요.
              <br />
              코드를 입력하면 그룹에 합류할 수 있어요.
            </p>
          </div>

          {/* Actions */}
          <div className="mt-auto flex w-full flex-col gap-2 pt-10">
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#134e5e] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_-12px_rgba(19,78,94,0.6)] transition-colors hover:bg-[#0f3f4c]"
            >
              {shareState === 'copied' ? (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                    className="h-4 w-4"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  공유 내용이 복사됐어요
                </>
              ) : (
                <>
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
                    <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
                    <path d="M16 6l-4-4-4 4" />
                    <path d="M12 2v13" />
                  </svg>
                  친구에게 공유하기
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/groups/${created.id}`)}
              className="rounded-xl px-4 py-3.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              그룹으로 이동
            </button>
          </div>
        </main>
      </div>
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
        <h1 className="flex-1 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          그룹 만들기
        </h1>
      </header>

      {error && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6 px-6 py-6">
        {/* 커버 이미지 */}
        <div className="flex flex-col items-center">
          <div className="relative h-24 w-24">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="커버 이미지 추가"
              className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-gradient-to-br from-[#134e5e] to-[#71b280] text-white transition-all hover:shadow-[0_4px_16px_-6px_rgba(19,78,94,0.4)] dark:border-zinc-800"
            >
              {coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverImage}
                  alt="cover preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold uppercase">
                  {name.trim().charAt(0) || '+'}
                </span>
              )}
            </button>
            <span
              aria-hidden
              className="pointer-events-none absolute -right-0.5 -bottom-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#134e5e] text-white shadow-sm dark:border-zinc-950"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImagePick(e.target.files?.[0])}
          />
          {coverImage && (
            <button
              type="button"
              onClick={() => setCoverImage(null)}
              className="mt-2 text-xs text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
            >
              이미지 제거
            </button>
          )}
        </div>

        {/* 그룹 이름 */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="group-name"
            className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
          >
            그룹 이름 <span className="text-red-500">*</span>
          </label>
          <input
            id="group-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예) 제주도 친구들"
            maxLength={60}
            required
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#134e5e] focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <p className="text-right text-[11px] text-zinc-400 dark:text-zinc-600">
            {name.length} / 60
          </p>
        </div>

        {/* 그룹 소개 */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="group-description"
            className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
          >
            그룹 소개 <span className="text-zinc-400 dark:text-zinc-600">(선택)</span>
          </label>
          <textarea
            id="group-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="어떤 여정을 함께하시나요?"
            rows={3}
            maxLength={200}
            className="resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#134e5e] focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <p className="text-right text-[11px] text-zinc-400 dark:text-zinc-600">
            {description.length} / 200
          </p>
        </div>

        {/* 안내 카드 */}
        <div className="rounded-xl bg-zinc-50 px-4 py-3 text-xs leading-relaxed text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          그룹을 만들면 친구에게 공유할 수 있는 <strong>초대 코드</strong>가 자동으로 생성돼요.
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-4">
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="rounded-lg bg-[#134e5e] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#0f3f4c] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? '만드는 중…' : '그룹 만들기'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
