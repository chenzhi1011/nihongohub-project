begin;

create extension if not exists pgtap with schema extensions;
select plan(13);

insert into auth.users (id, email)
values
  ('11111111-1111-4111-8111-111111111111', 'rls-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'rls-b@example.test');

insert into public.resources (owner_id, name, description, url)
values
  ('11111111-1111-4111-8111-111111111111', 'A private', 'Owned by A', 'https://private-a.example.test/path'),
  ('22222222-2222-4222-8222-222222222222', 'B private', 'Owned by B', 'https://private-b.example.test/path');

insert into public.resource_categories (resource_id, category)
select id, 'basic' from public.resources where owner_id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222'
);

insert into public.resource_marks (user_id, resource_id)
select '22222222-2222-4222-8222-222222222222', id
from public.resources where owner_id is null limit 1;

insert into public.resource_history (user_id, resource_id)
select '22222222-2222-4222-8222-222222222222', id
from public.resources where owner_id is null limit 1;

set local role anon;
select throws_ok(
  'select count(*) from public.resources',
  '42501', null, 'anonymous cannot read resources directly'
);
select throws_ok(
  'select count(*) from public.resource_categories',
  '42501', null, 'anonymous cannot read placements directly'
);
reset role;

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select is(
  (select count(*)::integer from public.resources where owner_id = '22222222-2222-4222-8222-222222222222'),
  0,
  'user A cannot read user B private resources'
);

select is(
  (select count(*)::integer from public.resources where owner_id = '11111111-1111-4111-8111-111111111111'),
  1,
  'user A can read own private resource'
);

select is(
  (select count(*)::integer from public.resources where owner_id is null),
  37,
  'authenticated user can read every public resource'
);

select is(
  (select count(*)::integer from public.resource_categories placements
    join public.resources resources on resources.id = placements.resource_id
    where resources.owner_id = '22222222-2222-4222-8222-222222222222'),
  0,
  'user A cannot infer B private themes through placements'
);

select is((select count(*)::integer from public.resource_marks), 0, 'user A cannot read B marks');
select is((select count(*)::integer from public.resource_history), 0, 'user A cannot read B history');

select throws_ok(
  $$insert into public.resources (name, description, url)
    values ('Forged public', 'Must be denied', 'https://forged-public.example.test/')$$,
  '42501', null, 'authenticated users cannot insert resources directly'
);

select throws_ok(
  $$update public.resources set name = 'Bypassed update'
    where owner_id = auth.uid()$$,
  '42501', null, 'authenticated users cannot bypass update RPC'
);

select throws_ok(
  $$insert into public.resource_marks (user_id, resource_id)
    select auth.uid(), id from public.resources where owner_id is null limit 1$$,
  '42501', null, 'authenticated users cannot write Mark rows directly'
);

select throws_ok(
  $$insert into public.resource_history (user_id, resource_id)
    select auth.uid(), id from public.resources where owner_id is null limit 1$$,
  '42501', null, 'authenticated users cannot write history rows directly'
);

delete from public.resources
where owner_id = '22222222-2222-4222-8222-222222222222';

reset role;

select is(
  (select count(*)::integer from public.resources
    where owner_id = '22222222-2222-4222-8222-222222222222'),
  1,
  'user A cannot delete user B private resource'
);
rollback;
