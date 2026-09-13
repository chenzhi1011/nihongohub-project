begin;

create extension if not exists pgtap with schema extensions;

select plan(18);

select has_type('public', 'resource_category', 'resource_category enum exists');
select enum_has_labels(
  'public',
  'resource_category',
  array['basic', 'exam', 'listening', 'speaking', 'reading', 'writing', 'tools', 'japan', 'weekly'],
  'resource_category has the approved labels in display-independent order'
);

select has_table('public', 'resources', 'resources table exists');
select has_table('public', 'resource_categories', 'resource_categories table exists');
select has_table('public', 'resource_marks', 'resource_marks table exists');
select has_table('public', 'resource_history', 'resource_history table exists');

select col_type_is('public', 'resources', 'id', 'bigint', 'resource id is bigint');
select col_is_pk('public', 'resources', 'id', 'resource id is the primary key');
select col_type_is('public', 'resources', 'owner_id', 'uuid', 'owner id matches auth user ids');
select col_not_null('public', 'resources', 'normalized_url', 'normalized URL is database-owned and required');
select has_pk('public', 'resource_categories', 'resource_categories has a primary key');
select has_fk('public', 'resource_categories', 'resource_categories references resources');
select has_pk('public', 'resource_marks', 'resource_marks has a primary key');
select has_fk('public', 'resource_marks', 'resource_marks has foreign keys');
select has_pk('public', 'resource_history', 'resource_history has a primary key');
select has_fk('public', 'resource_history', 'resource_history has foreign keys');

insert into public.resources (name, description, url)
values ('Multi-theme fixture', 'A shared public resource used only by this test', 'https://schema-test.example/resource')
returning id as resource_id \gset

insert into public.resource_categories (resource_id, category, sort_order)
values
  (:resource_id, 'listening', 0),
  (:resource_id, 'reading', 0);

select is(
  (select count(*)::integer from public.resource_categories where resource_id = :resource_id),
  2,
  'one canonical resource can be placed in two themes'
);

select throws_ok(
  format(
    'insert into public.resource_categories (resource_id, category) values (%s, %L)',
    :resource_id,
    'reading'
  ),
  '23505',
  null,
  'the same resource cannot repeat a theme placement'
);

select * from finish();
rollback;
