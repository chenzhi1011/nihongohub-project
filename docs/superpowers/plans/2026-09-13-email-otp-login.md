# Email OTP Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace email Magic Link login with a same-device, two-step Supabase email OTP flow while preserving Google login.

**Architecture:** Keep Supabase calls in `src/api/authApi.ts`, expose user-oriented operations from `src/hooks/useSupabaseAuth.ts`, and keep the three-step UI state plus resend countdown inside `src/components/AuthDialog.tsx`. `src/App.tsx` only wires those boundaries and closes the dialog when authentication succeeds.

**Tech Stack:** React 18, TypeScript, Supabase JS Auth, Vitest, Testing Library, Vite.

---

## File map

- Modify `src/api/authApi.ts`: send and verify email OTP through Supabase.
- Modify `src/api/authApi.test.ts`: assert exact SDK contracts and error conversion.
- Modify `src/hooks/useSupabaseAuth.ts`: expose `sendEmailOtp` and `verifyEmailOtp` with action-specific errors.
- Create `src/hooks/useSupabaseAuth.test.tsx`: verify hook delegation, session updates, and errors.
- Modify `src/components/AuthDialog.tsx`: implement methods, email, and OTP steps plus resend countdown.
- Modify `src/components/AuthDialog.test.tsx`: exercise the complete dialog state machine.
- Modify `src/App.tsx`: wire both email actions and close the dialog after authentication.
- Modify `src/App.test.tsx`: verify integration and automatic close.
- Modify `src/data/translations.ts`: replace Magic Link copy and add OTP UI copy in Chinese and Japanese.

### Task 1: Typed Supabase OTP API

**Files:**
- Modify: `src/api/authApi.ts`
- Test: `src/api/authApi.test.ts`

- [ ] **Step 1: Write failing API tests**

Replace the Magic Link expectation with calls equivalent to:

```ts
await api.sendEmailOtp('learner@example.com');
expect(signInWithOtp).toHaveBeenCalledWith({
  email: 'learner@example.com',
  options: { shouldCreateUser: true },
});

await api.verifyEmailOtp('learner@example.com', '123456');
expect(verifyOtp).toHaveBeenCalledWith({
  email: 'learner@example.com',
  token: '123456',
  type: 'email',
});
```

Also assert that errors from both SDK methods reject as `AppError`.

- [ ] **Step 2: Run the API test and verify RED**

Run: `npm test -- src/api/authApi.test.ts`

Expected: FAIL because the new methods do not exist.

- [ ] **Step 3: Implement the API methods**

Expose these signatures from the API object and module:

```ts
sendEmailOtp(email: string): Promise<void>
verifyEmailOtp(email: string, token: string): Promise<void>
```

Both methods must use `requireClient`, `createOperationId`, and `toAppError`. Do not pass `emailRedirectTo`, because a code is verified on the requesting device rather than opened as a link.

- [ ] **Step 4: Run the API test and verify GREEN**

Run: `npm test -- src/api/authApi.test.ts`

Expected: all auth API tests pass.

- [ ] **Step 5: Commit the API boundary**

```bash
git add src/api/authApi.ts src/api/authApi.test.ts
git commit -m "feat: add email OTP auth API"
```

### Task 2: Authentication Hook Operations

**Files:**
- Modify: `src/hooks/useSupabaseAuth.ts`
- Create: `src/hooks/useSupabaseAuth.test.tsx`

- [ ] **Step 1: Write failing hook tests**

Inject or mock API dependencies and verify:

```ts
await result.current.sendEmailOtp(' learner@example.com ');
expect(sendEmailOtp).toHaveBeenCalledWith('learner@example.com');

await result.current.verifyEmailOtp('learner@example.com', '123456');
expect(verifyEmailOtp).toHaveBeenCalledWith('learner@example.com', '123456');
```

Assert send failure produces the send-specific message, verify failure produces the invalid/expired-code message, and neither test logs the email or token.

- [ ] **Step 2: Run hook tests and verify RED**

Run: `npm test -- src/hooks/useSupabaseAuth.test.tsx`

Expected: FAIL because the hook does not expose OTP operations.

- [ ] **Step 3: Implement hook operations**

Change `AuthState` to expose:

```ts
sendEmailOtp: (email: string) => Promise<void>;
verifyEmailOtp: (email: string, token: string) => Promise<void>;
```

Remove `signInWithEmail`. Preserve Google and sign-out behavior. Re-throw action errors so `AuthDialog` can keep the correct step.

