# Private Resource Edit and Delete — Review 9 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let authenticated users edit and permanently delete their own private resources from Space through a compact card menu, while preserving the existing API/service/UI boundaries.

**Architecture:** `ResourceCard` emits edit/delete intents only for private resources. `SpacePage` owns the selected resource and composes a mode-aware `PrivateResourceDialog` plus a focused `DeleteResourceDialog`; `App` injects `useResourceActions` callbacks. Database ownership, duplicate checks, limits, mutation logging, and refresh behavior stay in the existing API/RPC/Hook layers.

**Tech Stack:** React 18, TypeScript, Lucide React, React Testing Library/Vitest, existing Supabase RPC API and `useResourceActions`.

---

## File structure

- Modify `src/components/ResourceCard.tsx`: render a private-only overflow menu and emit edit/delete intents.
- Modify `src/components/ResourceCard.test.tsx`: protect public/private action separation and menu callbacks.
- Modify `src/components/PrivateResourceDialog.tsx`: support create and edit modes with initial resource values.
- Modify `src/components/PrivateResourceDialog.test.tsx`: verify prefill, update callback, reset, and existing result states in edit mode.
- Create `src/components/DeleteResourceDialog.tsx`: isolated destructive confirmation, pending, and safe failure UI.
- Create `src/components/DeleteResourceDialog.test.tsx`: verify cancel, confirm, success, failure, and retry.
- Modify `src/pages/SpacePage.tsx`: own selected edit/delete resources and compose dialogs.
- Modify `src/pages/SpacePage.test.tsx`: verify private action wiring and public action absence.
- Modify `src/App.tsx` and `src/App.test.tsx`: inject update/delete Hook callbacks without importing API modules.
- Modify `src/data/translations.ts`: edit, delete, confirmation, and safe failure messages.
- Modify `docs/2026-09-01-resource-space-database-api-design.md`: mark edit/delete UI as implemented locally.

### Task 1: Private resource card menu

**Files:**
- Modify: `src/components/ResourceCard.test.tsx`
- Modify: `src/components/ResourceCard.tsx`

- [x] **Step 1: Write failing card interaction tests**

Add separate tests that establish:

```tsx
it('keeps the Mark control and hides ownership actions for a public resource');
it('shows a private overflow menu instead of Mark');
it('emits the selected private resource for edit and delete');
```

Pass optional `onEditPrivate` and `onDeletePrivate` callbacks. Query the overflow button by translated accessible name, open it, then click the translated edit/delete item. Assert public cards never expose the overflow menu.

- [x] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/components/ResourceCard.test.tsx`

Expected: FAIL because `ResourceCard` does not accept private ownership callbacks or render the menu.

- [x] **Step 3: Implement the minimal private-only menu**

Add optional callback props:

```ts
onEditPrivate?: (resource: ResourceRecord) => void;
onDeletePrivate?: (resource: ResourceRecord) => void;
```

For `resource.source === 'private'`, render a button using `t('resourceActions')`; toggle a small menu with `t('editResource')` and `t('deleteResource')`. Clicking an item closes the menu and emits the current resource. Keep the existing public Mark branch unchanged.

- [x] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- src/components/ResourceCard.test.tsx`

Expected: all ResourceCard tests PASS without warnings.

- [x] **Step 5: Stop for Review 9A**

Explain why the card emits an intent instead of opening dialogs or calling APIs itself.

### Task 2: Reusable edit form and delete confirmation

**Files:**
- Modify: `src/components/PrivateResourceDialog.test.tsx`
- Modify: `src/components/PrivateResourceDialog.tsx`
- Create: `src/components/DeleteResourceDialog.test.tsx`
- Create: `src/components/DeleteResourceDialog.tsx`

- [x] **Step 1: Write failing edit-mode tests**

Extend dialog props with an optional edit resource and make the title/submit label mode-aware. Add tests proving:

```tsx
it('prefills edit mode from a private resource');
it('submits edited normalized input with reviewed=false');
it('continues an edited same-source resource only after confirmation');
it('restores the selected resource when edit mode changes');
```

The injected submit callback keeps the same `(input, reviewed)` signature; `SpacePage` chooses create versus update. This prevents the form from knowing resource API details.

- [x] **Step 2: Run edit tests and verify RED**

Run: `npm test -- src/components/PrivateResourceDialog.test.tsx`

Expected: new edit tests FAIL because the dialog only initializes an empty create draft.

