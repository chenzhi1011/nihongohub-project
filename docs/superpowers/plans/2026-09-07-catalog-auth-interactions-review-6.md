# Catalog, Auth, and Resource Interactions — Review 6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static resource catalog with the authorized Supabase catalog and provide working login, guest-lock, Mark, and visit-history interactions without yet introducing the Space page or private-resource form.

**Architecture:** `App` owns authentication and composes existing hooks. Pages receive display-ready catalog data and callbacks; they do not import Supabase. `ResourceCard` renders a star only for public resources when authenticated and records a visit without delaying the external navigation. Guest lock cards use the server-returned `lockedCount`, so the browser never needs the hidden rows.

**Tech Stack:** React 18, TypeScript, React Testing Library/Vitest, Tailwind CSS, Supabase Auth/Postgres through existing `src/api/` and hooks.

---

## File structure

- Create `src/components/AuthDialog.tsx`: Google login dialog and authentication error state.
- Create `src/components/LockedResourcesCard.tsx`: guest-only count and login prompt.
- Modify `src/components/Header.tsx`: expose login and Space navigation callbacks instead of the development modal.
- Modify `src/components/ResourceCard.tsx`: consume `ResourceRecord`, render Mark state, and report visits.
- Modify `src/pages/CategoryPage.tsx`: render a `CategoryCatalog`, its locked count, and interaction callbacks.
- Modify `src/pages/SearchResults.tsx`: render authorized `ResourceRecord` search results.
- Modify `src/hooks/useHubApp.ts`: keep only presentation preferences/navigation and search the authorized catalog supplied by `App`.
- Modify `src/App.tsx`: compose auth, catalog, resource actions, dialog state, loading, and retry UI.
- Delete `src/api/catalogApi.ts` after all runtime callers use `resourceCatalogApi.ts`.
- Update `docs/2026-09-01-resource-space-database-api-design.md`: record the completed static-catalog removal boundary.

### Task 1: Authentication dialog and header contract

**Files:**
- Create: `src/components/AuthDialog.tsx`
- Create: `src/components/AuthDialog.test.tsx`
- Modify: `src/components/Header.tsx`
- Create: `src/components/Header.test.tsx`
- Modify: `src/App.tsx`

- [x] **Step 1: Write failing component tests**

Cover these observable behaviors:

```tsx
it('starts Google login and disables the action while it is pending');
it('shows the supplied authentication error without exposing raw database details');
it('asks the parent to open login for a guest');
it('shows Space and logout actions for an authenticated user');
```

Use callbacks as spies. Do not mock or import the Supabase client.

- [x] **Step 2: Run tests and verify RED**

Run: `npm test -- src/components/AuthDialog.test.tsx src/components/Header.test.tsx`

Expected: FAIL because `AuthDialog` and the new `Header` callback contract do not exist.

- [x] **Step 3: Implement the minimal UI contract**

`AuthDialog` accepts:

```ts
type AuthDialogProps = {
  open: boolean;
  darkMode: boolean;
  error: string | null;
  t: (key: string) => string;
  onClose: () => void;
  onGoogleLogin: () => Promise<void>;
};
```

It owns only pending state. `Header` accepts `onOpenLogin` and `onOpenSpace`; guests get Login, authenticated users get Space plus Logout. Preserve keyboard Escape and accessible dialog labels.
`App` owns the dialog's open state and supplies the existing auth hook's Google login callback and safe error message.

- [x] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- src/components/AuthDialog.test.tsx src/components/Header.test.tsx`

Expected: all focused tests PASS with no console warnings.

### Task 2: Authorized catalog presentation

**Files:**
- Create: `src/components/LockedResourcesCard.tsx`
- Create: `src/components/LockedResourcesCard.test.tsx`
- Modify: `src/pages/CategoryPage.tsx`
- Create: `src/pages/CategoryPage.test.tsx`
- Modify: `src/pages/SearchResults.tsx`
- Modify: `src/hooks/useHubApp.ts`
- Create: `src/hooks/useHubApp.test.tsx`

- [ ] **Step 1: Write failing catalog UI tests**

Cover:

```tsx
it('renders only resources returned by CategoryCatalog');
it('shows one guest lock card with the server supplied locked count');
it('does not show a lock card when lockedCount is zero');
it('searches only the catalog supplied to useHubApp');
```

The lock card calls `onLoginRequired`; it must not synthesize or reveal hidden resource names.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- src/components/LockedResourcesCard.test.tsx src/pages/CategoryPage.test.tsx src/hooks/useHubApp.test.tsx`

Expected: FAIL because pages still consume the static `Category` model.

- [ ] **Step 3: Implement the authorized catalog adapter**

