create function public.get_catalog_snapshot()
returns table (
  category public.resource_category,
  resource_id bigint,
  name text,
  description text,
  url text,
  tags text[],
  sort_order integer,
  total_count bigint,
  locked_count bigint,
  marked boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with ranked_catalog as (
    select
      placements.category,
      resources.id as resource_id,
      resources.name,
      resources.description,
      resources.url,
      resources.tags,
      placements.sort_order,
      count(*) over (partition by placements.category) as total_count,
      row_number() over (
        partition by placements.category
        order by placements.sort_order, resources.id
      ) as category_position
    from public.resource_categories placements
    join public.resources resources on resources.id = placements.resource_id
    where resources.owner_id is null
  )
  select
    catalog.category,
    catalog.resource_id,
    catalog.name,
    catalog.description,
    catalog.url,
    catalog.tags,
    catalog.sort_order,
    catalog.total_count,
    case
      when (select auth.uid()) is null then greatest(catalog.total_count - 6, 0)
      else 0
    end as locked_count,
    case
      when (select auth.uid()) is null then false
      else exists (
        select 1
        from public.resource_marks marks
        where marks.user_id = (select auth.uid())
          and marks.resource_id = catalog.resource_id
      )
    end as marked
  from ranked_catalog catalog
  where (select auth.uid()) is not null or catalog.category_position <= 6
  order by catalog.category, catalog.sort_order, catalog.resource_id;
$$;

create function public.set_resource_mark(p_resource_id bigint, p_marked boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  if not exists (
    select 1 from public.resources
    where id = p_resource_id and owner_id is null
  ) then
    raise exception using errcode = 'P0001', message = 'RESOURCE_NOT_PUBLIC';
  end if;

  if p_marked then
    insert into public.resource_marks (user_id, resource_id)
    values (current_user_id, p_resource_id)
    on conflict (user_id, resource_id) do nothing;
  else
    delete from public.resource_marks
    where user_id = current_user_id and resource_id = p_resource_id;
  end if;
end;
$$;

create function public.record_resource_visit(p_resource_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  if not exists (
    select 1 from public.resources
    where id = p_resource_id
      and (owner_id is null or owner_id = current_user_id)
  ) then
    raise exception using errcode = 'P0001', message = 'RESOURCE_NOT_VISIBLE';
  end if;

  insert into public.resource_history (user_id, resource_id)
  values (current_user_id, p_resource_id)
  on conflict (user_id, resource_id) do update
    set visit_count = public.resource_history.visit_count + 1,
        last_visited_at = now();
end;
$$;

revoke execute on function public.get_catalog_snapshot() from public;
revoke execute on function public.set_resource_mark(bigint, boolean) from public, anon;
revoke execute on function public.record_resource_visit(bigint) from public, anon;

grant execute on function public.get_catalog_snapshot() to anon, authenticated;
grant execute on function public.set_resource_mark(bigint, boolean) to authenticated;
grant execute on function public.record_resource_visit(bigint) to authenticated;
