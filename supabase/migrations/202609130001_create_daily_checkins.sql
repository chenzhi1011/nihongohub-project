create table public.daily_checkins (
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null,
  checked_at timestamptz not null default now(),
  primary key (user_id, checkin_date)
);

alter table public.daily_checkins enable row level security;

revoke all on table public.daily_checkins from anon, authenticated;
grant select on table public.daily_checkins to authenticated;

create policy daily_checkins_owner_read
on public.daily_checkins
for select
to authenticated
using (user_id = auth.uid());

create function public.check_in_today(p_checkin_date date)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  inserted_rows integer;
begin
  if current_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_checkin_date is null
    or p_checkin_date < current_date - 1
    or p_checkin_date > current_date + 1 then
    raise exception 'INVALID_CHECKIN_DATE';
  end if;

  insert into public.daily_checkins (user_id, checkin_date)
  values (current_user_id, p_checkin_date)
  on conflict (user_id, checkin_date) do nothing;

  get diagnostics inserted_rows = row_count;

  if inserted_rows = 1 then
    return 'checked';
  end if;

  return 'already_checked';
end;
$$;

revoke all on function public.check_in_today(date) from public, anon;
grant execute on function public.check_in_today(date) to authenticated;
