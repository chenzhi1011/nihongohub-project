# Private Resource Creation — Review 8 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let authenticated users add a private resource from Space, with client-side field feedback and database-authoritative exact/similar/limit outcomes before any save is shown as successful.

**Architecture:** `PrivateResourceDialog` owns form presentation and draft state, calls an injected `onCreate(input, reviewed)` callback, and renders the returned discriminated union. A pure service converts form text into `PrivateResourceInput` and field errors. The existing RPC remains the only authority for exact duplicates, same-source limits, the 200 total limit, and concurrent writes.

**Tech Stack:** React 18, TypeScript, React Testing Library/Vitest, existing `useResourceActions` and Supabase RPC API.

---

## File structure

- Create `src/service/privateResourceService.ts`: pure trim/tag parsing and field validation.
- Create `src/components/PrivateResourceDialog.tsx`: accessible form and result/recommendation states.
- Replace `src/components/AddResourceButton.tsx`: remove the development modal and emit an open callback.
- Modify `src/pages/SpacePage.tsx`: show Add Resource and host the dialog only for authenticated users.
- Modify `src/App.tsx`: inject `resourceActions.createResource` into Space.
- Modify `src/data/translations.ts`: form, validation, recommendation, and limit messages.
- Update `docs/2026-09-01-resource-space-database-api-design.md`: document the single-RPC two-step confirmation flow.

### Task 1: Pure draft validation

**Files:**
- Create: `src/service/privateResourceService.ts`
- Create: `src/service/privateResourceService.test.ts`

- [x] **Step 1: Write failing validation tests**

Cover trimming, HTTP(S), required name/description, field lengths, comma-separated tag trim/deduplication, maximum 10 tags, and per-tag 30-character limit. The result is:

```ts
type BuildPrivateResourceResult =
  | { valid: true; input: PrivateResourceInput }
  | { valid: false; errors: Partial<Record<'category' | 'name' | 'description' | 'url' | 'tags', string>> };
```

- [x] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/service/privateResourceService.test.ts`

Expected: FAIL because the service does not exist.

- [x] **Step 3: Implement minimal pure validation**

The browser validation improves feedback but does not generate `owner_id` or `normalized_url` and does not enforce 200/30/exact duplicate rules. Those remain in the RPC transaction.

- [x] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- src/service/privateResourceService.test.ts`

Expected: all focused tests PASS.

### Task 2: Form and result-state dialog

**Files:**
- Create: `src/components/PrivateResourceDialog.tsx`
- Create: `src/components/PrivateResourceDialog.test.tsx`
- Modify: `src/components/AddResourceButton.tsx`
- Modify: `src/components/AddResourceButton.test.tsx`

- [x] **Step 1: Write failing interaction tests**

Cover:

```tsx
it('keeps invalid input local and does not call onCreate');
it('submits a normalized input with reviewed=false');
it('closes and resets only after saved');
it('shows exact duplicate recommendations without a continue action');
it('shows same-source recommendations and continues only after explicit confirmation');
it('shows 200 and 30 limit outcomes without retrying automatically');
it('preserves the draft after a thrown network error');
```

Recommendations show safe native external links. Exact public recommendations may expose an injected Mark action; private recommendations only open the existing resource.

- [x] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/components/PrivateResourceDialog.test.tsx src/components/AddResourceButton.test.tsx`

Expected: FAIL because the real form does not exist and AddResourceButton still owns a development modal.

- [x] **Step 3: Implement the discriminated-union UI**

First submit calls `onCreate(input, false)`. Only `similar_review_required` renders a Continue button; it calls the same callback with the preserved input and `true`. `exact_url_exists`, `similar_limit_reached`, and `private_limit_reached` never offer Continue. Disable submit during requests and use an `aria-live` result area.

- [x] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- src/components/PrivateResourceDialog.test.tsx src/components/AddResourceButton.test.tsx`

Expected: all focused tests PASS without React warnings.

### Task 3: Space composition and completion

**Files:**
- Modify: `src/pages/SpacePage.tsx`
- Modify: `src/pages/SpacePage.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/data/translations.ts`
- Modify: `docs/2026-09-01-resource-space-database-api-design.md`

- [x] **Step 1: Write failing composition tests**

Cover authenticated Add button visibility, anonymous absence, form opening, successful create callback flow, and Space refresh through the already-tested action hook.

- [x] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/pages/SpacePage.test.tsx src/App.test.tsx`

Expected: FAIL because Space does not expose creation.

- [x] **Step 3: Wire callbacks without importing API modules into pages**

`App` passes `resourceActions.createResource`; `SpacePage` passes it into the dialog. Neither component imports Supabase or `resourceApi`. Keep edit/delete outside this review.

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

Expected: all commands exit 0, lint has zero warnings, and production audit reports zero vulnerabilities.

- [x] **Step 5: Commit and stop for review**

```bash
git add docs src
git commit -m "feat: add private resource creation"
```

Review 9 owns private-resource edit and delete.
