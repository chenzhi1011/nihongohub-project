alter table public.resources enable row level security;
alter table public.resource_categories enable row level security;
alter table public.resource_marks enable row level security;
alter table public.resource_history enable row level security;

revoke all on table public.resources from anon, authenticated;
revoke all on table public.resource_categories from anon, authenticated;
revoke all on table public.resource_marks from anon, authenticated;
revoke all on table public.resource_history from anon, authenticated;

grant select, delete on table public.resources to authenticated;
grant select on table public.resource_categories to authenticated;
grant select on table public.resource_marks to authenticated;
grant select on table public.resource_history to authenticated;

create policy resources_authenticated_read
on public.resources
for select
to authenticated
using (owner_id is null or owner_id = (select auth.uid()));

create policy resources_owner_delete
on public.resources
for delete
to authenticated
using (owner_id is not null and owner_id = (select auth.uid()));

create policy resource_categories_visible_resource_read
on public.resource_categories
for select
to authenticated
using (
  exists (
    select 1
    from public.resources
    where resources.id = resource_categories.resource_id
      and (resources.owner_id is null or resources.owner_id = (select auth.uid()))
  )
);

create policy resource_marks_owner_read
on public.resource_marks
for select
to authenticated
using (user_id = (select auth.uid()));

create policy resource_marks_owner_public_insert
on public.resource_marks
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.resources
    where resources.id = resource_marks.resource_id
      and resources.owner_id is null
  )
);

create policy resource_marks_owner_public_delete
on public.resource_marks
for delete
to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.resources
    where resources.id = resource_marks.resource_id
      and resources.owner_id is null
  )
);

create policy resource_history_owner_read
on public.resource_history
for select
to authenticated
using (user_id = (select auth.uid()));

create policy resource_history_owner_visible_insert
on public.resource_history
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.resources
    where resources.id = resource_history.resource_id
      and (resources.owner_id is null or resources.owner_id = (select auth.uid()))
  )
);

create policy resource_history_owner_visible_update
on public.resource_history
for update
to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.resources
    where resources.id = resource_history.resource_id
      and (resources.owner_id is null or resources.owner_id = (select auth.uid()))
  )
);
