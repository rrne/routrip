export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-24 dark:bg-black">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          routrip · 여행 일정 최적화
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          담은 스팟으로 가장 짧은 여행 경로를
        </h1>
        <p className="max-w-xl text-lg leading-7 text-zinc-600 dark:text-zinc-400">
          지도에서 가고 싶은 장소를 검색하고 장바구니에 담으면, 이동거리가 가장 짧은 순서로
          하루 일정을 짜드려요.
        </p>
        <div className="mt-4 flex flex-col gap-2 text-sm text-zinc-500 dark:text-zinc-500">
          <p>🛠️ 셋업 완료. 다음 단계로 Supabase 프로젝트 + Kakao 키를 연결해주세요.</p>
          <p>
            <code className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
              cp .env.example .env.local
            </code>
          </p>
        </div>
      </div>
    </main>
  );
}
