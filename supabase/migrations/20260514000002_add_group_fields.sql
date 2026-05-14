----------------------------------------------------------------------
-- groups 테이블에 모임 코드 / 설명 / 커버 이미지 컬럼 추가
----------------------------------------------------------------------

alter table public.groups
  add column if not exists code text unique,
  add column if not exists description text,
  add column if not exists cover_image_url text;

-- 검색용 인덱스 (code 는 unique 제약으로 인덱스 생김 — 별도 추가 X)
