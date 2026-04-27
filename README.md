# routrip

지도에서 여행 스팟을 검색하고 장바구니에 담으면, 이동거리가 가장 짧은 순서로 하루 일정을 짜주는 서비스.

## 기술 스택

- **모노레포**: pnpm workspaces + Turborepo
- **프론트**: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **DB / Auth**: Supabase (`@supabase/ssr`)
- **지도**: Kakao Maps SDK + Kakao Local API
- **배포**: Vercel (web)

## 디렉토리 구조

```
routrip/
├── apps/
│   └── web/                    # Next.js 앱
│       └── src/
│           ├── app/            # App Router 페이지
│           ├── lib/
│           │   ├── supabase/   # Supabase 클라이언트 (browser/server/middleware)
│           │   ├── kakao/      # Kakao Maps SDK 로더 + Local 검색
│           │   └── route/      # 경로 최적화 (Haversine + NN + 2-opt)
│           └── middleware.ts   # Supabase 세션 갱신
├── packages/
│   ├── shared/                 # 공통 타입 (Spot, OptimizedRoute 등)
│   └── db/                     # Supabase Database 타입
├── pnpm-workspace.yaml
├── turbo.json
└── .env.example
```

## 시작하기

```bash
# 1. 의존성 설치 (pnpm 9+ 필요 — corepack enable로 활성화)
pnpm install

# 2. 환경변수 설정
cp .env.example .env.local
# .env.local에 Supabase URL/anon key, Kakao 키 입력

# 3. 개발 서버 실행
pnpm dev
```

브라우저에서 http://localhost:3000 확인.

## 환경변수

| 이름 | 어디서 받나 | 위치 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | [Supabase Dashboard](https://app.supabase.com) → Project Settings → API | 클라이언트/서버 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 같은 곳 | 클라이언트/서버 |
| `SUPABASE_SERVICE_ROLE_KEY` | 같은 곳 (절대 클라이언트 노출 금지) | 서버 전용 |
| `NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY` | [Kakao Developers](https://developers.kakao.com/console/app) → 앱 → 플랫폼 | 클라이언트 (지도 SDK) |
| `KAKAO_REST_API_KEY` | 같은 곳 | 서버 (장소 검색) |

## 스크립트

```bash
pnpm dev         # 모든 앱 dev 모드
pnpm build       # 모든 앱/패키지 빌드
pnpm typecheck   # 전체 타입체크
pnpm lint        # 전체 린트
```

## 다음 할 일

- [ ] Supabase 프로젝트 생성 + 환경변수 입력
- [ ] Kakao Developers 앱 생성 + 키 발급
- [ ] DB 스키마 설계 (users, trips, spots, cart_items)
- [ ] Kakao Maps 컴포넌트 + 장소 검색 UI
- [ ] 장바구니 → 경로 최적화 → 결과 표시 흐름
- [ ] Vercel 배포 + GitHub 자동 연동
