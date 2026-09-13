# Personal Space Page — Review 7 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the authenticated `/space` page with a single horizontal recent-history rail and vertically ordered, non-paginated theme sections containing marked public resources and private resources.

**Architecture:** `App` composes `useSpace` with the existing auth and resource-action hooks. `SpacePage` receives a display-ready `SpaceSnapshot`; it never queries Supabase. Public Mark removal uses the existing optimistic override and refreshes both catalog and Space, while private resources render without Mark controls. Direct anonymous access to `/space` renders a login prompt without requesting personal data.

**Tech Stack:** React 18, TypeScript, React Router location/navigation, React Testing Library/Vitest, Tailwind CSS, existing Supabase API/service/hooks.

---

## File structure

- Create `src/pages/SpacePage.tsx`: Space loading, error, empty, history, and theme-section composition.
- Create `src/components/HistoryRail.tsx`: compact one-line horizontally scrollable recent-history cards.
- Modify `src/hooks/useHubApp.ts`: recognize `/space` as a real application route.
- Modify `src/App.tsx`: compose `useSpace`, route guards, shared refresh, and optimistic Mark state.
- Modify `src/data/translations.ts`: Space loading/error/empty/history labels.
- Update `docs/2026-09-01-resource-space-database-api-design.md`: record the implemented UI boundary.

### Task 1: Space route and guarded page states

**Files:**
- Modify: `src/service/catalogService.ts`
- Modify: `src/service/catalogService.test.ts`
- Modify: `src/hooks/useHubApp.test.tsx`
- Create: `src/pages/SpacePage.tsx`
- Create: `src/pages/SpacePage.test.tsx`

- [x] **Step 1: Write failing route and state tests**

Cover:

```tsx
it('resolves /space without treating it as a resource category');
it('shows a login action for direct anonymous access');
it('shows loading while personal data is loading');
it('shows an explicit failure and retry action instead of an empty Space');
it('shows a genuine empty state only after a successful empty snapshot');
```

- [x] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/service/catalogService.test.ts src/hooks/useHubApp.test.tsx src/pages/SpacePage.test.tsx`

Expected: FAIL because `/space` currently falls back to home and `SpacePage` does not exist.

- [x] **Step 3: Implement the minimal route and state contract**

`resolveActiveCategoryId` returns `'space'` for the exact `/space` pathname. `SpacePage` accepts:

```ts
type SpacePageProps = {
  authenticated: boolean;
  loading: boolean;
  error: unknown;
  data: SpaceSnapshot | null;
  darkMode: boolean;
  t: (key: string) => string;
  onLoginRequired: () => void;
  onRetry: () => void;
  resolveMarked: (resourceId: number, serverMarked: boolean) => boolean;
  markPendingIds: number[];
  onToggleMark: (resourceId: number, marked: boolean) => void;
  onVisit: (resourceId: number) => void;
};
```

Anonymous state takes precedence over personal loading/error. Do not invoke `useSpace` inside the page.

- [x] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- src/service/catalogService.test.ts src/hooks/useHubApp.test.tsx src/pages/SpacePage.test.tsx`

Expected: focused tests PASS without warnings.

### Task 2: Compact history rail and vertical theme sections

**Files:**
- Create: `src/components/HistoryRail.tsx`
- Create: `src/components/HistoryRail.test.tsx`
- Modify: `src/pages/SpacePage.tsx`
- Modify: `src/pages/SpacePage.test.tsx`

- [x] **Step 1: Write failing presentation tests**

Cover:

```tsx
it('renders history in one horizontally scrollable rail in API order');
it('keeps native external navigation and records another visit');
it('renders non-empty theme sections in snapshot order on one page');
it('hides an optimistically unmarked public resource immediately');
it('renders private resources without a Mark button');
```

Use semantic headings and links; do not assert Tailwind class strings except the rail's overflow behavior.

- [x] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/components/HistoryRail.test.tsx src/pages/SpacePage.test.tsx`

Expected: FAIL because history and theme content are not yet rendered.

- [x] **Step 3: Implement the presentation components**

History cards display resource name and last-visited context in a compact fixed-width card inside one `overflow-x-auto` row. Theme sections look up their label/icon from `src/data/categories.ts` and render `ResourceCard`. Filter a public resource when `resolveMarked(id, true)` is false; never filter private resources by Mark state.

- [x] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- src/components/HistoryRail.test.tsx src/pages/SpacePage.test.tsx src/components/ResourceCard.test.tsx`

Expected: focused tests PASS.

### Task 3: App composition and complete verification

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/hooks/useSpace.ts`
- Modify: `src/hooks/useSpace.test.tsx`
- Modify: `src/data/translations.ts`
- Modify: `docs/2026-09-01-resource-space-database-api-design.md`

- [x] **Step 1: Write failing App integration tests**

Cover:

```tsx
it('does not enable personal Space loading for an anonymous visitor');
it('renders Space from the authenticated snapshot at /space');
it('refreshes catalog and Space after a successful Mark change');
it('reports a Space fetch AppError once from the hook');
```

Mock hooks at their public module boundary; do not mock Supabase query chains.

- [x] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/App.test.tsx src/hooks/useSpace.test.tsx`

Expected: FAIL because `App` does not compose `useSpace` and the hook does not report handled errors.

- [x] **Step 3: Implement shared composition**

Call `useSpace(Boolean(user))` unconditionally. Build a stable refresh callback that awaits `Promise.all([catalog.retry(), space.retry()])`, and pass it to `useResourceActions`. Hide the global search box on `/space`. Render `SpacePage` for the route even when anonymous so direct links can request login.

- [x] **Step 4: Run complete verification**

Run sequentially:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm audit --omit=dev
git diff --check
```

Expected: all commands exit 0, lint has zero warnings, and the production audit reports zero vulnerabilities.

- [x] **Step 5: Commit and stop for review**

```bash
git add docs src
git commit -m "feat: add personal Space page"
```

Review 8 owns private-resource create/edit/delete forms and duplicate recommendations.
