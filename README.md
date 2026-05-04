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
│           │   ├── kakao/      # Kakao Maps SDK 로더 + 타입 + Local 검색
│           │   └── route/      # 경로 최적화 (Haversine + NN + 2-opt)
│           ├── components/     # 재사용 컴포넌트 (KakaoMapView 등)
│           └── proxy.ts        # Supabase 세션 갱신 (Next.js 16 신규 컨벤션)
├── packages/
│   ├── shared/                 # 공통 타입 (Spot, OptimizedRoute 등)
│   └── db/                     # Supabase Database 타입
├── supabase/
│   └── migrations/             # DB 스키마 마이그레이션 SQL
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
| `NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY` | [Kakao Developers](https://developers.kakao.com/console/app) → 앱 → 앱 설정 → 앱 키 | 국내 모드 (지도 SDK + Local 검색) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | [Google Cloud Console](https://console.cloud.google.com) → Credentials → API key (Maps JS + Places API New 활성화) | 해외 모드 (지도 SDK + Places 검색) |

## DB 스키마 적용

스키마는 `supabase/migrations/` 의 SQL 파일에 정의되어 있습니다. 새 Supabase 프로젝트에는 한 번 적용해줘야 해요.

### 방법 1: 대시보드에서 직접 (가장 간단)

1. [Supabase Dashboard](https://app.supabase.com) → 본인 프로젝트 → 왼쪽 사이드바 **SQL Editor**
2. **+ New query** 클릭
3. `supabase/migrations/20260428000001_initial_schema.sql` 의 내용 전체 복사 → 붙여넣기
4. 우측 상단 **Run** (또는 Cmd+Enter)
5. 성공하면 왼쪽 **Table Editor** 에서 `profiles`, `spots`, `trips`, `trip_spots` 테이블 확인 가능

### 방법 2: Supabase CLI (선택, 자동화 가능)

```bash
brew install supabase/tap/supabase     # macOS
supabase login                          # 브라우저에서 인증
supabase link --project-ref <YOUR_REF>  # ref는 Supabase 대시보드 URL에서
supabase db push                        # supabase/migrations/ 의 SQL 적용
pnpm --filter @routrip/db gen:types     # Database 타입 자동생성
```

## 스크립트

```bash
pnpm dev         # 모든 앱 dev 모드
pnpm build       # 모든 앱/패키지 빌드
pnpm typecheck   # 전체 타입체크
pnpm lint        # 전체 린트
```

## 다음 할 일

- [x] Supabase 프로젝트 생성 + 환경변수 입력
- [ ] Kakao 비즈앱 전환 + 카카오맵 API 추가 기능 신청 (개인도 가능 — 카카오톡 채널 연결)
- [x] DB 스키마 설계 (profiles, spots, trips, trip_spots)
- [x] DB 스키마 적용
- [ ] Kakao Maps 컴포넌트 + 장소 검색 UI
- [ ] 장바구니 → 경로 최적화 → 결과 표시 흐름
- [ ] Vercel 배포 + GitHub 자동 연동
