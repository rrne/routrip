'use client';

import { useEffect, useMemo, useState } from 'react';
import { BottomSheet } from '@/components/bottom-sheet';

type Props = {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  placeholder?: string;
  className?: string;
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fromISO(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatShort(iso: string): string {
  const d = fromISO(iso);
  if (!d) return '';
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  placeholder = '여정 시작 — 여정 끝',
  className = '',
}: Props) {
  const [open, setOpen] = useState(false);
  const [tempStart, setTempStart] = useState<Date | null>(null);
  const [tempEnd, setTempEnd] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [viewMonth, setViewMonth] = useState<Date>(() => fromISO(startDate) ?? new Date());

  // 시트 열 때 현재 값 동기화 + 뷰 달 맞추기
  useEffect(() => {
    if (open) {
      setTempStart(fromISO(startDate));
      setTempEnd(fromISO(endDate));
      setHoverDate(null);
      setViewMonth(fromISO(startDate) ?? new Date());
    }
  }, [open, startDate, endDate]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const today = useMemo(() => new Date(), []);

  const cells = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);
    const startWeekday = firstOfMonth.getDay();
    const daysInMonth = lastOfMonth.getDate();
    const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;
    const arr: Array<{ date: Date; current: boolean }> = [];
    for (let i = 0; i < totalCells; i++) {
      const offset = i - startWeekday;
      const date = new Date(year, month, 1 + offset);
      arr.push({ date, current: date.getMonth() === month });
    }
    return arr;
  }, [year, month]);

  const goPrev = () => setViewMonth(new Date(year, month - 1, 1));
  const goNext = () => setViewMonth(new Date(year, month + 1, 1));

  const handleDayClick = (date: Date) => {
    if (!tempStart || (tempStart && tempEnd)) {
      // 시작 새로 선택 (혹은 둘 다 있는 상태 → 리셋)
      setTempStart(date);
      setTempEnd(null);
      setHoverDate(null);
      return;
    }
    // 시작만 있음 → 종료 결정
    if (date < tempStart) {
      setTempStart(date);
      setTempEnd(tempStart);
    } else {
      setTempEnd(date);
    }
  };

  const handleApply = () => {
    if (tempStart && tempEnd) {
      onChange(toISO(tempStart), toISO(tempEnd));
    } else if (tempStart && !tempEnd) {
      onChange(toISO(tempStart), toISO(tempStart));
    } else {
      onChange('', '');
    }
    setOpen(false);
  };

  const handleClear = () => {
    setTempStart(null);
    setTempEnd(null);
    setHoverDate(null);
  };

  // 표시 텍스트
  const triggerLabel = (() => {
    if (startDate && endDate) {
      if (startDate === endDate) return formatShort(startDate);
      return `${formatShort(startDate)} – ${formatShort(endDate)}`;
    }
    return null;
  })();

  // 임시 범위 계산 (hover 포함)
  const rangeStart = tempStart;
  const rangeEnd = tempEnd ?? (tempStart && hoverDate && hoverDate > tempStart ? hoverDate : null);

  // 헤더에 표시할 기간 라벨 (몇박 몇일)
  const stayLabel = (() => {
    if (!tempStart || !tempEnd) return null;
    if (isSameDay(tempStart, tempEnd)) return '당일치기';
    const diff = Math.round(
      (tempEnd.getTime() - tempStart.getTime()) / (1000 * 60 * 60 * 24),
    );
    return `${diff}박 ${diff + 1}일`;
  })();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex w-full items-center justify-between rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-[#134e5e] focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 ${className}`}
      >
        <span className={triggerLabel ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-400 dark:text-zinc-600'}>
          {triggerLabel ?? placeholder}
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
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4" />
          <path d="M8 2v4" />
          <path d="M3 10h18" />
        </svg>
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)}>
          {/* 헤더 */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
              <button
                type="button"
                onClick={goPrev}
                aria-label="이전 달"
                className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
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
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <h3 className="flex items-baseline gap-2 text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {year}년 {month + 1}월
                {stayLabel && (
                  <span className="rounded-full bg-[#134e5e] px-2 py-0.5 text-[10px] font-bold text-white">
                    {stayLabel}
                  </span>
                )}
              </h3>
              <button
                type="button"
                onClick={goNext}
                aria-label="다음 달"
                className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
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
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>

            {/* 요일 */}
            <div className="grid grid-cols-7 px-4 pt-3">
              {WEEKDAYS.map((d, i) => (
                <div
                  key={d}
                  className={`py-1 text-center text-[11px] font-medium ${
                    i === 0
                      ? 'text-red-400 dark:text-red-400/70'
                      : i === 6
                        ? 'text-blue-400 dark:text-blue-400/70'
                        : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7 gap-y-1 px-4 pb-2">
              {cells.map(({ date, current }, i) => {
                const isStart = rangeStart && isSameDay(date, rangeStart);
                const isEnd = rangeEnd && isSameDay(date, rangeEnd);
                const inRange =
                  rangeStart &&
                  rangeEnd &&
                  date > rangeStart &&
                  date < rangeEnd;
                const isToday = isSameDay(date, today);
                const singleDay = isStart && rangeStart && rangeEnd && isSameDay(rangeStart, rangeEnd);

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleDayClick(date)}
                    onMouseEnter={() => setHoverDate(date)}
                    onMouseLeave={() => setHoverDate(null)}
                    className={`relative flex h-10 items-center justify-center text-sm transition-colors ${
                      current
                        ? 'text-zinc-900 dark:text-zinc-50'
                        : 'text-zinc-300 dark:text-zinc-700'
                    }`}
                  >
                    {/* 범위 배경 — 두 날짜 사이만, 원 위아래 높이와 동일 (z-0) */}
                    {((isStart && rangeEnd) || isEnd || inRange) && !singleDay && (
                      <span
                        aria-hidden
                        className={`absolute inset-y-[2px] z-0 bg-[#134e5e]/15 ${
                          isStart && rangeEnd
                            ? 'left-1/2 right-0'
                            : isEnd
                              ? 'left-0 right-1/2'
                              : 'inset-x-0'
                        }`}
                      />
                    )}
                    {/* 선택된 날짜 원 — 정원, 배경 위(z-10) */}
                    {(isStart || isEnd) && (
                      <span
                        aria-hidden
                        className="absolute z-10 h-9 w-9 rounded-full bg-[#134e5e]"
                      />
                    )}
                    <span
                      className={`relative z-20 ${
                        isStart || isEnd
                          ? 'font-semibold text-white'
                          : isToday && current
                            ? 'font-semibold text-[#134e5e] dark:text-[#7fb5c4]'
                            : ''
                      }`}
                    >
                      {date.getDate()}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-between gap-2 border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                초기화
              </button>
              <div className="flex flex-1 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={!tempStart}
                  className="flex-1 rounded-lg bg-[#134e5e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f3f4c] disabled:opacity-40"
                >
                  확인
                </button>
              </div>
            </div>
      </BottomSheet>
    </>
  );
}
