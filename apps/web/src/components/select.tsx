'use client';

import { useState } from 'react';
import { BottomSheet } from '@/components/bottom-sheet';

export type SelectOption = {
  value: string;
  label: string;
  icon?: React.ReactNode;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
  leading?: React.ReactNode;
};

export function Select({
  value,
  onChange,
  options,
  placeholder = '선택',
  className = '',
  ariaLabel,
  leading,
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={ariaLabel}
        className={`flex w-full items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-[#134e5e] focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 ${className}`}
      >
        {leading}
        <span
          className={`flex-1 text-left ${
            selected
              ? 'text-zinc-900 dark:text-zinc-50'
              : 'text-zinc-400 dark:text-zinc-600'
          }`}
        >
          {selected?.label ?? placeholder}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className="h-4 w-4 text-zinc-400 dark:text-zinc-500"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <div className="flex justify-center pt-3 pb-1">
          <span className="h-1 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700" />
        </div>
        <ul className="max-h-[60vh] overflow-y-auto px-2 pb-3">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    isSelected
                      ? 'bg-[#134e5e]/10 text-[#134e5e] dark:bg-[#7fb5c4]/15 dark:text-[#7fb5c4]'
                      : 'text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="truncate text-sm font-medium">{opt.label}</span>
                    {opt.icon && (
                      <span
                        aria-hidden
                        className={
                          isSelected
                            ? 'shrink-0 text-[#134e5e]/60 dark:text-[#7fb5c4]/60'
                            : 'shrink-0 text-zinc-400 dark:text-zinc-500'
                        }
                      >
                        {opt.icon}
                      </span>
                    )}
                  </span>
                  {isSelected && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                      className="h-4 w-4 shrink-0"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </BottomSheet>
    </>
  );
}
