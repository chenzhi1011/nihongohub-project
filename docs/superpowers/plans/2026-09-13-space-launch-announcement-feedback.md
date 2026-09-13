# Space Launch Announcement and Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 向未登录用户展示一次性学习空间上线公告，并把登录后可用的反馈入口改造成由 Supabase 安全保存的单文本框反馈功能。

**Architecture:** 公告保持为浏览器本地 UI 状态，由独立组件管理版本键；反馈通过 `FeedbackFab → useFeedback → feedbackApi → submit_feedback RPC → user_feedback` 写入。数据库 RPC 是身份校验、字符限制、60 秒冷却、每日 5 条和并发控制的唯一可信边界。

**Tech Stack:** React 18、TypeScript、React Testing Library、Vitest、Supabase/PostgreSQL、pgTAP、Tailwind CSS、Vite。

---

## 文件结构

- Create: `supabase/migrations/202609130002_create_user_feedback.sql` — 表、索引、RLS、RPC 和授权。
- Create: `supabase/tests/database/07_user_feedback.test.sql` — schema、权限、限流和并发边界的数据库测试。
- Create: `supabase/tests/concurrency/feedback_limits.sh` — 两个真实并发连接验证用户级限额。
- Modify: `package.json` — 增加反馈并发测试脚本。
- Modify: `src/types/database.ts` — 补充生成后的表与 RPC 类型。
- Modify: `src/errors/appError.ts` — 增加反馈限流相关稳定错误码。
- Create: `src/api/feedbackApi.ts` — 唯一的 Supabase 反馈访问层。
- Create: `src/api/feedbackApi.test.ts` — API 参数、返回和错误映射测试。
- Create: `src/hooks/useFeedback.ts` — 提交状态、用户提示和脱敏日志。
- Create: `src/hooks/useFeedback.test.tsx` — Hook 状态与日志测试。
- Create: `src/components/SpaceLaunchAnnouncement.tsx` — 一次性公告 UI 与版本存储。
- Create: `src/components/SpaceLaunchAnnouncement.test.tsx` — 展示、关闭和登录 CTA 测试。
- Modify: `src/components/FeedbackFab.tsx` — 删除问卷与 `mailto`，改成登录门控的单 textarea。
- Modify: `src/components/FeedbackFab.test.tsx` — 反馈登录门控、输入、提交和失败保留测试。
- Modify: `src/App.tsx` — 组合公告、认证弹窗和反馈 Hook。
- Modify: `src/App.test.tsx` — 页面级公告与反馈接线测试。
- Modify: `src/data/translations.ts` — 公告、反馈和错误的中日文文案。
- Modify: `src/pages/PrivacyPage.tsx` — 声明反馈正文的收集与用途。
- Modify: `src/types/resource.ts` or generated database type owner — 仅在生成脚本要求时同步数据库类型，不创建重复 DTO。

## Task 1：数据库反馈边界

**Files:**
- Create: `supabase/tests/database/07_user_feedback.test.sql`
- Create: `supabase/tests/concurrency/feedback_limits.sh`
- Create: `supabase/migrations/202609130002_create_user_feedback.sql`
- Modify: `package.json`

- [ ] **Step 1：先写 schema 和权限失败测试**

测试必须断言：

```sql
select has_table('public', 'user_feedback');
select col_type_is('public', 'user_feedback', 'id', 'uuid');
select col_is_pk('public', 'user_feedback', 'id');
select fk_ok('public', 'user_feedback', 'user_id', 'auth', 'users', 'id');
select has_function('public', 'submit_feedback', array['text']);
select function_privs_are(
  'public', 'submit_feedback', array['text'], 'authenticated', array['EXECUTE']
);
```

同时用 `set local role authenticated` 验证直接 `select` 和 `insert` 被拒绝。

- [ ] **Step 2：运行测试并确认 RED**

Run:

```bash
npx supabase db reset
npx supabase test db supabase/tests/database/07_user_feedback.test.sql
```

Expected: FAIL，因为 `user_feedback` 和 `submit_feedback(text)` 尚不存在。

- [ ] **Step 3：实现最小 schema、索引、RLS 与授权**

