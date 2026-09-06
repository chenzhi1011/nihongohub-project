begin;

create extension if not exists pgtap with schema extensions;
select plan(19);

select is(
  public.normalize_resource_url(' https://www.example.com/reading/article?from=home#part '),
  'example.com',
  'normalization groups direct links by source host'
);

select is(
  public.normalize_resource_url('http://EXAMPLE.com/listening/audio'),
  'example.com',
  'normalization ignores protocol and host casing for source matching'
);

insert into public.resources (name, description, url, tags)
values ('  Trim me  ', '  Trim this description  ', ' https://example.test/path ', array[' news ', 'news', ' audio '])
returning id as prepared_resource_id \gset

select results_eq(
  format('select name, description, url, normalized_url, tags from public.resources where id = %s', :prepared_resource_id),
  $$values (
    'Trim me'::text,
    'Trim this description'::text,
    'https://example.test/path'::text,
    'example.test'::text,
    array['news', 'audio']::text[]
  )$$,
  'write trigger trims fields, derives the source key, and deduplicates tags'
);

select throws_ok(
  $$insert into public.resources (name, description, url, tags)
    values ('Too many tags', 'Should fail', 'https://tags.example/',
      array['1','2','3','4','5','6','7','8','9','10','11'])$$,
  '23514',
  null,
  'a resource accepts at most ten tags'
);

select throws_ok(
  $$insert into public.resources (name, description, url)
    values ('Duplicate URL', 'Should fail', 'https://example.test/path')$$,
  '23505',
  null,
  'public resources cannot repeat the exact cleaned URL'
);

select throws_ok(
  $$insert into public.resources (name, description, url)
    values ('   ', 'Missing name', 'https://invalid-name.example/')$$,
  '23514', null, 'a trimmed-empty name is rejected'
);

select throws_ok(
  $$insert into public.resources (name, description, url)
    values ('Missing description', '   ', 'https://invalid-description.example/')$$,
  '23514', null, 'a trimmed-empty description is rejected'
);

select throws_ok(
  $$insert into public.resources (name, description, url)
    values ('Invalid URL', 'Missing HTTP scheme', 'javascript:alert(1)')$$,
  '23502', null, 'a non-HTTP URL is rejected'
);

/* Trigger execution timing can coincide with insertion, so force an old value first. */
update public.resources
set name = 'Updated fixture', updated_at = '2000-01-01T00:00:00Z'
where id = :prepared_resource_id;

select cmp_ok(
  (select updated_at from public.resources where id = :prepared_resource_id),
  '>',
  '2000-01-01T00:00:00Z'::timestamptz,
  'updated_at is owned by the write trigger'
);

select throws_ok(
  format(
    'insert into public.resource_categories (resource_id, category, sort_order) values (%s, %L, -1)',
    :prepared_resource_id,
    'tools'
  ),
  '23514', null, 'negative theme sort order is rejected'
);

insert into public.resource_categories (resource_id, category)
values (:prepared_resource_id, 'tools');

delete from public.resources where id = :prepared_resource_id;

select is(
  (select count(*)::integer from public.resource_categories where resource_id = :prepared_resource_id),
  0,
  'deleting a resource cascades to its theme placements'
);

select has_index('public', 'resource_categories', 'resource_categories_catalog_idx', 'catalog index exists');
select has_index('public', 'resources', 'resources_private_owner_created_idx', 'private owner index exists');
select has_index('public', 'resources', 'resources_public_normalized_url_idx', 'public similarity index exists');
select has_index('public', 'resources', 'resources_private_normalized_url_idx', 'private similarity index exists');
select has_index('public', 'resource_history', 'resource_history_recent_idx', 'recent history index exists');
select has_index('public', 'resources', 'resources_public_url_unique_idx', 'public exact URL index exists');
select has_index('public', 'resources', 'resources_private_owner_url_unique_idx', 'private exact URL index exists');

select throws_ok(
  $$insert into public.resources (name, description, url, tags)
    values ('Long tag', 'Should fail', 'https://long-tag.example/', array[repeat('x', 31)])$$,
  '23514', null, 'an individual tag accepts at most thirty characters'
);

select * from finish();
rollback;
