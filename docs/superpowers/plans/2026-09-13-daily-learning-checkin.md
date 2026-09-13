# Daily Learning Check-in Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an irreversible once-per-local-day check-in from the floating action and My Space, with a current-month calendar.

**Architecture:** Postgres stores one fact per user/date behind RLS and an idempotent RPC. A focused API, pure calendar service, and one app-level hook provide shared state to both UI entry points.

**Tech Stack:** React 18, TypeScript, Supabase/Postgres, Vitest, Testing Library, pgTAP, Tailwind CSS

**Execution status:** Completed and locally verified on 2026-09-13. During implementation, the established `VALIDATION_ERROR` application code replaced the draft-only `INVALID_INPUT` name, and the approved compact calendar is paired with browsing history on desktop. Verification passed 136 frontend tests, 111 pgTAP assertions, TypeScript, ESLint, production build, and an empty-database migration replay.

---

### Task 1: Database persistence and authorization

**Files:**
- Create: `supabase/migrations/202609130001_create_daily_checkins.sql`
- Create: `supabase/tests/database/06_daily_checkins.test.sql`
- Modify: `src/types/database.ts`

- [ ] **Step 1: Write failing pgTAP tests**

Assert the table, composite primary key, auth-user foreign key, RLS, read ownership, denied direct writes, RPC authentication/date checks, and idempotent `checked` / `already_checked` results.

~~~sql
select has_table('public', 'daily_checkins', 'daily_checkins table exists');
select col_is_pk('public', 'daily_checkins', array['user_id', 'checkin_date'], 'user and date form the primary key');
select function_returns('public', 'check_in_today', array['date'], 'text', 'RPC returns a stable status');
~~~

- [ ] **Step 2: Run RED**

Run: `npm run db:test`

Expected: FAIL because the table and RPC do not exist. If local Supabase is stopped, start it before interpreting the result.

- [ ] **Step 3: Implement the migration**

~~~sql
create table public.daily_checkins (
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null,
  checked_at timestamptz not null default now(),
  primary key (user_id, checkin_date)
);

alter table public.daily_checkins enable row level security;
revoke all on table public.daily_checkins from anon, authenticated;
grant select on table public.daily_checkins to authenticated;

create policy daily_checkins_owner_read
on public.daily_checkins for select to authenticated
using (user_id = auth.uid());
~~~

Add `check_in_today(p_checkin_date date) returns text` as a `security definer` function with an empty search path. It must use `auth.uid()`, reject missing auth with `AUTH_REQUIRED`, reject dates outside `current_date ± 1` with `INVALID_CHECKIN_DATE`, insert with `on conflict do nothing`, and return `checked` or `already_checked`. Grant execute only to `authenticated`.

- [ ] **Step 4: Update TypeScript database types**

Add the `daily_checkins` Row/Insert/Update relationship shape and this function signature:

~~~ts
check_in_today: {
  Args: { p_checkin_date: string };
  Returns: string;
};
~~~

- [ ] **Step 5: Run GREEN**

Run: `npm run db:reset && npm run db:test`

Expected: all migrations apply and all pgTAP tests pass.

- [ ] **Step 6: Review checkpoint 1**

Show only the table, primary key, RLS boundary, RPC statuses, and pgTAP evidence. Continue only after user review.

- [ ] **Step 7: Commit**

~~~bash
git add supabase/migrations/202609130001_create_daily_checkins.sql supabase/tests/database/06_daily_checkins.test.sql src/types/database.ts
git commit -m "feat: add daily check-in persistence"
~~~

### Task 2: API boundary

**Files:**
- Create: `src/api/dailyCheckinApi.ts`
- Create: `src/api/dailyCheckinApi.test.ts`
- Modify: `src/api/apiError.ts`
- Modify: `src/api/apiError.test.ts`

- [ ] **Step 1: Write failing API tests**

Test these signatures, exact date filters, exact RPC arguments, stable result validation, and safe error mapping:

~~~ts
export type DailyCheckinResult = 'checked' | 'already_checked';
export async function fetchMonthlyCheckins(startDate: string, endDateExclusive: string): Promise<string[]>;
export async function checkInToday(localDate: string): Promise<DailyCheckinResult>;
~~~

- [ ] **Step 2: Run RED**

