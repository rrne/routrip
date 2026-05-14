----------------------------------------------------------------------
-- spots 테이블 upsert 가능하도록 UPDATE 정책 추가
--
-- 기존 정책은 SELECT + INSERT 만 있음. upsert 시 동일 kakao_place_id 가
-- 존재하면 UPDATE 분기로 들어가는데 정책이 없어서 RLS 위반 에러 발생.
-- spots 는 공유 캐시이므로 인증 사용자 모두 업데이트 허용.
----------------------------------------------------------------------

create policy "Authenticated users can update spots"
  on public.spots for update
  to authenticated
  using (true)
  with check (true);
