# Resource API Review 4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add a typed frontend API boundary for the locally verified resource database without changing page behavior or connecting a remote Supabase project.

**Architecture:** Supabase-generated types describe transport rows and RPC arguments; application types remain small UI-facing contracts. `src/api/` owns client calls, null/error checks, row mapping, and stable `AppError` conversion. Existing static catalog exports stay temporarily so UI migration remains a separate reversible review.

**Tech Stack:** TypeScript, Supabase JS, generated PostgreSQL types, Vitest

---

### Task 1: Generate and wire database types

**Files:**
- Create: `src/types/database.ts`
- Modify: `src/api/supabaseClient.ts`

- [x] Start the local Supabase database and generate TypeScript types from the applied schema.
- [x] Parameterize `SupabaseClient` with `Database` and keep the unconfigured-client behavior explicit.
- [x] Add `db:types` script using the project-local CLI.
- [x] Verify `tsc`/build accepts the generated types.

### Task 2: Test and implement transport mapping and error conversion

**Files:**
- Create: `src/api/resourceMappers.test.ts`
- Create: `src/api/resourceMappers.ts`
- Create: `src/api/apiError.test.ts`
- Create: `src/api/apiError.ts`
- Modify: `src/types/resource.ts`

- [x] Write failing tests for catalog rows, multi-theme IDs, similarity rows, history rows, and malformed payloads.
- [x] Write failing tests mapping stable database errors and unexpected/network failures to `AppError`.
- [x] Implement narrow runtime guards and transport-to-application mapping.
- [x] Add missing `CategoryCatalog`, `HistoryItem`, `invalid_input`, and `similar_review_required` application types.
- [x] Run focused tests until green.

### Task 3: Test and implement catalog API

**Files:**
- Create: `src/api/resourceCatalogApi.test.ts`
- Create: `src/api/resourceCatalogApi.ts`
- Preserve: `src/api/catalogApi.ts`

- [x] Write failing tests for RPC argument shape, category grouping, counts, and Supabase errors.
- [x] Implement `fetchCatalog` through `get_catalog_snapshot` without accepting a user ID.
- [x] Implement visible-result search as a pure filter over the already authorized catalog response; private Space search remains a service concern.
- [x] Verify the legacy static API remains unchanged.

### Task 4: Test and implement resource mutation API

**Files:**
- Create: `src/api/resourceApi.test.ts`
- Create: `src/api/resourceApi.ts`

- [x] Write failing tests for Mark/history RPC parameter names and error conversion.
- [x] Write failing tests for similarity, create, update, limit statuses, and owner-safe deletion.
- [x] Implement wrappers that never accept `userId`/`ownerId` and never expose raw Supabase errors.
- [x] Map database JSON statuses into discriminated TypeScript unions and reject malformed responses.
- [x] Run focused and full frontend tests.

### Task 5: Verify and checkpoint

**Files:**
- Modify: `docs/superpowers/plans/2026-09-07-resource-api-review-4.md`

- [x] Run database type generation twice and confirm no diff.
- [x] Run frontend tests, ESLint, build, database tests, and `git diff --check`.
- [x] Run the production dependency audit and confirm no remote project ref exists.
- [x] Commit Review 4 and stop before hooks/service/page integration.
