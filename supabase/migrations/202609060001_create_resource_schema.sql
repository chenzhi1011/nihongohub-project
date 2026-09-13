create type public.resource_category as enum (
  'basic',
  'exam',
  'listening',
  'speaking',
  'reading',
  'writing',
  'tools',
  'japan',
  'weekly'
);

create function public.normalize_resource_url(input_url text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select lower(
    regexp_replace(
      substring(btrim(input_url) from '^[Hh][Tt][Tt][Pp][Ss]?://([^/?#]+)'),
      '^www\.',
      ''
    )
  );
$$;

comment on function public.normalize_resource_url(text) is
  'Returns a source host key for grouping different direct URLs from the same source.';

create function public.normalize_resource_tags(input_tags text[])
returns text[]
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_agg(tag order by first_position), '{}'::text[])
  from (
    select btrim(value) as tag, min(position) as first_position
    from unnest(coalesce(input_tags, '{}'::text[])) with ordinality as item(value, position)
    where btrim(value) <> ''
    group by btrim(value)
  ) normalized;
$$;

create function public.resource_tags_are_valid(input_tags text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select cardinality(coalesce(input_tags, '{}'::text[])) <= 10
    and coalesce(bool_and(char_length(tag) between 1 and 30), true)
  from unnest(coalesce(input_tags, '{}'::text[])) as tag;
$$;

create table public.resources (
  id bigint generated always as identity primary key,
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null constraint resources_name_length check (char_length(name) between 1 and 120),
  description text not null constraint resources_description_length check (char_length(description) between 1 and 500),
  url text not null constraint resources_url_valid check (
    char_length(url) between 1 and 2048
    and url ~* '^https?://[^/?#[:space:]]+'
  ),
  normalized_url text not null,
  tags text[] not null default '{}'::text[]
    constraint resources_tags_valid check (public.resource_tags_are_valid(tags)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.prepare_resource_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.name := btrim(new.name);
  new.description := btrim(new.description);
  new.url := btrim(new.url);
  new.normalized_url := public.normalize_resource_url(new.url);
  new.tags := public.normalize_resource_tags(new.tags);
  new.updated_at := now();
  return new;
end;
$$;

create trigger prepare_resource_fields_before_write
before insert or update on public.resources
for each row execute function public.prepare_resource_fields();

create table public.resource_categories (
  resource_id bigint not null references public.resources(id) on delete cascade,
  category public.resource_category not null,
  sort_order integer not null default 0 constraint resource_categories_sort_order_nonnegative check (sort_order >= 0),
  primary key (resource_id, category)
);

create table public.resource_marks (
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_id bigint not null references public.resources(id) on delete cascade,
  marked_at timestamptz not null default now(),
  primary key (user_id, resource_id)
);

create table public.resource_history (
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_id bigint not null references public.resources(id) on delete cascade,
  visit_count integer not null default 1 constraint resource_history_visit_count_positive check (visit_count > 0),
  first_visited_at timestamptz not null default now(),
  last_visited_at timestamptz not null default now(),
  primary key (user_id, resource_id),
  constraint resource_history_time_order check (last_visited_at >= first_visited_at)
);

create index resource_categories_catalog_idx
  on public.resource_categories (category, sort_order, resource_id);

create index resources_private_owner_created_idx
  on public.resources (owner_id, created_at desc, id)
  where owner_id is not null;

create index resources_public_normalized_url_idx
  on public.resources (normalized_url)
  where owner_id is null;

create index resources_private_normalized_url_idx
  on public.resources (owner_id, normalized_url)
  where owner_id is not null;

create index resource_history_recent_idx
  on public.resource_history (user_id, last_visited_at desc, resource_id);

create unique index resources_public_url_unique_idx
  on public.resources (url)
  where owner_id is null;

create unique index resources_private_owner_url_unique_idx
  on public.resources (owner_id, url)
  where owner_id is not null;