Migration 必须包含：

```sql
create table public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index user_feedback_user_created_at_idx
  on public.user_feedback (user_id, created_at desc);

alter table public.user_feedback enable row level security;
revoke all on public.user_feedback from anon, authenticated;
```

RPC 必须 `SECURITY DEFINER SET search_path = public, pg_temp`，拒绝空身份，使用 `pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0))`，执行 `btrim`，按最近 60 秒和 `timezone('Asia/Tokyo', created_at)::date` 限制提交，返回新 UUID。回收 `PUBLIC/anon` 执行权，只授权 `authenticated`。

- [ ] **Step 4：补齐行为失败测试再实现 GREEN**

依次测试并实现：

- 合法正文被 trim，并绑定 `auth.uid()`。
- 空白和 1001 字符抛出 `feedback_invalid_content`。
- 60 秒内重复提交抛出 `feedback_rate_limited`。
- 日本自然日第 6 条抛出 `feedback_daily_limit_reached`。
- 两个用户的额度互不影响。
- 客户端不能直接读写表。

- [ ] **Step 5：运行数据库回归**

先创建 `supabase/tests/concurrency/feedback_limits.sh`：准备同一用户 4 条当日反馈，再同时启动两个独立 `psql` 连接调用 RPC；断言最终总数为 5，并且一个请求成功、另一个返回 `feedback_daily_limit_reached`。脚本使用 `mktemp -d`、显式测试 UUID 和 `trap` 清理，不输出反馈正文。

在 `package.json` 增加：

```json
"db:test:feedback-concurrency": "bash supabase/tests/concurrency/feedback_limits.sh"
```

Run:

```bash
npm run db:test
npm run db:test:concurrency
npm run db:test:feedback-concurrency
```

Expected: 所有 pgTAP 和既有资源并发测试通过。

- [ ] **Review Point 1：暂停给用户 review**

展示表字段、RPC 伪代码、RLS 权限矩阵和测试结果。回答问题并获得确认后才提交：

```bash
git add package.json supabase/migrations/202609130002_create_user_feedback.sql supabase/tests/database/07_user_feedback.test.sql supabase/tests/concurrency/feedback_limits.sh
git commit -m "feat: add secure user feedback storage"
```

## Task 2：数据库类型与 API

**Files:**
- Modify: `src/types/database.ts`
- Modify: `src/errors/appError.ts`
- Create: `src/api/feedbackApi.ts`
- Create: `src/api/feedbackApi.test.ts`

- [ ] **Step 1：生成数据库类型**

Run:

```bash
npm run db:types
```

确认生成结果包含：

```ts
user_feedback: {
  Row: { id: string; user_id: string; content: string; created_at: string };
};
submit_feedback: { Args: { p_content: string }; Returns: string };
```

- [ ] **Step 2：先写 API 失败测试**

覆盖：

```ts
await api.submitFeedback('  useful feedback  ');
expect(client.rpc).toHaveBeenCalledWith('submit_feedback', {
  p_content: '  useful feedback  ',
});
```

以及返回 `{ feedbackId }`、Supabase error 检查、四个稳定数据库消息的 AppError 映射、缺少客户端时的错误。

- [ ] **Step 3：运行测试并确认 RED**

Run:

```bash
npm test -- src/api/feedbackApi.test.ts
```

Expected: FAIL，因为 API 尚不存在。

- [ ] **Step 4：实现最小 API**

导出依赖注入友好的边界：

```ts
export function createFeedbackApi(client: AppSupabaseClient | null) {
  return {
    async submitFeedback(content: string): Promise<{ feedbackId: string }> {
      const { data, error } = await requireClient(client, operationId)
        .rpc('submit_feedback', { p_content: content });
      if (error) throw mapFeedbackError(error, operationId);
      return { feedbackId: data };
    },
  };
}
```

不得在 API 或错误上下文中加入正文。

- [ ] **Step 5：运行 API 测试、typecheck 和 lint**

Run:

```bash
npm test -- src/api/feedbackApi.test.ts
npm run typecheck
npm run lint
```

Expected: PASS。

## Task 3：反馈 Hook

