-- routrip 3단계: 국내/해외 구분
-- trips.region 컬럼 추가. 기존 row는 모두 'domestic'으로 백필.

alter table public.trips
  add column region text not null default 'domestic'
  check (region in ('domestic', 'overseas'));

-- 명시적으로 인덱스는 추가하지 않음 (region별 조회는 user_id 안에서만 일어나니
-- trips_user_id_idx 로 충분함).
