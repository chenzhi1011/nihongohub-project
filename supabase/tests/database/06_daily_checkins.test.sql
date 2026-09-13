begin;

create extension if not exists pgtap with schema extensions;
select plan(16);

select has_table('public', 'daily_checkins', 'daily_checkins table exists');
select col_is_pk(
  'public', 'daily_checkins', array['user_id', 'checkin_date'],
  'user and date form the daily_checkins primary key'
);
select has_fk('public', 'daily_checkins', 'daily_checkins references auth users');
select has_function(
  'public', 'check_in_today', array['date'],
  'daily check-in RPC exists'
);

insert into auth.users (id, email)
values
  ('55555555-5555-4555-8555-555555555555', 'checkin-a@example.test'),
  ('66666666-6666-4666-8666-666666666666', 'checkin-b@example.test');

insert into public.daily_checkins (user_id, checkin_date)
values ('66666666-6666-4666-8666-666666666666', current_date);

set local role anon;
select throws_ok(
  'select public.check_in_today(current_date)',
  '42501', null, 'anonymous users cannot execute the check-in RPC'
);
reset role;

select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select is(
  (select count(*)::integer from public.daily_checkins),
  0,
  'a user cannot read another user check-in'
);

select throws_ok(
  $$insert into public.daily_checkins (user_id, checkin_date)
    values (auth.uid(), current_date)$$,
  '42501', null, 'authenticated users cannot insert directly'
);

select throws_ok(
  $$update public.daily_checkins set checked_at = now() where user_id = auth.uid()$$,
  '42501', null, 'authenticated users cannot update directly'
);

select throws_ok(
  $$delete from public.daily_checkins where user_id = auth.uid()$$,
  '42501', null, 'authenticated users cannot delete directly'
);

select is(
  public.check_in_today(current_date),
  'checked',
  'the first daily check-in succeeds'
);

select is(
  public.check_in_today(current_date),
  'already_checked',
  'a repeated daily check-in is idempotent'
);

select is(
  (select count(*)::integer from public.daily_checkins),
  1,
  'a repeated daily check-in keeps exactly one row'
);

select is(
  public.check_in_today(current_date + 1),
  'checked',
  'the next local calendar date is accepted near the UTC boundary'
);

select throws_ok(
  $$select public.check_in_today(current_date - 2)$$,
  'P0001', 'INVALID_CHECKIN_DATE', 'arbitrary historical check-ins are rejected'
);

reset role;

select is(
  (select count(*)::integer from public.daily_checkins
    where user_id = '55555555-5555-4555-8555-555555555555'),
  2,
  'the RPC stores one row for each accepted local date'
);

delete from auth.users where id = '55555555-5555-4555-8555-555555555555';

select is(
  (select count(*)::integer from public.daily_checkins
    where user_id = '55555555-5555-4555-8555-555555555555'),
  0,
  'deleting a user cascades to daily check-ins'
);

select * from finish();
rollback;