**Files:**
- Create: `src/hooks/useFeedback.ts`
- Create: `src/hooks/useFeedback.test.tsx`
- Modify: `src/data/translations.ts`

- [ ] **Step 1：先写 Hook 失败测试**

测试依赖注入的 `submitFeedback`，覆盖：

- 提交时 `submitting=true`，成功返回 `true` 并设 `succeeded=true`。
- 已在提交时忽略第二次调用。
- 失败返回 `false` 并保留稳定的中日文错误键。
- 只上报一次 `feedback.submit.failed`。
- 上报上下文没有正文和邮箱。
- `clearFeedbackState()` 清除成功和错误。

- [ ] **Step 2：运行测试并确认 RED**

Run:

```bash
npm test -- src/hooks/useFeedback.test.tsx
```

Expected: FAIL，因为 Hook 尚不存在。

- [ ] **Step 3：实现 Hook**

Hook 接受 translator 或稳定错误到翻译键的映射，保持 UI 不理解数据库错误：

```ts
const submit = useCallback(async (content: string): Promise<boolean> => {
  if (submittingRef.current) return false;
  submittingRef.current = true;
  setSubmitting(true);
  try {
    await dependencies.submitFeedback(content);
    setSucceeded(true);
    return true;
  } catch (error) {
    reportError(...); // no content
    setError(resolveFeedbackMessage(error, t));
    return false;
  } finally {
    submittingRef.current = false;
    setSubmitting(false);
  }
}, [dependencies, t]);
```

- [ ] **Step 4：验证 Hook**

Run:

```bash
npm test -- src/hooks/useFeedback.test.tsx
npm run typecheck
npm run lint
```

Expected: PASS。

- [ ] **Review Point 2：暂停给用户 review**

解释 API/Hook 分层、错误映射和日志脱敏；确认后提交：

```bash
git add src/types/database.ts src/errors/appError.ts src/api/feedbackApi.ts src/api/feedbackApi.test.ts src/hooks/useFeedback.ts src/hooks/useFeedback.test.tsx src/data/translations.ts
git commit -m "feat: add feedback submission client"
```

## Task 4：一次性上线公告

**Files:**
- Create: `src/components/SpaceLaunchAnnouncement.tsx`
- Create: `src/components/SpaceLaunchAnnouncement.test.tsx`
- Modify: `src/data/translations.ts`

- [ ] **Step 1：先写公告失败测试**

覆盖：

- `authenticated=false`、认证加载结束、存储键不存在时展示。
- `authenticated=true` 或 `authLoading=true` 时不展示。
- 「稍后看看」、关闭按钮和「立即登录」都写入 `nihongohub.announcement.spaceLaunch.v1=1`。
- 「立即登录」额外调用 `onLogin`。
- 已读后重新挂载不展示。
- `localStorage` 抛错时仍能关闭当前弹窗。

- [ ] **Step 2：运行测试并确认 RED**

Run:

```bash
npm test -- src/components/SpaceLaunchAnnouncement.test.tsx
```

Expected: FAIL，因为组件尚不存在。

- [ ] **Step 3：实现公告组件**

组件 props：

```ts
type Props = {
  authenticated: boolean;
  authLoading: boolean;
  darkMode: boolean;
  t: (key: string) => string;
  onLogin: () => void;
};
```

只在首次 auth-ready 时评估一次。弹窗包含标题、四项能力说明、关闭按钮、「稍后看看」和「立即登录」。

- [ ] **Step 4：验证公告组件**

Run:

```bash
npm test -- src/components/SpaceLaunchAnnouncement.test.tsx
npm run typecheck
npm run lint
```

Expected: PASS。

## Task 5：精简并保护反馈 UI

**Files:**
- Modify: `src/components/FeedbackFab.tsx`
- Modify: `src/components/FeedbackFab.test.tsx`

- [ ] **Step 1：先改写反馈失败测试**

新增/更新断言：

```ts
await user.click(screen.getByRole('button', { name: '反馈意见' }));
expect(onLoginRequired).toHaveBeenCalledOnce(); // anonymous

expect(screen.getByRole('textbox', { name: '反馈内容' })).toBeInTheDocument();
expect(screen.queryByText('你喜欢添加哪一类资源/工具')).not.toBeInTheDocument();
```

