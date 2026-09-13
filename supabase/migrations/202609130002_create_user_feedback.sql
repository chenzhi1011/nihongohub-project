create table public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index user_feedback_user_created_at_idx
on public.user_feedback (user_id, created_at desc);

alter table public.user_feedback enable row level security;

revoke all on table public.user_feedback from anon, authenticated;

create function public.submit_feedback(p_content text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_content text := btrim(p_content);
  feedback_id uuid;
begin
  if current_user_id is null then
    raise exception 'feedback_auth_required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));

  if normalized_content is null
    or char_length(normalized_content) < 1
    or char_length(normalized_content) > 1000 then
    raise exception 'feedback_invalid_content';
  end if;

  if (
    select count(*)
    from public.user_feedback
    where user_id = current_user_id
      and timezone('Asia/Tokyo', created_at)::date = timezone('Asia/Tokyo', now())::date
  ) >= 5 then
    raise exception 'feedback_daily_limit_reached';
  end if;

  if exists (
    select 1
    from public.user_feedback
    where user_id = current_user_id
      and created_at > now() - interval '60 seconds'
  ) then
    raise exception 'feedback_rate_limited';
  end if;

  insert into public.user_feedback (user_id, content)
  values (current_user_id, normalized_content)
  returning id into feedback_id;

  return feedback_id;
end;
$$;

revoke all on function public.submit_feedback(text) from public, anon;
grant execute on function public.submit_feedback(text) to authenticated;