- [ ] **Step 4: Run hook and API tests**

Run: `npm test -- src/hooks/useSupabaseAuth.test.tsx src/api/authApi.test.ts`

Expected: all tests pass.

- [ ] **Step 5: Commit the hook boundary**

```bash
git add src/hooks/useSupabaseAuth.ts src/hooks/useSupabaseAuth.test.tsx
git commit -m "feat: coordinate email OTP authentication"
```

### Task 3: Three-Step Authentication Dialog

**Files:**
- Modify: `src/components/AuthDialog.tsx`
- Modify: `src/components/AuthDialog.test.tsx`
- Modify: `src/data/translations.ts`

- [ ] **Step 1: Write failing dialog tests**

Test these observable transitions:

```text
open → only email OTP and Google choices
email choice → email input
successful send → six-digit OTP input
six valid digits → verify action
countdown active → resend disabled
countdown elapsed → resend enabled
change email → email step
close then reopen → methods step
```

Use fake timers for the 60-second countdown. Assert the component strips non-digits and caps the token at six digits.

- [ ] **Step 2: Run dialog tests and verify RED**

Run: `npm test -- src/components/AuthDialog.test.tsx`

Expected: FAIL because the existing dialog immediately shows the Magic Link form.

- [ ] **Step 3: Implement the state machine**

Update props to:

```ts
onSendEmailOtp: (email: string) => Promise<void>;
onVerifyEmailOtp: (email: string, token: string) => Promise<void>;
```

Use:

```ts
type AuthDialogStep = 'methods' | 'email' | 'otp';
type PendingAuthAction = 'google' | 'send-otp' | 'verify-otp' | 'resend-otp' | null;
```

Reset state when `open` changes from false to true. The OTP input must use `inputMode="numeric"`, `autoComplete="one-time-code"`, `maxLength={6}`, and an accessible label. Resend starts a new 60-second countdown only after the send promise succeeds.

- [ ] **Step 4: Add bilingual copy**

Add concrete translation keys for email OTP choice, email step title, send progress, code label, verify progress, resend countdown, resend success, change email, and back to login methods. Remove UI references to a login link.

- [ ] **Step 5: Run dialog tests and verify GREEN**

Run: `npm test -- src/components/AuthDialog.test.tsx`

Expected: all dialog tests pass.

- [ ] **Step 6: Commit the dialog**

```bash
git add src/components/AuthDialog.tsx src/components/AuthDialog.test.tsx src/data/translations.ts
git commit -m "feat: build email OTP login dialog"
```

### Task 4: App Integration and Completion Verification

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `docs/superpowers/specs/2026-09-13-email-otp-login-design.md`

- [ ] **Step 1: Write failing App integration tests**

Make the auth mock expose stable `sendEmailOtp` and `verifyEmailOtp` functions. Verify `AuthDialog` can invoke both through App, then rerender with a user and assert the dialog closes.

- [ ] **Step 2: Run App tests and verify RED**

Run: `npm test -- src/App.test.tsx`

Expected: FAIL because App still passes `onEmailLogin` and does not close on authentication.

- [ ] **Step 3: Wire OTP actions and authenticated close**

Pass the two hook actions to `AuthDialog`. Add an effect equivalent to:

```ts
useEffect(() => {
  if (user) setAuthDialogOpen(false);
}, [user]);
```

This keeps session detection in the hook and dialog visibility in App.

- [ ] **Step 4: Mark the reviewed spec implemented**

Change the spec status from `待用户 Review` to `已实施`, only after the behavior and tests pass.

- [ ] **Step 5: Run complete verification**

```bash
npm test
npm run typecheck
npm run lint
npm run build
git diff --check
```

Expected: 0 failures, 0 type errors, 0 lint errors, successful production build, and no whitespace errors.

- [ ] **Step 6: Commit integration**

```bash
git add src/App.tsx src/App.test.tsx docs/superpowers/specs/2026-09-13-email-otp-login-design.md
git commit -m "feat: complete email OTP login flow"
```

### Task 5: Manual Supabase Configuration Handoff

**Files:**
- No code changes.

- [ ] **Step 1: Provide the remote configuration checklist**

Tell the user to replace `{{ .ConfirmationURL }}` with `{{ .Token }}` in the hosted Supabase Magic Link template, retain Resend SMTP, and verify remote OTP length is six.

- [ ] **Step 2: Do not mutate remote services**

Wait for explicit authorization before changing Supabase Dashboard, Vercel, DNS, Google OAuth, or Resend configuration.
