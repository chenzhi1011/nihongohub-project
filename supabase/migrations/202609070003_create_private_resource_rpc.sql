create function public.private_resource_limit()
returns integer
language sql
immutable
set search_path = ''
as $$ select 200 $$;

create function public.similar_resource_limit()
returns integer
language sql
immutable
set search_path = ''
as $$ select 30 $$;

create function public.find_similar_resources(
  p_url text,
  p_exclude_resource_id bigint default null
)
returns table (
  resource_id bigint,
  name text,
  description text,
  url text,
  tags text[],
  source text,
  match_type text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  cleaned_url text := btrim(p_url);
  source_key text := public.normalize_resource_url(p_url);
begin
  if current_user_id is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  if source_key is null or cleaned_url !~* '^https?://[^/?#[:space:]]+' then
    raise exception using errcode = 'P0001', message = 'INVALID_URL';
  end if;

  return query
  select
    resources.id,
    resources.name,
    resources.description,
    resources.url,
    resources.tags,
    case when resources.owner_id is null then 'public' else 'private' end,
    case when resources.url = cleaned_url then 'exact_url' else 'same_normalized_url' end
  from public.resources
  where (resources.owner_id is null or resources.owner_id = current_user_id)
    and resources.id is distinct from p_exclude_resource_id
    and (resources.url = cleaned_url or resources.normalized_url = source_key)
  order by
    (resources.url = cleaned_url) desc,
    (resources.owner_id is null) desc,
    resources.id
  limit 10;
end;
$$;

create function public.create_private_resource(
  p_category public.resource_category,
  p_name text,
  p_description text,
  p_url text,
  p_tags text[],
  p_similar_resources_reviewed boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  cleaned_url text := btrim(p_url);
  source_key text := public.normalize_resource_url(p_url);
  cleaned_tags text[] := public.normalize_resource_tags(p_tags);
  private_count integer;
  similar_count integer;
  saved_id bigint;
  recommendations jsonb;
begin
  if current_user_id is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  if p_category is null or p_name is null or p_description is null or p_url is null
    or char_length(btrim(p_name)) not between 1 and 120
    or char_length(btrim(p_description)) not between 1 and 500
    or char_length(cleaned_url) not between 1 and 2048
    or source_key is null
    or cleaned_url !~* '^https?://[^/?#[:space:]]+'
    or not public.resource_tags_are_valid(cleaned_tags)
  then
    return jsonb_build_object('status', 'invalid_input');
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(current_user_id::text, 0));

  select coalesce(jsonb_agg(to_jsonb(matches)), '[]'::jsonb)
  into recommendations
  from public.find_similar_resources(cleaned_url, null) matches;

  if exists (
    select 1 from public.resources
    where (owner_id is null or owner_id = current_user_id) and url = cleaned_url
  ) then
    return jsonb_build_object('status', 'exact_url_exists', 'recommendations', recommendations);
  end if;

  select count(*) into private_count
  from public.resources where owner_id = current_user_id;

  if private_count >= public.private_resource_limit() then
    return jsonb_build_object(
      'status', 'private_limit_reached',
      'current', private_count,
      'limit', public.private_resource_limit()
    );
  end if;

  select count(*) into similar_count
  from public.resources
  where owner_id = current_user_id and normalized_url = source_key;

  if similar_count >= public.similar_resource_limit() then
    return jsonb_build_object(
      'status', 'similar_limit_reached',
      'current', similar_count,
      'limit', public.similar_resource_limit(),
      'recommendations', recommendations
    );
  end if;

  if jsonb_array_length(recommendations) > 0 and not coalesce(p_similar_resources_reviewed, false) then
    return jsonb_build_object('status', 'similar_review_required', 'recommendations', recommendations);
  end if;

  insert into public.resources (owner_id, name, description, url, tags)
  values (current_user_id, p_name, p_description, cleaned_url, cleaned_tags)
  returning id into saved_id;

  insert into public.resource_categories (resource_id, category)
  values (saved_id, p_category);

  return jsonb_build_object('status', 'saved', 'resourceId', saved_id);
end;
$$;

create function public.update_private_resource(
  p_resource_id bigint,
  p_category public.resource_category,
  p_name text,
  p_description text,
  p_url text,
  p_tags text[],
  p_similar_resources_reviewed boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  cleaned_url text := btrim(p_url);
  source_key text := public.normalize_resource_url(p_url);
  cleaned_tags text[] := public.normalize_resource_tags(p_tags);
  similar_count integer;
  recommendations jsonb;
begin
  if current_user_id is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(current_user_id::text, 0));

  if not exists (
    select 1 from public.resources
    where id = p_resource_id and owner_id = current_user_id
  ) then
    raise exception using errcode = 'P0001', message = 'RESOURCE_NOT_OWNED';
  end if;

  if p_category is null or p_name is null or p_description is null or p_url is null
    or char_length(btrim(p_name)) not between 1 and 120
    or char_length(btrim(p_description)) not between 1 and 500
    or char_length(cleaned_url) not between 1 and 2048
    or source_key is null
    or cleaned_url !~* '^https?://[^/?#[:space:]]+'
    or not public.resource_tags_are_valid(cleaned_tags)
  then
    return jsonb_build_object('status', 'invalid_input');
  end if;

  select coalesce(jsonb_agg(to_jsonb(matches)), '[]'::jsonb)
  into recommendations
  from public.find_similar_resources(cleaned_url, p_resource_id) matches;

  if exists (
    select 1 from public.resources
    where id <> p_resource_id
      and (owner_id is null or owner_id = current_user_id)
      and url = cleaned_url
  ) then
    return jsonb_build_object('status', 'exact_url_exists', 'recommendations', recommendations);
  end if;

  select count(*) into similar_count
  from public.resources
  where id <> p_resource_id
    and owner_id = current_user_id
    and normalized_url = source_key;

  if similar_count >= public.similar_resource_limit() then
    return jsonb_build_object(
      'status', 'similar_limit_reached',
      'current', similar_count,
      'limit', public.similar_resource_limit(),
      'recommendations', recommendations
    );
  end if;

  if jsonb_array_length(recommendations) > 0 and not coalesce(p_similar_resources_reviewed, false) then
    return jsonb_build_object('status', 'similar_review_required', 'recommendations', recommendations);
  end if;

  update public.resources
  set name = p_name,
      description = p_description,
      url = cleaned_url,
      tags = cleaned_tags
  where id = p_resource_id and owner_id = current_user_id;

  delete from public.resource_categories where resource_id = p_resource_id;
  insert into public.resource_categories (resource_id, category)
  values (p_resource_id, p_category);

  return jsonb_build_object('status', 'saved', 'resourceId', p_resource_id);
end;
$$;

revoke execute on function public.private_resource_limit() from public, anon;
revoke execute on function public.similar_resource_limit() from public, anon;
revoke execute on function public.find_similar_resources(text, bigint) from public, anon;
revoke execute on function public.create_private_resource(public.resource_category, text, text, text, text[], boolean) from public, anon;
revoke execute on function public.update_private_resource(bigint, public.resource_category, text, text, text, text[], boolean) from public, anon;

grant execute on function public.private_resource_limit() to authenticated;
grant execute on function public.similar_resource_limit() to authenticated;
grant execute on function public.find_similar_resources(text, bigint) to authenticated;
grant execute on function public.create_private_resource(public.resource_category, text, text, text, text[], boolean) to authenticated;
grant execute on function public.update_private_resource(bigint, public.resource_category, text, text, text, text[], boolean) to authenticated;
