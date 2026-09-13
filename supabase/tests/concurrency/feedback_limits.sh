#!/usr/bin/env bash
set -euo pipefail

db_container="supabase_db_resource-space"
feedback_user="99999999-9999-4999-8999-999999999999"
result_dir="$(mktemp -d)"

cleanup() {
  docker exec "$db_container" psql -U postgres -d postgres -qAtc \
    "delete from auth.users where id = '$feedback_user'" >/dev/null || true
  rm -rf "$result_dir"
}
trap cleanup EXIT

docker exec "$db_container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -qAtc "
  insert into auth.users (id, email)
  values ('$feedback_user', 'concurrent-feedback@example.test');

  insert into public.user_feedback (user_id, content, created_at)
  select
    '$feedback_user',
    'Earlier feedback ' || n,
    (date_trunc('day', timezone('Asia/Tokyo', now())) + (n * interval '1 minute')) at time zone 'Asia/Tokyo'
  from generate_series(1, 4) n;
" >/dev/null

submit_feedback() {
  local content="$1"
  local output_file="$2"
  local command_output

  if command_output="$(docker exec "$db_container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -qAtc "
    begin;
    set local role authenticated;
    set local request.jwt.claim.sub = '$feedback_user';
    select public.submit_feedback('$content');
    commit;
  " 2>&1)"; then
    printf '%s\n' 'saved' >"$output_file"
    return 0
  fi

  if [[ "$command_output" == *"feedback_daily_limit_reached"* ]]; then
    printf '%s\n' 'feedback_daily_limit_reached' >"$output_file"
    return 0
  fi

  printf '%s\n' "$command_output" >&2
  return 1
}

submit_feedback "Concurrent feedback A" "$result_dir/a" &
pid_a=$!
submit_feedback "Concurrent feedback B" "$result_dir/b" &
pid_b=$!
wait "$pid_a" "$pid_b"

test "$(docker exec "$db_container" psql -U postgres -d postgres -qAtc \
  "select count(*) from public.user_feedback where user_id = '$feedback_user'")" = "5"
test "$(sort "$result_dir/a" "$result_dir/b" | tr '\n' ' ')" = \
  "feedback_daily_limit_reached saved "

echo "Concurrent feedback limit passed."
