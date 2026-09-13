# Resource Space Review 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a reliable test baseline, remove the two existing lint failures, and add stable application error and observability contracts without changing visible behavior.

**Architecture:** Vitest runs pure TypeScript tests and jsdom component tests. Existing loose database rows receive an explicit temporary type. New domain types live outside UI components, while observability is represented by a provider-neutral reporter so Sentry can be connected in the final observability batch.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, React Testing Library, ESLint

---

### Task 1: Install and configure the test runner

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `vite.config.ts`
- Create: `src/test/setup.ts`

- [x] Install `vitest`, `jsdom`, React Testing Library, jest-dom, and user-event as development dependencies.
- [x] Add `test` and `test:watch` scripts.
- [x] Configure Vitest with jsdom, globals, setup file, and CSS support.
- [x] Add jest-dom matchers in `src/test/setup.ts`.
- [x] Run `npm test` and verify Vitest starts correctly; before test files exist, its expected result is `No test files found` with exit code 1.

### Task 2: Protect existing catalog behavior

**Files:**
- Create: `src/service/catalogService.test.ts`

- [x] Write tests for blank search, case-insensitive name/description/tag search, category label mapping, known/unknown route resolution, and missing translation fallback.
- [x] Run the test file and confirm it passes against existing behavior.
- [x] Keep production catalog behavior unchanged.

### Task 3: Protect the existing resource link contract

**Files:**
- Create: `src/components/ResourceCard.test.tsx`

- [x] Render a resource card and assert its name, description, tags, destination URL, `_blank` target, and `noopener noreferrer` relationship.
- [x] Run the component test and confirm the current component satisfies the contract.

### Task 4: Reproduce and fix the baseline lint failures

**Files:**
- Modify: `src/api/userDataApi.ts`
- Modify: `src/hooks/useSupabaseAuth.ts`

- [x] Run ESLint on both files and preserve the two expected failures as baseline evidence.
- [x] Replace the database row `any` with a narrow `UserResourceRow` type whose properties remain `unknown` at the mapping boundary.
- [x] Remove the unused first WeChat catch binding without changing behavior.
- [x] Run full lint and verify zero errors.

### Task 5: Add stable domain and error contracts using TDD

**Files:**
- Create: `src/types/resource.ts`
- Create: `src/errors/appError.ts`
- Create: `src/errors/appError.test.ts`

- [x] Write failing tests that require a stable error code, operation ID, retryable flag, and preservation of the original cause.
- [x] Run the error test and verify it fails because `AppError` does not exist.
- [x] Add resource/category domain types matching the approved design.
- [x] Implement the smallest `AppError` class and `createOperationId()` helper that satisfy the tests.
- [x] Run the error tests and verify they pass.

### Task 6: Add a provider-neutral error reporter using TDD

**Files:**
- Create: `src/observability/errorReporter.ts`
- Create: `src/observability/errorReporter.test.ts`

- [x] Write failing tests proving a configured reporter receives one sanitized event and that reporting failures never escape into the business flow.
- [x] Run the test and verify it fails because the reporter does not exist.
- [x] Implement `configureErrorReporter()` and `reportError()` without adding the Sentry SDK yet.
- [x] Run the reporter tests and verify they pass.

### Task 7: Verify and checkpoint Review 1

**Files:**
- Modify: `docs/superpowers/plans/2026-09-06-resource-space-review-1.md`

- [x] Run `npm test -- --run`.
- [x] Run `npm run lint`.
- [x] Run `npm run build`.
- [x] Run `git diff --check`.
- [x] Mark completed checklist items and commit Review 1 changes.
- [x] Stop for user review before any database schema work.

## Verification note

- Production dependency audit: `npm audit --omit=dev` reports 0 vulnerabilities.
- Full development audit retains 6 advisories in the existing Vite 5 / ESLint toolchain. Removing the remaining Vite/esbuild advisory requires a breaking Vite upgrade, so it is not hidden inside this feature batch. Vitest was upgraded from the initially selected vulnerable 2.x release to 3.2.6.
- Validation commands must run sequentially: running ESLint and Vite build concurrently can make ESLint observe Vite's short-lived timestamp config file after it has been deleted.
