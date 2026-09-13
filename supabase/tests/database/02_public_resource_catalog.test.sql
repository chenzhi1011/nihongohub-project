begin;

create extension if not exists pgtap with schema extensions;
select plan(5);

select is(
  (select count(*)::integer from public.resources where owner_id is null),
  37,
  'initialization migration contains 37 canonical public resources'
);

select is(
  (select count(*)::integer from public.resource_categories),
  43,
  'initialization migration preserves all 43 theme placements'
);

select is(
  (select count(*)::integer from public.resources where owner_id is not null),
  0,
  'initialization migration never creates private resources'
);

select is(
  (
    select count(*)::integer
    from public.resource_categories placements
    join public.resources resources on resources.id = placements.resource_id
    where resources.url = 'https://www3.nhk.or.jp/news/easy/'
      and placements.category in ('listening', 'reading')
  ),
  2,
  'NHK Easy is one resource placed in listening and reading'
);

select is(
  (select count(*)::integer from public.resources where url like '%/https://%'),
  0,
  'initialization migration has no accidentally concatenated URLs'
);

select * from finish();
rollback;