- [x] **Step 3: Implement mode-aware initial state**

Add:

```ts
initialResource?: ResourceRecord | null;
mode?: 'create' | 'edit';
```

Build the initial draft from `initialResource`; join tags with `, `. When the active dialog target changes, reset draft/result/errors to that target. Continue to call only the injected `onCreate(input, reviewed)` callback; rename the prop to `onSubmit` to reflect both modes and update existing call sites/tests.

- [x] **Step 4: Run edit and create regression tests**

Run: `npm test -- src/components/PrivateResourceDialog.test.tsx src/components/AddResourceButton.test.tsx`

Expected: create and edit behavior both PASS.

- [x] **Step 5: Write failing delete dialog tests**

Create tests proving:

```tsx
it('names the resource and does not delete when cancelled');
it('waits for confirmation and closes after successful deletion');
it('keeps the dialog open with a safe retry message after failure');
it('prevents duplicate confirmation while deletion is pending');
```

- [x] **Step 6: Run delete tests and verify RED**

Run: `npm test -- src/components/DeleteResourceDialog.test.tsx`

Expected: FAIL because the component does not exist.

- [x] **Step 7: Implement focused delete confirmation**

The component accepts `resource`, `open`, `onClose`, and `onDelete(resourceId)`. It owns only `pending` and `failed`; it never imports API modules. Cancel closes without mutation. Confirm disables destructive controls, awaits deletion, closes on success, and keeps the resource visible with `t('resourceDeleteFailed')` on failure.

- [x] **Step 8: Run Task 2 tests and verify GREEN**

Run: `npm test -- src/components/PrivateResourceDialog.test.tsx src/components/DeleteResourceDialog.test.tsx`

Expected: all focused tests PASS without raw error text or React warnings.

- [x] **Step 9: Stop for Review 9B**

Explain form reuse, why delete is separate, and why expected business statuses are not error logs.

### Task 3: Space/App composition and completion

**Files:**
- Modify: `src/pages/SpacePage.test.tsx`
- Modify: `src/pages/SpacePage.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/data/translations.ts`
- Modify: `docs/2026-09-01-resource-space-database-api-design.md`

- [x] **Step 1: Write failing Space composition tests**

Add tests proving that a private resource menu opens a prefilled edit form, edit calls:

```ts
onUpdateResource(resource.id, input, false)
```

and delete opens confirmation before calling:

```ts
onDeleteResource(resource.id)
```

Also assert public resources do not expose private actions.

- [x] **Step 2: Write failing App injection test**

Extend the existing mocked `useResourceActions` return with `updateResource` and `deleteResource`. Navigate to an authenticated Space snapshot and verify the dialogs can be opened from a private card. The Hook unit tests already prove refresh and structured logging; do not duplicate those internals in App tests.

- [x] **Step 3: Run composition tests and verify RED**

Run: `npm test -- src/pages/SpacePage.test.tsx src/App.test.tsx`

Expected: FAIL because Space does not yet own edit/delete targets or accept callbacks.

- [x] **Step 4: Wire Space and App without API imports**

Add required Space props:

```ts
onUpdateResource: (resourceId: number, input: PrivateResourceInput, reviewed: boolean) => Promise<SavePrivateResourceResult>;
onDeleteResource: (resourceId: number) => Promise<void>;
```

`SpacePage` stores `editingResource` and `deletingResource`, supplies resource callbacks to private cards, and selects the correct submit handler. `App` passes `resourceActions.updateResource` and `resourceActions.deleteResource`.

- [x] **Step 5: Add translations and update design status**

Add Chinese/Japanese strings for the overflow accessible name, edit/delete actions, edit title, delete question, cancel, confirm, pending, and safe failure. Update the dated database/API design status without claiming production deployment.

- [x] **Step 6: Run focused GREEN verification**

Run: `npm test -- src/components/ResourceCard.test.tsx src/components/PrivateResourceDialog.test.tsx src/components/DeleteResourceDialog.test.tsx src/pages/SpacePage.test.tsx src/App.test.tsx`

Expected: all focused tests PASS.

- [x] **Step 7: Run complete verification**

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

- [x] **Step 8: Commit and stop for Review 9C**

```bash
git add docs src
git commit -m "feat: edit and delete private resources"
```

Review 9 ends after local verification and commit. Linking or pushing the Supabase migration remains a separately confirmed deployment step.
