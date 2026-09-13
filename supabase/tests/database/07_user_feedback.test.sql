begin;

create extension if not exists pgtap with schema extensions;
select plan(19);

select has_table('public', 'user_feedback', 'user_feedback table exists');
select col_type_is('public', 'user_feedback', 'id', 'uuid', 'feedback id uses uuid');
select col_is_pk('public', 'user_feedback', 'id', 'feedback id is the primary key');
select has_fk('public', 'user_feedback', 'feedback belongs to an auth user');
select has_function('public', 'submit_feedback', array['text'], 'feedback submission RPC exists');

insert into auth.users (id, email)
values
  ('77777777-7777-4777-8777-777777777777', 'feedback-a@example.test'),
  ('88888888-8888-4888-8888-888888888888', 'feedback-b@example.test');

set local role anon;
select throws_ok(
  $$select public.submit_feedback('anonymous feedback')$$,
  '42501', null, 'anonymous users cannot execute the feedback RPC'
);
reset role;

select set_config('request.jwt.claim.sub', '77777777-7777-4777-8777-777777777777', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select throws_ok(
  $$select count(*) from public.user_feedback$$,
  '42501', null, 'authenticated users cannot read feedback directly'
);

select throws_ok(
  $$insert into public.user_feedback (user_id, content)
    values (auth.uid(), 'direct insert')$$,
  '42501', null, 'authenticated users cannot insert feedback directly'
);

select throws_ok(
  $$select public.submit_feedback('   ')$$,
  'P0001', 'feedback_invalid_content', 'blank feedback is rejected'
);

select throws_ok(
  $$select public.submit_feedback(repeat('a', 1001))$$,
  'P0001', 'feedback_invalid_content', 'feedback over 1000 characters is rejected'
);

select lives_ok(
  $$select public.submit_feedback('  Helpful feedback  ')$$,
  'valid feedback is accepted'
);

select throws_ok(
  $$select public.submit_feedback('too soon')$$,
  'P0001', 'feedback_rate_limited', 'feedback inside 60 seconds is rejected'
);

reset role;

select is(
  (select content from public.user_feedback
    where user_id = '77777777-7777-4777-8777-777777777777'),
  'Helpful feedback',
  'feedback is stored after trimming'
);

select is(
  (select count(*)::integer from public.user_feedback
    where user_id = '77777777-7777-4777-8777-777777777777'),
  1,
  'the RPC binds feedback to the authenticated user'
);

update public.user_feedback
set created_at = date_trunc('day', timezone('Asia/Tokyo', now())) at time zone 'Asia/Tokyo'
where user_id = '77777777-7777-4777-8777-777777777777';

insert into public.user_feedback (user_id, content, created_at)
select
  '77777777-7777-4777-8777-777777777777',
  'Earlier feedback ' || n,
  (date_trunc('day', timezone('Asia/Tokyo', now())) + (n * interval '1 minute')) at time zone 'Asia/Tokyo'
from generate_series(1, 4) n;

set local role authenticated;
select throws_ok(
  $$select public.submit_feedback('sixth feedback today')$$,
  'P0001', 'feedback_daily_limit_reached', 'the sixth feedback in a Tokyo day is rejected'
);
reset role;

select set_config('request.jwt.claim.sub', '88888888-8888-4888-8888-888888888888', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select lives_ok(
  $$select public.submit_feedback('Another user feedback')$$,
  'one user limit does not affect another user'
);

reset role;

select is(
  (select count(*)::integer from public.user_feedback
    where user_id = '88888888-8888-4888-8888-888888888888'),
  1,
  'the second user feedback is stored separately'
);

delete from auth.users where id = '88888888-8888-4888-8888-888888888888';

select is(
  (select count(*)::integer from public.user_feedback
    where user_id = '88888888-8888-4888-8888-888888888888'),
  0,
  'deleting a user cascades to their feedback'
);

select is(
  (select count(*)::integer from public.user_feedback
    where user_id = '77777777-7777-4777-8777-777777777777'),
  5,
  'the rejected sixth feedback is not stored'
);

select * from finish();
rollback;
