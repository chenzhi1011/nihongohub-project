# Resource Space Review 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create and locally verify the resource schema, constraints, URL normalization, query-driven indexes, and seed data without connecting the frontend or any remote Supabase project.

**Architecture:** A unique resource lives once in `resources`; `resource_categories` is a junction table that places one resource in one or more enum-backed themes. PostgreSQL constraints own structural validity, triggers own canonical derived values, and migrations remain reproducible through the project-scoped Supabase CLI.

**Tech Stack:** PostgreSQL, Supabase CLI, pgTAP, Docker-compatible local runtime, SQL migrations

---

### Task 1: Align the approved design with multi-category resources

**Files:**
- Modify: `docs/2026-09-01-resource-space-database-api-design.md`

- [x] Remove `category` and `sort_order` from `resources`.
- [x] Add `resource_categories(resource_id, category, sort_order)` with a composite primary key and cascade delete.
- [x] Document that public resources may have multiple placements, while private-resource RPCs will permit exactly one placement in the first release.
- [x] Update indexes, API mapping notes, deletion behavior, migration responsibilities, tests, and seed reconciliation counts.

### Task 2: Add reproducible local Supabase tooling

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `supabase/config.toml` through `npx supabase init`

- [x] Query the current stable CLI version and install it as an exact development dependency.
- [x] Initialize `supabase/` locally without linking a remote project.
- [x] Add `db:start`, `db:stop`, `db:reset`, and `db:test` scripts.
- [x] Verify the Docker-compatible runtime is available; start the local application if it is installed but stopped.

### Task 3: Write failing schema tests

**Files:**
- Create: `supabase/tests/database/resource_schema.test.sql`

- [x] Assert the enum values, four tables, primary keys, foreign keys, cascade actions, required columns, and check constraints.
- [x] Assert one resource can have two category placements but cannot repeat the same category.
- [x] Assert invalid names, descriptions, URLs, tags, and negative sort order are rejected.
- [x] Verify the suite detects an incomplete database: the first run failed until seed data was applied.

### Task 4: Implement the resource schema

**Files:**
- Create: `supabase/migrations/202609060001_create_resource_schema.sql`

- [x] Create `resource_category` with the nine approved enum values.
- [x] Create `resources`, `resource_categories`, `resource_marks`, and `resource_history`.
- [x] Add identity keys, composite keys, `ON DELETE CASCADE`, field length checks, tag checks, timestamp defaults, and non-negative sort order.
- [x] Keep RLS and RPC definitions out of this batch.

### Task 5: Write failing trigger and index tests, then implement them

**Files:**
- Create: `supabase/tests/database/03_resource_behavior.test.sql`
- Included in: `supabase/migrations/202609060001_create_resource_schema.sql`

- [x] Write tests requiring URL trimming/normalization and automatic `updated_at` changes.
- [x] Write catalog, private-resource, similarity, history, and exact-URL index assertions.
- [x] Implement deterministic HTTP(S) URL cleaning, derived `normalized_url`, and `updated_at` triggers.
- [x] Implement only indexes justified by the approved queries.
- [x] Reset the local database and verify all pgTAP files pass.

### Task 6: Import canonical public seed data

**Files:**
- Modify: `src/data/categories.ts`
- Create: `supabase/seed.sql`
- Create: `supabase/tests/database/resource_seed.test.sql`

- [x] Correct three visibly concatenated source URLs using their verified official destinations.
- [x] Collapse repeated public URLs into one `resources` row while preserving all 43 category placements.
- [x] Give each category placement its original zero-based display order.
- [x] Test that seed data contains 37 unique public resources, 43 placements, no private resources, and the expected multi-category examples.
- [x] Reset and test the local database from scratch.

### Task 7: Verify and checkpoint Review 2

**Files:**
- Modify: `docs/superpowers/plans/2026-09-06-resource-space-review-2.md`

- [x] Run `npm test`.
- [x] Run `npm run lint`.
- [x] Run `npm run build`.
- [x] Run `npm run db:test`.
- [x] Run `git diff --check` and verify no remote project is linked.
- [x] Mark completed steps, commit Review 2, and stop before RLS/RPC work.