Run: `npm test -- src/api/dailyCheckinApi.test.ts src/api/apiError.test.ts`

Expected: FAIL because the daily check-in API does not exist.

- [ ] **Step 3: Implement minimal API**

Use the shared Supabase client and `toAppError`. Query only `checkin_date` with `gte(startDate)` and `lt(endDateExclusive)`. Accept only `checked` and `already_checked` RPC results. Map `INVALID_CHECKIN_DATE` to a safe non-retryable error.

- [ ] **Step 4: Run GREEN and commit**

Run: `npm test -- src/api/dailyCheckinApi.test.ts src/api/apiError.test.ts`

~~~bash
git add src/api/dailyCheckinApi.ts src/api/dailyCheckinApi.test.ts src/api/apiError.ts src/api/apiError.test.ts
git commit -m "feat: add daily check-in API"
~~~

### Task 3: Pure current-month calendar model

**Files:**
- Create: `src/service/dailyCheckinService.ts`
- Create: `src/service/dailyCheckinService.test.ts`

- [ ] **Step 1: Write failing tests**

Cover 31-day months, leap-year February, Sunday-first leading blanks, checked dates, today/future flags, and local date formatting without UTC conversion.

~~~ts
export type CheckinCalendarDay = {
  date: string;
  dayOfMonth: number;
  checked: boolean;
  today: boolean;
  future: boolean;
};
export function toLocalDateString(date: Date): string;
export function buildMonthlyCheckinCalendar(now: Date, checkedDates: string[]): MonthlyCheckinCalendarModel;
~~~

- [ ] **Step 2: Run RED**

Run: `npm test -- src/service/dailyCheckinService.test.ts`

Expected: FAIL because the service does not exist.

- [ ] **Step 3: Implement pure helpers**

Use local `new Date(year, monthIndex, day)`, format local components directly, use a `Set<string>` for checked lookup, and return `startDate`, `endDateExclusive`, `leadingBlankCount`, and day models. Do not mutate inputs or read global time inside the builder.

- [ ] **Step 4: Run GREEN and commit**

Run: `npm test -- src/service/dailyCheckinService.test.ts`

~~~bash
git add src/service/dailyCheckinService.ts src/service/dailyCheckinService.test.ts
git commit -m "feat: build monthly check-in calendar model"
~~~

### Task 4: Shared application hook

**Files:**
- Create: `src/hooks/useDailyCheckin.ts`
- Create: `src/hooks/useDailyCheckin.test.tsx`
- Modify: `src/observability/errorReporter.ts`

- [ ] **Step 1: Write failing hook tests**

Cover anonymous idle state, authenticated loading, both success statuses, repeated-submit suppression, retry after failure, and reset on user change.

~~~ts
export type DailyCheckinState = {
  calendar: MonthlyCheckinCalendarModel;
  loading: boolean;
  submitting: boolean;
  checkedToday: boolean;
  error: unknown;
  checkIn: () => Promise<void>;
  retry: () => Promise<void>;
};
~~~

- [ ] **Step 2: Run RED**

Run: `npm test -- src/hooks/useDailyCheckin.test.tsx`

Expected: FAIL because the hook does not exist.

- [ ] **Step 3: Implement the hook**

Accept auth/user identity and injectable API dependencies. Generate one local date snapshot per load/submit, merge today into state for both RPC success statuses, suppress concurrent submits, and report `daily_checkins_fetch_failed` or `daily_checkin_create_failed` only for actual failures.

- [ ] **Step 4: Run GREEN and commit**

Run: `npm test -- src/hooks/useDailyCheckin.test.tsx src/observability/errorReporter.test.ts`

~~~bash
git add src/hooks/useDailyCheckin.ts src/hooks/useDailyCheckin.test.tsx src/observability/errorReporter.ts
git commit -m "feat: coordinate shared daily check-in state"
~~~

### Task 5: Floating check-in UI

**Files:**
- Create: `src/components/DailyCheckinButton.tsx`
- Create: `src/components/DailyCheckinButton.test.tsx`
- Modify: `src/components/FeedbackFab.tsx`
- Create: `src/components/FeedbackFab.test.tsx`

- [ ] **Step 1: Write failing component tests**

