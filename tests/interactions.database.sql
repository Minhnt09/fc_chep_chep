-- QA only: run on an isolated Postgres database with migration + Supabase auth roles.
-- Fixtures and test helper are rolled back; never needed in the production SQL Editor.
begin;
create function public.fc_test_assert(ok boolean, label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'FAIL: %', label; end if; end; $$;
insert into auth.users(id) values ('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');
set local role anon;
select public.fc_test_assert((public.fc_team_stats()->>'count')::integer = 0, 'initial totals zero');
do $$ begin
  begin perform public.fc_add_comment('bayco','Fan','Unauthorized'); raise exception 'unexpected write';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","is_anonymous":true}';
set local role authenticated;
select public.fc_test_assert((public.fc_set_reaction('team','fc-chep-chep','heart',true)->'counts'->>'heart')::integer = 1, 'A heart');
select public.fc_test_assert((public.fc_set_reaction('team','fc-chep-chep','heart',true)->'counts'->>'heart')::integer = 1, 'idempotent retry');
select public.fc_test_assert(public.fc_add_review('  Fan A  ',5,'  Lời cổ vũ  ')->>'content' = 'Lời cổ vũ', 'review trim');
do $$ begin
  begin perform public.fc_add_review('Fan A',4,'Second'); raise exception 'unexpected second review';
  exception when raise_exception then if sqlerrm not like '%đã đánh giá%' then raise; end if; end;
  begin perform public.fc_add_comment('bayco','Fan A','Immediate'); raise exception 'unexpected cooldown write';
  exception when raise_exception then if sqlerrm not like '%đợi%' then raise; end if; end;
  begin perform public.fc_add_comment('Bad!','Fan A','Invalid'); raise exception 'unexpected target';
  exception when raise_exception then if sqlerrm not like '%không hợp lệ%' then raise; end if; end;
  begin perform public.fc_add_comment('bayco','Fan A',repeat('x',201)); raise exception 'unexpected long content';
  exception when raise_exception then if sqlerrm not like '%không hợp lệ%' then raise; end if; end;
  begin insert into public.comments(player_id,visitor_id,display_name,content,hidden,created_at) values('bayco','22222222-2222-4222-8222-222222222222','Spoof','bad',true,'2000-01-01'); raise exception 'unexpected direct insert';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
-- Advance only fixture timestamp instead of waiting 30 seconds.
update public.reviews set created_at = clock_timestamp() - interval '31 seconds';
set local role authenticated;
select public.fc_add_comment('bayco','Fan A','<img src=x onerror=alert(1)>');
do $$ begin
  begin perform public.fc_add_comment('bayco','Fan A','Second'); raise exception 'unexpected rapid second comment';
  exception when raise_exception then if sqlerrm not like '%đợi%' then raise; end if; end;
end $$;
reset role;
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","is_anonymous":true}';
set local role authenticated;
select public.fc_test_assert((public.fc_reaction_summary('team','fc-chep-chep')->'counts'->>'heart')::integer = 1, 'B sees A count');
select public.fc_test_assert(public.fc_reaction_summary('team','fc-chep-chep')->'selected' = '[]'::jsonb, 'B selections private');
select public.fc_test_assert(public.fc_comments_page('bayco')->'items'->0->>'content' = '<img src=x onerror=alert(1)>', 'B sees literal A content');
select public.fc_test_assert(not ((public.fc_comments_page('bayco')->'items'->0) ? 'visitorId'), 'DTO no UUID');
select public.fc_test_assert(public.fc_team_stats()->'ownReview' = 'null'::jsonb, 'B cannot see A as own');
select public.fc_set_reaction('team','fc-chep-chep','heart',false);
select public.fc_test_assert((public.fc_reaction_summary('team','fc-chep-chep')->'counts'->>'heart')::integer = 1, 'B cannot delete A reaction');
do $$ begin
  begin update public.comments set hidden = true; raise exception 'unexpected update'; exception when insufficient_privilege then null; end;
  begin delete from public.comments; raise exception 'unexpected delete'; exception when insufficient_privilege then null; end;
  begin perform visitor_id from public.comments; raise exception 'unexpected UUID read'; exception when insufficient_privilege then null; end;
  begin perform fc_private.require_visitor(); raise exception 'unexpected private access'; exception when insufficient_privilege then null; end;
end $$;
reset role;
update public.comments set hidden = true;
update public.reviews set hidden = true;
set local role anon;
select public.fc_test_assert((public.fc_comments_page('bayco')->>'total')::integer = 0, 'hidden comments excluded');
select public.fc_test_assert((public.fc_team_stats()->>'count')::integer = 0 and public.fc_team_stats()->'average' = 'null'::jsonb, 'hidden reviews excluded');
select public.fc_test_assert((public.fc_player_stats(array['bayco'])->'bayco'->>'comments')::integer = 0, 'hidden comment stats');
select public.fc_test_assert((select count(*) from public.comments) = 0, 'RLS direct safe columns hide rows');
reset role;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","is_anonymous":true}';
set local role authenticated;
select public.fc_test_assert((public.fc_team_stats()->>'hasReviewed')::boolean and public.fc_team_stats()->'ownReview' = 'null'::jsonb, 'own hidden review no content leak');
do $$ begin
  for i in 1..28 loop perform public.fc_set_reaction('team','fc-chep-chep','football',true); end loop;
  begin perform public.fc_set_reaction('team','fc-chep-chep','football',false); raise exception 'unexpected >30 writes';
  exception when raise_exception then if sqlerrm not like '%quá nhanh%' then raise; end if; end;
end $$;
reset role;
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","is_anonymous":false}';
set local role authenticated;
do $$ begin
  begin perform public.fc_add_comment('bayco','Fan B','not anonymous'); raise exception 'unexpected permanent write';
  exception when raise_exception then if sqlerrm not like '%phiên khách%' then raise; end if; end;
end $$;
reset role;
-- Deterministic pagination and player isolation (admin fixtures only).
insert into public.comments(player_id,visitor_id,display_name,content,created_at)
select 'bayco','22222222-2222-4222-8222-222222222222','Fixture','Comment '||n,'2026-01-01'::timestamptz + n * interval '1 minute' from generate_series(1,12) n;
set local role anon;
select public.fc_test_assert(jsonb_array_length(public.fc_comments_page('bayco',0,5)->'items') = 5, 'page1');
select public.fc_test_assert(jsonb_array_length(public.fc_comments_page('bayco',10,5)->'items') = 2 and (public.fc_comments_page('bayco',10,5)->>'hasMore')::boolean = false, 'last page');
select public.fc_test_assert(public.fc_comments_page('bayco',0,5)->'items'->0->>'content' = 'Comment 12', 'sort desc');
select public.fc_test_assert((public.fc_comments_page('chep')->>'total')::integer = 0, 'player isolation');
rollback;
