import { KakaoMapView } from '@/components/kakao-map';

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          routrip
        </h1>
        <span className="text-xs text-zinc-500 dark:text-zinc-500">여행 일정 최적화</span>
      </header>
      <KakaoMapView className="flex-1" />
    </div>
  );
}
