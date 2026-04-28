-- routrip 초기 스키마
-- 테이블: profiles, spots, trips, trip_spots
-- RLS: 모든 테이블 활성화. 사용자는 본인 데이터만 접근. spots는 인증된 사용자 모두 읽기/쓰기 가능 (캐시 공유).

----------------------------------------------------------------------
-- 1. profiles (auth.users와 1:1, signup 시 자동 생성)
----------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

----------------------------------------------------------------------
-- 2. spots (Kakao 장소 캐시 — 인증된 모든 사용자가 공유)
----------------------------------------------------------------------
create table public.spots (
  id uuid primary key default gen_random_uuid(),
  kakao_place_id text unique not null,
  name text not null,
  address text not null,
  category text,
  lat double precision not null,
  lng double precision not null,
  created_at timestamptz not null default now()
);

create index spots_kakao_place_id_idx on public.spots (kakao_place_id);

alter table public.spots enable row level security;

create policy "Authenticated users can read all spots"
  on public.spots for select
  to authenticated
  using (true);

create policy "Authenticated users can insert spots"
  on public.spots for insert
  to authenticated
  with check (true);

----------------------------------------------------------------------
-- 3. trips (여행 일정 — 사용자별 여러 개)
----------------------------------------------------------------------
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null default '내 여행',
  trip_date date,
  total_distance_meters integer,
  optimized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trips_user_id_idx on public.trips (user_id);

alter table public.trips enable row level security;

create policy "Users can view their own trips"
  on public.trips for select
  using (auth.uid() = user_id);

create policy "Users can insert their own trips"
  on public.trips for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own trips"
  on public.trips for update
  using (auth.uid() = user_id);

create policy "Users can delete their own trips"
  on public.trips for delete
  using (auth.uid() = user_id);

----------------------------------------------------------------------
-- 4. trip_spots (여행에 담긴 스팟 — 장바구니 + 최적화된 순서)
----------------------------------------------------------------------
create table public.trip_spots (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips on delete cascade,
  spot_id uuid not null references public.spots on delete restrict,
  position integer,
  added_at timestamptz not null default now(),
  unique (trip_id, spot_id)
);

create index trip_spots_trip_id_position_idx on public.trip_spots (trip_id, position);

alter table public.trip_spots enable row level security;

-- trip_spots 권한은 부모 trip의 user_id로 결정
create policy "Users can view trip_spots for their own trips"
  on public.trip_spots for select
  using (exists (
    select 1 from public.trips
    where trips.id = trip_spots.trip_id and trips.user_id = auth.uid()
  ));

create policy "Users can insert trip_spots into their own trips"
  on public.trip_spots for insert
  with check (exists (
    select 1 from public.trips
    where trips.id = trip_spots.trip_id and trips.user_id = auth.uid()
  ));

create policy "Users can update trip_spots in their own trips"
  on public.trip_spots for update
  using (exists (
    select 1 from public.trips
    where trips.id = trip_spots.trip_id and trips.user_id = auth.uid()
  ));

create policy "Users can delete trip_spots from their own trips"
  on public.trip_spots for delete
  using (exists (
    select 1 from public.trips
    where trips.id = trip_spots.trip_id and trips.user_id = auth.uid()
  ));

----------------------------------------------------------------------
-- 트리거: updated_at 자동 갱신
----------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_trips_updated_at
  before update on public.trips
  for each row execute function public.set_updated_at();

----------------------------------------------------------------------
-- 트리거: 회원가입 시 profiles 자동 생성
----------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
