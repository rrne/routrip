-- username에 UNIQUE 제약조건 추가
alter table public.profiles
add constraint username_unique unique (username);

-- 검색을 위한 인덱스 추가
create index profiles_username_idx on public.profiles (username);
