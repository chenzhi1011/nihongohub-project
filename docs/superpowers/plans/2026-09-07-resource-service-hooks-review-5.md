# Resource Service and Hooks Review 5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Compose the typed APIs into catalog/Space business models and expose small React hooks with explicit loading, error, retry, and mutation refresh behavior.

**Architecture:** API remains responsible for Supabase calls and row mapping. Pure services combine authorized catalog, private resources, Mark state, and history. Hooks own request lifecycle and stale-response protection using React state; no query-cache dependency is added until multiple pages demonstrably need shared caching.

**Tech Stack:** React 18 hooks, TypeScript, Vitest, React Testing Library

---

### Task 1: Complete the private-resource read API

**Files:**
- Modify: `src/api/resourceApi.ts`
- Modify: `src/api/resourceApi.test.ts`
- Modify: `src/api/resourceMappers.ts`
- Modify: `src/api/resourceMappers.test.ts`

- [x] Write failing tests for mapping and reading only the current user's private resources with theme placement.
- [x] Implement `fetchPrivateResources()` through RLS-protected tables without a user ID parameter.
- [x] Reject malformed nested relation data at the API boundary.
- [x] Run focused tests until green.

### Task 2: Build pure Space composition

**Files:**
- Create: `src/service/spaceService.ts`
- Create: `src/service/spaceService.test.ts`
- Modify: `src/types/resource.ts`

- [x] Write failing tests for history-first output, marked public resources, private resources, theme order, stable sorting, and empty-theme removal.
- [x] Implement `buildSpaceSnapshot` as a pure function with no Supabase or React imports.
- [x] Preserve a canonical resource's shared Mark state while allowing its multiple theme placements.
- [x] Run focused tests until green.

### Task 3: Build catalog and Space query hooks

**Files:**
- Create: `src/hooks/useCatalog.ts`
- Create: `src/hooks/useCatalog.test.tsx`
- Create: `src/hooks/useSpace.ts`
- Create: `src/hooks/useSpace.test.tsx`

- [x] Write failing hook tests for loading, success, visible errors, retry, logout clearing, and stale request suppression.
- [x] Implement React-native request lifecycle hooks with injectable API dependencies for deterministic tests.
- [x] Fetch catalog/private/history in parallel for Space and compose them through the service.
- [x] Do not convert request failure into an empty Space.

### Task 4: Build mutation orchestration hook

**Files:**
- Create: `src/hooks/useResourceActions.ts`
- Create: `src/hooks/useResourceActions.test.tsx`

- [x] Write failing tests for optimistic Mark rollback, non-blocking history failure, mutation result passthrough, and refresh after successful private mutation.
- [x] Implement actions without accepting or forwarding a user ID.
- [x] Report mutation errors through hook state while keeping expected business statuses as values.
- [x] Run focused tests until green.

### Task 5: Remove obsolete data access and verify

**Files:**
- Delete: `src/api/userDataApi.ts`
- Modify: `src/hooks/useHubApp.ts`
- Modify: `docs/2026-09-01-resource-space-database-api-design.md`

- [x] Remove `user_resources`/`checkins` database calls and the old local user-resource persistence path from the active hook.
- [x] Keep the current visual catalog static until Review 6 wires the new hooks into pages; the existing add button remains a development notice, so no save behavior is lost.
- [x] Document the React-native hook choice, accepted duplicate-fetch downside, and TanStack Query revisit condition.
- [x] Run tests, ESLint, `tsc -b`, build, database tests, production dependency audit, and `git diff --check`.
- [x] Commit Review 5 and stop before page/Space UI integration.
