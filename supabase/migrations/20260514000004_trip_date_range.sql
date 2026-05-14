----------------------------------------------------------------------
-- 여정 시작/종료 날짜 추가
-- 기존 trip_date (단일 날짜) 를 start_date 로 이름 변경하고 end_date 추가
----------------------------------------------------------------------

alter table public.trips rename column trip_date to start_date;
alter table public.trips add column if not exists end_date date;
