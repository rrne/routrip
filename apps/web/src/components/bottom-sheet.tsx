'use client';

import { useEffect, useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

const ANIM_MS = 250;

export function BottomSheet({ open, onClose, children }: Props) {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);

  // open=true → mount 먼저
  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    // open=false → out transition 후 unmount
    setShow(false);
    const t = setTimeout(() => setMounted(false), ANIM_MS);
    return () => clearTimeout(t);
  }, [open]);

  // mounted 가 commit 된 후 다음 페인트 직전에 show=true 로 전환 (transition 발동)
  useEffect(() => {
    if (!mounted || !open) return;
    // double rAF 로 초기 상태(translate-y-full)가 실제로 paint 된 후 show 토글
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setShow(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [mounted, open]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end transition-colors duration-200 ease-out ${
        show ? 'bg-black/50' : 'bg-black/0'
      }`}
      onClick={onClose}
    >
      <div
        className={`mx-auto w-full max-w-md rounded-t-2xl bg-white shadow-[0_-12px_32px_-12px_rgba(0,0,0,0.25)] transition-transform duration-250 ease-out dark:bg-zinc-900 ${
          show ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ transitionDuration: `${ANIM_MS}ms` }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