并覆盖：空白不可提交、1000 字符计数、1001 字符被输入层阻止、成功清空关闭、失败保留正文、Escape 关闭、提交中禁用。

- [ ] **Step 2：运行测试并确认 RED**

Run:

```bash
npm test -- src/components/FeedbackFab.test.tsx
```

Expected: FAIL，因为旧问卷和 `mailto` 仍存在。

- [ ] **Step 3：实现精简 UI**

删除 `resourcePref`、`featurePref`、附加 input、冷却 localStorage 和 `window.location.href`。新增：

```ts
onSubmitFeedback: (content: string) => Promise<boolean>;
feedbackSubmitting: boolean;
feedbackError: string | null;
onClearFeedbackState: () => void;
```

未登录的入口 click 只调用 `onLoginRequired`。登录后弹窗只包含一个带 `maxLength={1000}` 的 textarea 和 `text.length / 1000`。

- [ ] **Step 4：验证反馈 UI**

Run:

```bash
npm test -- src/components/FeedbackFab.test.tsx
npm run typecheck
npm run lint
```

Expected: PASS。

## Task 6：App 接线、隐私声明和页面测试

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/pages/PrivacyPage.tsx`
- Modify: `src/data/translations.ts`

- [ ] **Step 1：先写页面接线失败测试**

覆盖：

- 未登录首次进入显示公告，点击登录后出现 `AuthDialog`。
- 已登录进入不显示公告。
- 未登录点击反馈入口打开 `AuthDialog`。
- 登录后反馈内容传入 Hook action。
- `/privacy` 的中日文内容明确包含「反馈内容」/「フィードバック内容」。

- [ ] **Step 2：运行测试并确认 RED**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: FAIL，因为 App 尚未组合新组件和 Hook。

- [ ] **Step 3：实现 App 组合**

在 `App` 中调用 `useFeedback(t)`，移除旧 `UpdateNotice`，挂载：

```tsx
<SpaceLaunchAnnouncement
  authenticated={Boolean(user)}
  authLoading={authLoading}
  darkMode={darkMode}
  t={t}
  onLogin={() => setAuthDialogOpen(true)}
/>
```

将 Hook 状态和动作传给 `FeedbackFab`。隐私页中日文同步增加反馈正文及其用途，不写入第三方未实际发生的数据处理。

- [ ] **Step 4：运行前端回归**

Run:

```bash
npm test -- src/App.test.tsx src/components/SpaceLaunchAnnouncement.test.tsx src/components/FeedbackFab.test.tsx
npm run typecheck
npm run lint
```

Expected: PASS。

- [ ] **Review Point 3：暂停给用户进行 UI review**

启动：

```bash
npm run dev
```

用户检查公告首次展示、登录引导、反馈单文本框、中日文和深色模式。确认后提交：

```bash
git add src/App.tsx src/App.test.tsx src/components/SpaceLaunchAnnouncement.tsx src/components/SpaceLaunchAnnouncement.test.tsx src/components/FeedbackFab.tsx src/components/FeedbackFab.test.tsx src/data/translations.ts src/pages/PrivacyPage.tsx
git commit -m "feat: announce Space and collect feedback"
```

## Task 7：最终验证

**Files:**
- Verify all changed files

- [ ] **Step 1：全量自动验证**

Run:

```bash
npm test
npm run db:test
npm run db:test:concurrency
npm run db:test:feedback-concurrency
npm run typecheck
npm run lint
npm run build
git diff --check
```

Expected: 所有命令退出码为 0。

- [ ] **Step 2：安全与隐私复核**

确认：

- 前端 bundle 不含 service-role key。
- 日志上下文和错误消息不含反馈正文、邮箱或 token。
- `anon/authenticated` 无法直接读取 `user_feedback`。
- RPC 只能由 `authenticated` 执行。
- 公告和反馈弹窗不会同时打开。

- [ ] **Step 3：报告分支状态**

展示提交、未提交文件、相对 `learn-nihongohub/dev` 的 ahead 状态；未经用户明确要求不 push、不创建 PR。
