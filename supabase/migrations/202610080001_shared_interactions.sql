-- FC Chẹp Chẹp: run the entire file in Supabase SQL Editor as project owner.
-- No local-data import, CAPTCHA, cron or admin UI. All writes use narrow RPCs.
begin;
create schema if not exists fc_private;
revoke all on schema fc_private from public, anon, authenticated;

create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('team','player')),
  target_id text not null check (
    (target_type = 'team' and target_id = 'fc-chep-chep') or
    (target_type = 'player' and target_id ~ '^[a-z0-9-]{1,50}$')
  ),
  reaction_type text not null check (reaction_type in ('football','fire','applause','heart','laugh')),
  visitor_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (target_type, target_id, reaction_type, visitor_id)
);
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null check (display_name = btrim(display_name) and char_length(display_name) between 1 and 30 and display_name ~ '\S'),
  rating integer not null check (rating between 1 and 5),
  content text not null check (content = btrim(content) and char_length(content) between 1 and 300 and content ~ '\S'),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  player_id text not null check (player_id ~ '^[a-z0-9-]{1,50}$'),
  visitor_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (display_name = btrim(display_name) and char_length(display_name) between 1 and 30 and display_name ~ '\S'),
  content text not null check (content = btrim(content) and char_length(content) between 1 and 200 and content ~ '\S'),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
-- One bounded timestamp array per visitor, at most 30 entries. Not an exposed schema.
create table if not exists fc_private.reaction_rate (
  visitor_id uuid primary key references auth.users(id) on delete cascade,
  events timestamptz[] not null default '{}'
);
alter table public.reactions enable row level security;
alter table public.reviews enable row level security;
alter table public.comments enable row level security;
alter table fc_private.reaction_rate enable row level security;
create index if not exists fc_reactions_target on public.reactions(target_type, target_id, created_at desc);
create index if not exists fc_reactions_visitor on public.reactions(visitor_id);
create index if not exists fc_reviews_public on public.reviews(created_at desc, id desc) where not hidden;
create index if not exists fc_comments_public on public.comments(player_id, created_at desc, id desc) where not hidden;
create index if not exists fc_comments_visitor on public.comments(visitor_id, created_at desc);

-- No client DML grants. Safe-column read grants also omit visitor_id.
revoke all on public.reactions, public.reviews, public.comments from public, anon, authenticated;
revoke all on fc_private.reaction_rate from public, anon, authenticated;
grant select (id, display_name, rating, content, created_at) on public.reviews to anon, authenticated;
grant select (id, player_id, display_name, content, created_at) on public.comments to anon, authenticated;
drop policy if exists fc_visible_reviews on public.reviews;
create policy fc_visible_reviews on public.reviews for select to anon, authenticated using (not hidden);
drop policy if exists fc_visible_comments on public.comments;
create policy fc_visible_comments on public.comments for select to anon, authenticated using (not hidden);
-- Reactions are only exposed as aggregates or the caller's selected types via RPC.
drop policy if exists fc_own_reactions on public.reactions;
create policy fc_own_reactions on public.reactions for select to authenticated using (visitor_id = (select auth.uid()));

create or replace function fc_private.require_visitor() returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid := auth.uid();
begin
  if v_id is null or coalesce(auth.jwt()->>'is_anonymous', 'false') <> 'true' then
    raise exception 'Hãy nhập tên để tạo phiên khách trước khi tương tác.';
  end if;
  return v_id;
