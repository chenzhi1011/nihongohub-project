# Resource Space Review 3 RLS and RPC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Protect all resource tables with RLS and expose only the catalog, Mark, history, similarity, and private-resource operations approved by the design.

**Architecture:** Tables are denied by default. Authenticated users receive narrowly scoped reads and own-resource deletion; all compound writes run through `SECURITY DEFINER` RPCs that derive identity from `auth.uid()`, fix `search_path`, acquire a per-user transaction lock where limits matter, and return stable JSON statuses for expected business outcomes.

**Tech Stack:** PostgreSQL 17, Supabase Auth/RLS, Postgres RPC, pgTAP, Supabase CLI

---

### Task 1: Prove table isolation fails before RLS exists

**Files:**
- Create: `supabase/tests/database/04_resource_rls.test.sql`

- [x] Create two Auth users plus public, A-private, and B-private fixtures as database owner.
- [x] Assert anonymous direct reads reveal no resources or theme placements.
- [x] Assert authenticated A reads public and A-private rows but never B-private rows.
- [x] Assert A cannot directly insert or update resources and cannot read B's Mark/history.
- [x] Run `npm run db:test` and observe failures caused by missing RLS/grants.

### Task 2: Implement least-privilege table access

**Files:**
- Create: `supabase/migrations/202609070001_create_resource_rls.sql`

- [x] Enable RLS on all four resource tables and the theme placement table.
- [x] Revoke default table access, then grant authenticated users only approved SELECT and own-resource DELETE privileges.
- [x] Add policies for public-or-own resource reads, own private deletion, visible placements, own Mark, and own visible history.
- [x] Keep anonymous table access disabled and rely on the preview RPC.
- [x] Run the RLS test and observe it pass.

### Task 3: Specify and implement catalog, Mark, and history RPCs

**Files:**
- Create: `supabase/tests/database/05_resource_core_rpc.test.sql`
- Create: `supabase/migrations/202609070002_create_resource_core_rpc.sql`

- [x] Write tests for six-item anonymous previews, complete authenticated public catalogs, and hidden locked-resource fields.
- [x] Write tests proving Mark accepts only public resources and always uses `auth.uid()`.
- [x] Write tests proving history accepts public/own-private resources, rejects another user's private resource, and atomically increments one row.
- [x] Run tests and observe missing-function failures.
- [x] Implement `get_catalog_snapshot`, `set_resource_mark`, and `record_resource_visit` with fixed `search_path` and explicit grants.
- [x] Run tests and observe them pass.

### Task 4: Specify and implement private-resource RPCs

**Files:**
- Create: `supabase/tests/database/06_private_resource_rpc.test.sql`
- Create: `supabase/migrations/202609070003_create_private_resource_rpc.sql`

- [x] Test similarity search scope: public plus current user's private resources, never another user's private resources.
- [x] Test exact duplicates, similar-review confirmation, one-theme placement, ownership, and updates excluding the current row.
- [x] Test the 200-total and 30-same-source private limits independently; public resources never count toward 30.
- [x] Run tests and observe missing-function failures.
- [x] Implement limit functions, similarity search, create, and update RPCs with per-user advisory transaction locks.
- [x] Return stable JSON `status` values for expected outcomes and raise only authentication/authorization or unexpected errors.
- [x] Run tests and observe them pass.
- [x] Run the separate concurrent-session test and prove simultaneous writes stop exactly at 200 and 30.

### Task 5: Security lint, documentation, and checkpoint

**Files:**
- Modify: `docs/2026-09-01-resource-space-database-api-design.md`
- Modify: `docs/superpowers/plans/2026-09-06-resource-space-review-3.md`

- [x] Document concrete RPC names, parameters, result statuses, and the service-role-only administrator boundary.
- [x] Verify every `SECURITY DEFINER` function fixes `search_path`, revokes `PUBLIC`, and grants only required roles.
- [x] Run a clean `npm run db:reset` followed by database tests and database lint.
- [x] Run frontend tests, ESLint, build, production dependency audit, and `git diff --check`.
- [x] Confirm no remote Supabase project is linked, commit Review 3, and stop before frontend API integration.