Pass `CategoryCatalog[]` into `useHubApp(catalog)` and use `searchVisibleCatalog`. Map category metadata (icon and translated name) from the existing static category configuration, but never read its `resources`. `CategoryPage` accepts one `CategoryCatalog`; it renders exactly `resources` plus an optional `LockedResourcesCard`.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- src/components/LockedResourcesCard.test.tsx src/pages/CategoryPage.test.tsx src/hooks/useHubApp.test.tsx`

Expected: all focused tests PASS.

### Task 3: Public Mark and non-blocking visit behavior

**Files:**
- Modify: `src/components/ResourceCard.tsx`
- Modify: `src/components/ResourceCard.test.tsx`
- Modify: `src/pages/CategoryPage.tsx`
- Modify: `src/pages/SearchResults.tsx`

- [ ] **Step 1: Write failing interaction tests**

Cover:

```tsx
it('shows a pressed star for a marked public resource when authenticated');
it('never shows a star for a private resource');
it('asks for login when a guest attempts to Mark');
it('calls onVisit without preventing an HTTP(S) link from opening');
```

Assert `aria-pressed` and accessible labels rather than icon SVG structure.

- [ ] **Step 2: Run test and verify RED**

Run: `npm test -- src/components/ResourceCard.test.tsx`

Expected: FAIL because the current card has no Mark or visit callbacks.

- [ ] **Step 3: Implement minimal resource interactions**

Use this component contract:

```ts
type ResourceCardProps = {
  resource: ResourceRecord & { categoryName?: string };
  authenticated: boolean;
  marked: boolean;
  onToggleMark: (resourceId: number, marked: boolean) => void;
  onLoginRequired: () => void;
  onVisit: (resourceId: number) => void;
  darkMode: boolean;
  t: (key: string) => string;
  variant: 'search' | 'category';
  showCategoryLine?: boolean;
};
```

The star is available only when `resource.source === 'public'`. For guests, clicking the unfilled star opens login and does not call the Mark mutation. The external anchor remains a native `_blank` link with `noopener noreferrer`; its click handler only schedules `onVisit` for authenticated users.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- src/components/ResourceCard.test.tsx src/pages/CategoryPage.test.tsx`

Expected: all focused tests PASS.

### Task 4: App composition, loading, error, and retry

**Files:**
- Create: `src/App.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/hooks/useResourceActions.ts`
- Modify: `src/hooks/useResourceActions.test.tsx`

- [ ] **Step 1: Write failing integration tests**

Cover:

```tsx
it('shows catalog loading before rendering pages');
it('shows catalog failure with a retry action instead of an empty catalog');
it('opens authentication from the header and guest lock');
it('uses the optimistic mark override while the mutation is pending');
it('records visits only for authenticated users');
```

Mock hooks at their module boundaries, not Supabase query chains.

- [ ] **Step 2: Run test and verify RED**

Run: `npm test -- src/App.test.tsx src/hooks/useResourceActions.test.tsx`

Expected: FAIL because `App` still uses static catalog data and the action hook does not expose pending Mark IDs.

- [ ] **Step 3: Compose existing hooks**

Call `useCatalog()` and `useResourceActions()` in `App`. Add `markPendingIds` to the action hook so repeated clicks for the same resource are disabled until the mutation settles. Render explicit loading and retry states. Send handled errors to the existing `errorReporter` once from the hook; UI displays stable, user-facing text and a shortened diagnostic ID only when available.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- src/App.test.tsx src/hooks/useResourceActions.test.tsx`

Expected: all focused tests PASS.

### Task 5: Remove the static resource data path and verify the batch

**Files:**
- Delete: `src/api/catalogApi.ts`
- Modify: `src/service/catalogService.ts`
- Modify: `src/service/catalogService.test.ts`
- Modify: `docs/2026-09-01-resource-space-database-api-design.md`

- [ ] **Step 1: Prove no runtime caller needs static resources**

Run: `rg "catalogApi|category\.resources|fetchCategories" src`

Expected: only obsolete imports/tests remain; no page or hook depends on the old resource arrays.

- [ ] **Step 2: Remove the obsolete API and narrow catalog service**

Keep category visual metadata and translations in `src/data/`. Remove synchronous resource retrieval/search helpers that consume static resources. Update the design document to state that Review 6 completed the static catalog cutover; do not delete the data arrays in this batch if HomePage still needs category metadata.

- [ ] **Step 3: Run complete verification**

Run sequentially:

```bash
npm test
npm run typecheck
npm run lint
npm run build
git diff --check
```

Expected: all commands exit 0. Run lint and build sequentially because Vite creates a short-lived timestamp file that ESLint can otherwise race with.

- [ ] **Step 4: Commit the review batch**

```bash
git add docs src
git commit -m "feat: connect authorized resource catalog"
```

Stop at Review 6 for user review. Space rendering and private-resource forms are Review 7.
