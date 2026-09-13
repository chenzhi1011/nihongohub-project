#!/usr/bin/env bash
set -euo pipefail

db_container="supabase_db_resource-space"
total_user="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
similar_user="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
result_dir="$(mktemp -d)"

cleanup() {
  docker exec "$db_container" psql -U postgres -d postgres -qAtc \
    "delete from auth.users where id in ('$total_user', '$similar_user')" >/dev/null || true
  rm -rf "$result_dir"
}
trap cleanup EXIT

docker exec "$db_container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -qAtc "
  insert into auth.users (id, email) values
    ('$total_user', 'concurrent-total@example.test'),
    ('$similar_user', 'concurrent-similar@example.test');

  insert into public.resources (owner_id, name, description, url)
  select '$total_user', 'Total ' || n, 'Concurrent total fixture',
    'https://concurrent-total-' || n || '.example.test/path'
  from generate_series(1, 199) n;

  insert into public.resources (owner_id, name, description, url)
  select '$similar_user', 'Similar ' || n, 'Concurrent similar fixture',
    'https://concurrent-similar.example.test/path/' || n
  from generate_series(1, 29) n;
" >/dev/null

create_resource() {
  local user_id="$1"
  local resource_name="$2"
  local resource_url="$3"
  local output_file="$4"

  docker exec "$db_container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -qAtc "
    begin;
    set local role authenticated;
    set local request.jwt.claim.sub = '$user_id';
    select public.create_private_resource(
      'basic', '$resource_name', 'Concurrent request', '$resource_url', '{}'::text[], true
    )->>'status';
    commit;
  " | grep -E '^(saved|private_limit_reached|similar_limit_reached)$' >"$output_file"
}

create_resource "$total_user" "Total request A" "https://concurrent-new-a.example.test/path" "$result_dir/total-a" &
total_pid_a=$!
create_resource "$total_user" "Total request B" "https://concurrent-new-b.example.test/path" "$result_dir/total-b" &
total_pid_b=$!
wait "$total_pid_a" "$total_pid_b"

test "$(docker exec "$db_container" psql -U postgres -d postgres -qAtc \
  "select count(*) from public.resources where owner_id = '$total_user'")" = "200"
test "$(sort "$result_dir/total-a" "$result_dir/total-b" | tr '\n' ' ')" = \
  "private_limit_reached saved "

create_resource "$similar_user" "Similar request A" "https://concurrent-similar.example.test/path/30" "$result_dir/similar-a" &
similar_pid_a=$!
create_resource "$similar_user" "Similar request B" "https://concurrent-similar.example.test/path/31" "$result_dir/similar-b" &
similar_pid_b=$!
wait "$similar_pid_a" "$similar_pid_b"

test "$(docker exec "$db_container" psql -U postgres -d postgres -qAtc \
  "select count(*) from public.resources where owner_id = '$similar_user'")" = "30"
test "$(sort "$result_dir/similar-a" "$result_dir/similar-b" | tr '\n' ' ')" = \
  "saved similar_limit_reached "

echo "Concurrent private-resource limits passed."
