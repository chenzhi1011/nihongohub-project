begin;

create extension if not exists pgtap with schema extensions;
select plan(16);

select has_function(
  'public', 'get_catalog_snapshot', array[]::text[],
  'catalog snapshot RPC exists'
);

select has_function(
  'public', 'set_resource_mark', array['bigint', 'boolean'],
  'Mark RPC exists'
);

select has_function(
  'public', 'record_resource_visit', array['bigint'],
  'history RPC exists'
);

insert into auth.users (id, email)
values
  ('33333333-3333-4333-8333-333333333333', 'rpc-a@example.test'),
  ('44444444-4444-4444-8444-444444444444', 'rpc-b@example.test');

insert into public.resources (owner_id, name, description, url)
values
  ('33333333-3333-4333-8333-333333333333', 'RPC A private', 'Owned by RPC A', 'https://rpc-private-a.example.test/path'),
  ('44444444-4444-4444-8444-444444444444', 'RPC B private', 'Owned by RPC B', 'https://rpc-private-b.example.test/path');

select id as public_id from public.resources where owner_id is null order by id limit 1 \gset
select id as private_a_id from public.resources where owner_id = '33333333-3333-4333-8333-333333333333' \gset
select id as private_b_id from public.resources where owner_id = '44444444-4444-4444-8444-444444444444' \gset

set local role anon;

select ok(
  not exists (
    select 1 from (
      select category, count(*) from public.get_catalog_snapshot() group by category having count(*) > 6
    ) oversized
  ),
  'anonymous catalog returns at most six rows per theme'
);

select results_eq(
  $$select distinct total_count::integer, locked_count::integer
    from public.get_catalog_snapshot() where category = 'writing'$$,
  $$values (7, 1)$$,
  'anonymous catalog reports counts without returning the locked resource fields'
);

select throws_ok(
  format('select public.set_resource_mark(%s, true)', :public_id),
  '42501', null, 'anonymous cannot execute Mark RPC'
);

reset role;
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select is(
  (select count(*)::integer from public.get_catalog_snapshot()),
  43,
  'authenticated catalog returns every public theme placement'
);

select lives_ok(
  format('select public.set_resource_mark(%s, true)', :public_id),
  'authenticated user can Mark a public resource'
);

select is(
  (select count(*)::integer from public.resource_marks where resource_id = :public_id),
  1,
  'Mark RPC writes exactly one row for the current user'
);

select lives_ok(
  format('select public.set_resource_mark(%s, false)', :public_id),
  'authenticated user can remove own Mark'
);

select throws_ok(
  format('select public.set_resource_mark(%s, true)', :private_a_id),
  'P0001', 'RESOURCE_NOT_PUBLIC', 'private resources cannot be Marked'
);

select lives_ok(
  format('select public.record_resource_visit(%s)', :public_id),
  'history accepts a public resource'
);

select lives_ok(
  format('select public.record_resource_visit(%s)', :public_id),
  'history atomically updates an existing public visit'
);

select is(
  (select visit_count from public.resource_history where resource_id = :public_id),
  2,
  'two visits are summarized in one row'
);

select lives_ok(
  format('select public.record_resource_visit(%s)', :private_a_id),
  'history accepts the current user private resource'
);

select throws_ok(
  format('select public.record_resource_visit(%s)', :private_b_id),
  'P0001', 'RESOURCE_NOT_VISIBLE', 'history rejects another user private resource'
);

select * from finish();
rollback;