Test idle/submitting/checked labels and disabled states. Verify anonymous floating clicks invoke `onLoginRequired`, authenticated clicks invoke `onCheckIn`, and checked clicks do not submit or open the old development modal.

- [ ] **Step 2: Run RED**

Run: `npm test -- src/components/DailyCheckinButton.test.tsx src/components/FeedbackFab.test.tsx`

Expected: FAIL because the reusable component and props do not exist.

- [ ] **Step 3: Implement minimal components**

Create a presentational button accepting `checked`, `submitting`, `compact`, `darkMode`, `t`, and `onClick`. Modify `FeedbackFab` to accept authentication and shared check-in props. Remove the old check-in development-modal state/markup while preserving the feedback survey.

- [ ] **Step 4: Run GREEN and commit**

Run: `npm test -- src/components/DailyCheckinButton.test.tsx src/components/FeedbackFab.test.tsx`

~~~bash
git add src/components/DailyCheckinButton.tsx src/components/DailyCheckinButton.test.tsx src/components/FeedbackFab.tsx src/components/FeedbackFab.test.tsx
git commit -m "feat: enable floating daily check-in"
~~~

### Task 6: My Space calendar and shared integration

**Files:**
- Create: `src/components/MonthlyCheckinCalendar.tsx`
- Create: `src/components/MonthlyCheckinCalendar.test.tsx`
- Modify: `src/pages/SpacePage.tsx`
- Modify: `src/pages/SpacePage.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/data/translations.ts`

- [ ] **Step 1: Write failing UI tests**

Assert weekday/date rendering, checked icons and accessible labels, future-day state, Space check-in action, independent calendar retry, and that App passes one hook state/action to both entry points.

- [ ] **Step 2: Run RED**

Run: `npm test -- src/components/MonthlyCheckinCalendar.test.tsx src/pages/SpacePage.test.tsx src/App.test.tsx`

Expected: FAIL because the calendar/integration props do not exist.

- [ ] **Step 3: Implement calendar and integrate one hook**

Render a Sunday-first grid with accessible date labels, leading blanks, a today border, and check icons. Put the Space button beside the title on desktop and below it on mobile. Instantiate `useDailyCheckin(Boolean(user), user?.id)` once in App and pass it to both `FeedbackFab` and `SpacePage`. Add Chinese/Japanese translations.

- [ ] **Step 4: Run GREEN**

Run: `npm test -- src/components/MonthlyCheckinCalendar.test.tsx src/pages/SpacePage.test.tsx src/App.test.tsx`

Expected: PASS.

- [ ] **Step 5: Review checkpoint 2**

Show the floating states, calendar placement, responsive behavior, and focused tests. Continue after user review.

- [ ] **Step 6: Commit**

~~~bash
git add src/components/MonthlyCheckinCalendar.tsx src/components/MonthlyCheckinCalendar.test.tsx src/pages/SpacePage.tsx src/pages/SpacePage.test.tsx src/App.tsx src/App.test.tsx src/data/translations.ts
git commit -m "feat: show monthly check-ins in space"
~~~

### Task 7: Documentation and full verification

**Files:**
- Modify: `docs/2026-09-01-resource-space-database-api-design.md`
- Modify: `docs/superpowers/plans/2026-09-13-daily-learning-checkin.md`

- [ ] **Step 1: Align the main design document**

Document `daily_checkins`, the RPC, RLS, responsibility boundary, logs, and current-month query. Do not reintroduce resource-level check-ins or annual heatmaps.

- [ ] **Step 2: Run full verification sequentially**

~~~bash
npm test
npm run typecheck
npm run lint
npm run build
npm run db:test
git diff --check
~~~

Expected: every command exits 0. If local Supabase is unavailable, report the database verification as blocked.

- [ ] **Step 3: Verify empty-database migration**

Run: `npm run db:reset && npm run db:test`

Expected: all migrations and database tests pass. Confirm no remote Supabase command was run.

- [ ] **Step 4: Commit documentation**

~~~bash
git add docs/2026-09-01-resource-space-database-api-design.md docs/superpowers/plans/2026-09-13-daily-learning-checkin.md
git commit -m "docs: document daily learning check-ins"
~~~

- [ ] **Step 5: Finish branch**

Use `superpowers:finishing-a-development-branch`. Do not push, merge, or modify remote Supabase without explicit user direction.