end;
$$;
create or replace function fc_private.check_cooldown(p_visitor uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_last timestamptz; v_seconds integer;
begin
  -- Caller has acquired a per-visitor transaction lock before reaching this function.
  select max(sent_at) into v_last from (
    select max(created_at) sent_at from public.reviews where visitor_id = p_visitor
    union all select max(created_at) from public.comments where visitor_id = p_visitor
  ) recent;
  v_seconds := ceil(extract(epoch from (v_last + interval '30 seconds' - clock_timestamp())))::integer;
  if v_seconds > 0 then raise exception 'Bạn vừa gửi nội dung. Vui lòng đợi % giây rồi thử lại.', v_seconds; end if;
end;
$$;

create or replace function public.fc_reaction_summary(p_target_type text, p_target_id text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_result jsonb;
begin
  if p_target_type is null or p_target_id is null or not (
    (p_target_type = 'team' and p_target_id = 'fc-chep-chep') or
    (p_target_type = 'player' and p_target_id ~ '^[a-z0-9-]{1,50}$')
  ) then raise exception 'Đối tượng tương tác không hợp lệ.'; end if;
  select jsonb_build_object(
    'counts', jsonb_build_object(
      'football', count(*) filter (where reaction_type = 'football'),
      'fire', count(*) filter (where reaction_type = 'fire'),
      'applause', count(*) filter (where reaction_type = 'applause'),
      'heart', count(*) filter (where reaction_type = 'heart'),
      'laugh', count(*) filter (where reaction_type = 'laugh')),
    'total', count(*),
    'selected', coalesce(jsonb_agg(reaction_type order by reaction_type) filter (where visitor_id = auth.uid()), '[]'::jsonb)
  ) into v_result from public.reactions where target_type = p_target_type and target_id = p_target_id;
  return v_result;
end;
$$;

-- Set an explicit desired state: retries cannot accidentally toggle a successful write back off.
create or replace function public.fc_set_reaction(p_target_type text, p_target_id text, p_reaction_type text, p_selected boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_id uuid := fc_private.require_visitor(); v_now timestamptz; v_events timestamptz[];
begin
  if p_reaction_type is null or p_reaction_type not in ('football','fire','applause','heart','laugh') or p_selected is null then
    raise exception 'Cảm xúc không hợp lệ.';
  end if;
  perform public.fc_reaction_summary(p_target_type, p_target_id);
  perform pg_advisory_xact_lock(hashtextextended(v_id::text, 0));
  v_now := clock_timestamp();
  select coalesce(array_agg(event_time order by event_time), '{}'::timestamptz[]) into v_events
  from fc_private.reaction_rate r cross join lateral unnest(r.events) event_time
  where r.visitor_id = v_id and event_time > v_now - interval '1 minute';
  if cardinality(v_events) >= 30 then raise exception 'Bạn thao tác quá nhanh. Hãy đợi một phút rồi thử lại.'; end if;
  insert into fc_private.reaction_rate(visitor_id, events) values(v_id, array_append(v_events, v_now))
  on conflict(visitor_id) do update set events = excluded.events;
  if p_selected then
    insert into public.reactions(target_type, target_id, reaction_type, visitor_id, created_at)
    values(p_target_type, p_target_id, p_reaction_type, v_id, v_now)
    on conflict(target_type, target_id, reaction_type, visitor_id) do nothing;
  else
    delete from public.reactions where target_type = p_target_type and target_id = p_target_id
      and reaction_type = p_reaction_type and visitor_id = v_id;
  end if;
  return public.fc_reaction_summary(p_target_type, p_target_id);
end;
$$;

create or replace function public.fc_team_stats() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'count', (select count(*) from public.reviews where not hidden),
    'average', (select avg(rating) from public.reviews where not hidden),
    'hasReviewed', exists(select 1 from public.reviews where visitor_id = auth.uid()),
    'ownReview', (select jsonb_build_object('id', id, 'displayName', display_name, 'rating', rating, 'content', content, 'createdAt', created_at)
      from public.reviews where visitor_id = auth.uid() and not hidden)
  );
$$;
create or replace function public.fc_reviews_page(p_offset integer default 0, p_limit integer default 5) returns jsonb
language sql stable security definer set search_path = '' as $$
  with page as (
    select id, display_name, rating, content, created_at from public.reviews where not hidden
    order by created_at desc, id desc limit least(10, greatest(1, coalesce(p_limit,5))) offset greatest(0, coalesce(p_offset,0))
  ), tally as (select count(*) n from public.reviews where not hidden)
  select jsonb_build_object('items', coalesce((select jsonb_agg(jsonb_build_object(
    'id', id, 'displayName', display_name, 'rating', rating, 'content', content, 'createdAt', created_at
  ) order by created_at desc, id desc) from page), '[]'::jsonb), 'total', n,
  'hasMore', greatest(0, coalesce(p_offset,0)) + (select count(*) from page) < n) from tally;
$$;
create or replace function public.fc_comments_page(p_player_id text, p_offset integer default 0, p_limit integer default 5) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_result jsonb;
begin
  if p_player_id is null or p_player_id !~ '^[a-z0-9-]{1,50}$' then raise exception 'Mã cầu thủ không hợp lệ.'; end if;
  with page as (
    select id, player_id, display_name, content, created_at from public.comments where player_id = p_player_id and not hidden
    order by created_at desc, id desc limit least(10, greatest(1, coalesce(p_limit,5))) offset greatest(0, coalesce(p_offset,0))
  ), tally as (select count(*) n from public.comments where player_id = p_player_id and not hidden)
  select jsonb_build_object('items', coalesce((select jsonb_agg(jsonb_build_object(
    'id', id, 'playerId', player_id, 'displayName', display_name, 'content', content, 'createdAt', created_at
  ) order by created_at desc, id desc) from page), '[]'::jsonb), 'total', n,
  'hasMore', greatest(0, coalesce(p_offset,0)) + (select count(*) from page) < n) into v_result from tally;
  return v_result;
end;
$$;
create or replace function public.fc_player_stats(p_player_ids text[]) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_result jsonb;
begin
  if p_player_ids is null or cardinality(p_player_ids) > 100 or exists(select 1 from unnest(p_player_ids) x where x is null or x !~ '^[a-z0-9-]{1,50}$') then
    raise exception 'Danh sách cầu thủ không hợp lệ.';
  end if;
  with ids as (select distinct unnest(p_player_ids) id),
  reactions as (select target_id id, count(*) n from public.reactions where target_type = 'player' and target_id = any(p_player_ids) group by target_id),
  comments as (select player_id id, count(*) n from public.comments where not hidden and player_id = any(p_player_ids) group by player_id)
  select coalesce(jsonb_object_agg(ids.id, jsonb_build_object('reactions',coalesce(reactions.n,0),'comments',coalesce(comments.n,0))), '{}'::jsonb)
  into v_result from ids left join reactions using(id) left join comments using(id);
  return v_result;
end;
$$;

create or replace function public.fc_add_review(p_display_name text, p_rating integer, p_content text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_id uuid := fc_private.require_visitor(); v_row public.reviews; v_name text := regexp_replace(p_display_name, '^\s+|\s+$', '', 'g'); v_content text := regexp_replace(p_content, '^\s+|\s+$', '', 'g');
begin
  if v_name is null or char_length(v_name) not between 1 and 30 or v_content is null or char_length(v_content) not between 1 and 300 or p_rating is null or p_rating not between 1 and 5 then
    raise exception 'Tên, điểm hoặc góp ý không hợp lệ.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_id::text,0));
  if exists(select 1 from public.reviews where visitor_id = v_id) then raise exception 'Bạn đã đánh giá đội. Mỗi phiên khách chỉ được đánh giá một lần.'; end if;
  perform fc_private.check_cooldown(v_id);
  insert into public.reviews(visitor_id, display_name, rating, content, created_at) values(v_id, v_name, p_rating, v_content, clock_timestamp()) returning * into v_row;
  return jsonb_build_object('id',v_row.id,'displayName',v_row.display_name,'rating',v_row.rating,'content',v_row.content,'createdAt',v_row.created_at);
end;
$$;
create or replace function public.fc_add_comment(p_player_id text, p_display_name text, p_content text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_id uuid := fc_private.require_visitor(); v_row public.comments; v_name text := regexp_replace(p_display_name, '^\s+|\s+$', '', 'g'); v_content text := regexp_replace(p_content, '^\s+|\s+$', '', 'g');
begin
  if p_player_id is null or p_player_id !~ '^[a-z0-9-]{1,50}$' or v_name is null or char_length(v_name) not between 1 and 30 or v_content is null or char_length(v_content) not between 1 and 200 then
    raise exception 'Tên, mã cầu thủ hoặc bình luận không hợp lệ.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_id::text,0));
  perform fc_private.check_cooldown(v_id);
  insert into public.comments(player_id, visitor_id, display_name, content, created_at) values(p_player_id, v_id, v_name, v_content, clock_timestamp()) returning * into v_row;
  return jsonb_build_object('id',v_row.id,'playerId',v_row.player_id,'displayName',v_row.display_name,'content',v_row.content,'createdAt',v_row.created_at);
end;
$$;

-- Functions default to EXECUTE for PUBLIC in Postgres: explicitly remove that privilege.
revoke all on all functions in schema fc_private from public, anon, authenticated;
revoke all on function public.fc_reaction_summary(text,text), public.fc_team_stats(), public.fc_reviews_page(integer,integer), public.fc_comments_page(text,integer,integer), public.fc_player_stats(text[]), public.fc_set_reaction(text,text,text,boolean), public.fc_add_review(text,integer,text), public.fc_add_comment(text,text,text) from public, anon, authenticated;
grant execute on function public.fc_reaction_summary(text,text), public.fc_team_stats(), public.fc_reviews_page(integer,integer), public.fc_comments_page(text,integer,integer), public.fc_player_stats(text[]) to anon, authenticated;
grant execute on function public.fc_set_reaction(text,text,text,boolean), public.fc_add_review(text,integer,text), public.fc_add_comment(text,text,text) to authenticated;
notify pgrst, 'reload schema';
commit;
