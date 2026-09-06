begin;

create extension if not exists pgtap with schema extensions;
select plan(23);

select has_function('public', 'private_resource_limit', 'private total limit function exists');
select has_function('public', 'similar_resource_limit', 'same-source limit function exists');
select has_function(
  'public', 'find_similar_resources', array['text', 'bigint'],
  'similar resource RPC exists'
);
select has_function(
  'public', 'create_private_resource',
  array['resource_category', 'text', 'text', 'text', 'text[]', 'boolean'],
  'private resource create RPC exists'
);
select has_function(
  'public', 'update_private_resource',
  array['bigint', 'resource_category', 'text', 'text', 'text', 'text[]', 'boolean'],
  'private resource update RPC exists'
);

insert into auth.users (id, email)
values
  ('55555555-5555-4555-8555-555555555555', 'private-a@example.test'),
  ('66666666-6666-4666-8666-666666666666', 'private-b@example.test'),
  ('77777777-7777-4777-8777-777777777777', 'total-limit@example.test'),
  ('88888888-8888-4888-8888-888888888888', 'similar-limit@example.test'),
  ('99999999-9999-4999-8999-999999999999', 'public-not-counted@example.test');

insert into public.resources (name, description, url)
values ('Shared public', 'Public recommendation fixture', 'https://shared-source.example/reading');

insert into public.resources (owner_id, name, description, url)
values
  ('55555555-5555-4555-8555-555555555555', 'A similar', 'Visible to A', 'https://shared-source.example/a-existing'),
  ('66666666-6666-4666-8666-666666666666', 'B similar', 'Must stay hidden', 'https://shared-source.example/b-hidden');

insert into public.resource_categories (resource_id, category)
select id, 'reading' from public.resources where url like 'https://shared-source.example/%';

insert into public.resources (owner_id, name, description, url)
select
  '77777777-7777-4777-8777-777777777777',
  'Total fixture ' || number,
  'Counts toward 200',
  'https://total-' || number || '.example.test/path'
from generate_series(1, 200) number;

insert into public.resources (owner_id, name, description, url)
select
  '88888888-8888-4888-8888-888888888888',
  'Similar fixture ' || number,
  'Counts toward 30',
  'https://thirty.example.test/path/' || number
from generate_series(1, 30) number;

insert into public.resources (owner_id, name, description, url)
select
  '99999999-9999-4999-8999-999999999999',
  'Twenty-nine fixture ' || number,
  'The next private resource remains allowed',
  'https://public-does-not-count.example.test/private/' || number
from generate_series(1, 29) number;

insert into public.resources (name, description, url)
select
  'Public same-source fixture ' || number,
  'Must not consume the private limit',
  'https://public-does-not-count.example.test/public/' || number
from generate_series(1, 5) number;

set local role anon;
select throws_ok(
  $$select * from public.find_similar_resources('https://shared-source.example/new', null)$$,
  '42501', null, 'anonymous cannot search private-resource recommendations'
);
reset role;

select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select is(public.private_resource_limit(), 200, 'private total limit is centralized at 200');
select is(public.similar_resource_limit(), 30, 'same-source private limit is centralized at 30');

select is(
  (select count(*)::integer from public.find_similar_resources('https://shared-source.example/new', null)),
  2,
  'recommendations contain public plus the current user private resource'
);

select is(
  (select count(*)::integer from public.find_similar_resources('https://shared-source.example/b-hidden', null)
    where url = 'https://shared-source.example/b-hidden'),
  0,
  'recommendations never expose another user private resource'
);

select is(
  public.create_private_resource(
    'reading', 'Duplicate', 'Must not save', 'https://shared-source.example/reading', array[]::text[], true
  )->>'status',
  'exact_url_exists',
  'an exact public URL is rejected with a stable status'
);

select is(
  public.create_private_resource(
    'listening', 'Needs review', 'Must pause', 'https://shared-source.example/new-direct', array[]::text[], false
  )->>'status',
  'similar_review_required',
  'a same-source URL pauses until recommendations are reviewed'
);

select is(
  public.create_private_resource(
    'listening', 'Invalid description', null, 'https://invalid-input.example/path', array[]::text[], true
  )->>'status',
  'invalid_input',
  'null required fields return a stable validation status'
);

select is(
  public.create_private_resource(
    'listening', 'Reviewed resource', 'May save', 'https://shared-source.example/new-direct', array[' audio '], true
  )->>'status',
  'saved',
  'reviewed same-source URL can be saved'
);

select is(
  (select count(*)::integer from public.resources
    where owner_id = auth.uid() and url = 'https://shared-source.example/new-direct'),
  1,
  'create RPC always assigns the current user as owner'
);

select is(
  (select count(*)::integer from public.resource_categories placements
    join public.resources resources on resources.id = placements.resource_id
    where resources.owner_id = auth.uid() and resources.url = 'https://shared-source.example/new-direct'),
  1,
  'a private resource receives exactly one theme placement'
);

select id as saved_a_id
from public.resources where owner_id = auth.uid() and url = 'https://shared-source.example/new-direct' \gset
reset role;
select id as private_b_id
from public.resources where owner_id = '66666666-6666-4666-8666-666666666666' limit 1 \gset
set local role authenticated;

select throws_ok(
  format(
    'select public.update_private_resource(%s, %L, %L, %L, %L, %L::text[], true)',
    :private_b_id, 'reading', 'Forged update', 'Must fail', 'https://shared-source.example/b-forged', '{}'
  ),
  'P0001', 'RESOURCE_NOT_OWNED', 'a user cannot update another user private resource'
);

select is(
  public.update_private_resource(
    :saved_a_id, 'tools', 'Updated own', 'Still one theme',
    'https://updated-own.example.test/path', array['tool'], true
  )->>'status',
  'saved',
  'a user can update own private resource'
);

select results_eq(
  format('select category from public.resource_categories where resource_id = %s', :saved_a_id),
  $$values ('tools'::public.resource_category)$$,
  'update RPC replaces the old theme instead of adding a second placement'
);

reset role;
select set_config('request.jwt.claim.sub', '77777777-7777-4777-8777-777777777777', true);
set local role authenticated;
select is(
  public.create_private_resource(
    'basic', 'Retry existing', 'Should report the existing row',
    'https://total-1.example.test/path', array[]::text[], true
  )->>'status',
  'exact_url_exists',
  'an exact retry is recognized even when the user already has 200 resources'
);

select is(
  public.create_private_resource(
    'basic', '201st resource', 'Must fail', 'https://new-total.example.test/path', array[]::text[], true
  )->>'status',
  'private_limit_reached',
  'the 201st private resource is rejected'
);

reset role;
select set_config('request.jwt.claim.sub', '88888888-8888-4888-8888-888888888888', true);
set local role authenticated;
select is(
  public.create_private_resource(
    'basic', '31st same source', 'Must fail', 'https://thirty.example.test/path/31', array[]::text[], true
  )->>'status',
  'similar_limit_reached',
  'the 31st private resource from one source is rejected'
);

reset role;
select set_config('request.jwt.claim.sub', '99999999-9999-4999-8999-999999999999', true);
set local role authenticated;
select is(
  public.create_private_resource(
    'basic', '30th private same source', 'Must save despite public rows',
    'https://public-does-not-count.example.test/private/30', array[]::text[], true
  )->>'status',
  'saved',
  'public same-source resources do not consume the private limit'
);

select * from finish();
rollback;
