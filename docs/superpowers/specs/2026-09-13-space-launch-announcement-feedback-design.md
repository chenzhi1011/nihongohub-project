# 学习空间上线公告与反馈意见设计

**日期：** 2026-09-13  
**状态：** 已确认，待实施

## 1. 责任边界

本功能遵守以下边界：

- 页面组件只负责展示、输入和触发回调，不直接调用 Supabase。
- Hook 管理加载、成功、失败等 UI 状态，并负责上报一次脱敏错误日志。
- `src/api/` 封装 Supabase RPC 调用与数据库错误映射。
- PostgreSQL RPC 负责身份校验、内容校验、限流、并发控制和最终写入。
- 公告是否展示属于单设备 UI 偏好，保存在浏览器 `localStorage`，不写入用户数据库。
- 反馈正文只保存于 `user_feedback`，不得进入前端错误日志或数据库运行日志。

## 2. 功能范围

### 2.1 学习空间上线公告

- 用居中弹窗替换当前首页顶部的旧版功能更新横幅。
- 仅在认证状态首次加载完成后判断是否展示，避免闪烁。
- 仅向未登录用户展示；已登录用户不展示。
- 当前页面生命周期只判断一次，用户之后退出登录也不会突然出现公告。
- 点击关闭、「稍后看看」或「立即登录」后，都写入：
  `nihongohub.announcement.spaceLaunch.v1 = 1`。
- `localStorage` 不可用时，当前页面内仍可正常关闭，但刷新后可能再次出现。
- 「立即登录」关闭公告并打开现有登录弹窗。
- 公告说明：个人 Space 已上线，用户可以 Mark 公共资源、添加私人学习资源、形成个人学习路径并进行每日打卡。
- 后续新公告通过更换存储键版本（例如 `v2`）再次展示，不增加配置表。

### 2.2 反馈意见

- 右下角入口和弹窗标题统一为「反馈意见」/「フィードバック」。
- 未登录用户点击入口时直接打开登录弹窗，不打开反馈输入框。
- 登录用户点击后打开反馈弹窗。
- 弹窗只保留一个 textarea、当前字数、取消和提交按钮。
- 删除旧问卷选项、附加输入框和 `mailto` 发送逻辑。
- 内容去除首尾空格后必须为 1–1000 字符。
- 成功后清空并关闭弹窗，展示约 3 秒的成功提示。
- 失败时保留原文，显示可操作的错误提示。

## 3. 数据库设计

### 3.1 `user_feedback`

只保存反馈本身和必要归属信息，不复制用户邮箱。

| 字段 | 类型 | 约束 | 说明 | 数据例子 |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | `PK, NN, DEFAULT gen_random_uuid()` | 反馈唯一标识 | `90f65b75-c5fb-4daa-93b6-b0dd14d2ea31` |
| `user_id` | `uuid` | `FK, NN` | 引用 `auth.users.id`；账号删除时级联删除 | `6fda32b8-67a1-4b7e-b427-10a38c3d550c` |
| `content` | `text` | `NN, CK` | 数据库约束长度为 1–1000 字符 | `希望浏览历史可以手动清除。` |
| `created_at` | `timestamptz` | `NN, DEFAULT now()` | 服务端提交时间 | `2026-09-13T12:30:00Z` |

约束缩写：

- `PK`：Primary Key，主键，唯一标识一条反馈。
- `FK`：Foreign Key，外键，保证 `user_id` 对应真实账号。
- `NN`：Not Null，字段不能为空。
- `CK`：Check Constraint，数据库必须验证的值规则。

外键使用 `ON DELETE CASCADE`：删除账号时，其反馈一并删除，避免留下无法归属的数据。

### 3.2 索引

建立索引：

```sql
create index user_feedback_user_created_at_idx
on public.user_feedback (user_id, created_at desc);
```

该索引直接服务两项数据库校验：查找某用户最近一次提交，以及统计该用户日本自然日内的提交次数。首版不建立内容全文索引、状态索引或管理员检索系统。

## 4. 权限与防滥用

- 开启 RLS，但不为 `anon` 或 `authenticated` 创建表级读写 policy。
- 回收客户端对 `user_feedback` 的直接表权限。
- 只向 `authenticated` 授予 `submit_feedback(text)` 的执行权限。
- RPC 使用 `SECURITY DEFINER`，固定安全的 `search_path`，并在写入前验证 `auth.uid()`。
- 管理员仍可通过 Supabase Dashboard 的数据库管理权限查看反馈。
- 用户首版不能读取、修改或删除已提交反馈。

RPC 在同一事务内执行：

1. 获取基于 `auth.uid()` 的事务级 advisory lock，串行化同一用户的并发提交。
2. 对正文执行 `btrim`，校验 1–1000 字符。
3. 查询最近一条反馈；距当前时间不足 60 秒则拒绝。
4. 按 `Asia/Tokyo` 计算自然日；当日已有 5 条则拒绝。
5. 写入反馈并返回新建 `uuid`。

稳定数据库错误消息：

- `feedback_auth_required`
- `feedback_invalid_content`
- `feedback_rate_limited`
- `feedback_daily_limit_reached`

不采用仅前端冷却，因为用户可以绕过页面直接请求 Supabase；不采用普通表级 Insert policy，因为 RLS 不能可靠地组合并发计数和写入。

## 5. API 与 Hook

### 5.1 `src/api/feedbackApi.ts`

```ts
submitFeedback(content: string): Promise<{ feedbackId: string }>
```

- 调用 `supabase.rpc('submit_feedback', { p_content: content })`。
- 检查 Supabase 返回的 `error`。
- 把稳定数据库错误映射为现有 `AppError`，未知错误映射为通用 API 错误。
- API 层不记录正文。

### 5.2 `src/hooks/useFeedback.ts`

```ts
{
  submitting: boolean;
  error: string | null;
  succeeded: boolean;
  submitFeedback(content: string): Promise<boolean>;
  clearFeedbackState(): void;
}
```

- 阻止重复提交。
- 将稳定错误码映射为中日文用户提示。
- 失败时调用一次 `reportError`，日志事件为 `feedback.submit.failed`。
- 日志允许包含 `operationId`、错误码、环境、release 和耗时；禁止包含正文、邮箱和认证 token。

## 6. 组件与数据流

```text
SpaceLaunchAnnouncement
  └─ localStorage 版本判断
       ├─ 稍后看看 → 记录已读并关闭
       └─ 立即登录 → 记录已读 → App 打开 AuthDialog

FeedbackFab textarea
  → useFeedback
  → feedbackApi
  → submit_feedback RPC
  → user_feedback
```

- `App` 负责组合认证状态、公告、登录弹窗和反馈 Hook。
- `SpaceLaunchAnnouncement` 不读取 Supabase，也不自行判断用户身份。
- `FeedbackFab` 不知道 Supabase 的存在，只调用 `onSubmitFeedback(content)`。
- 同步更新隐私政策的中日文「收集的信息」和「信息用途」，明确反馈正文会被保存并用于处理意见、排查问题和改进产品。

## 7. 测试与验收

### 数据库

- 未登录调用 RPC 被拒绝。
- 空白、超过 1000 字符被拒绝。
- 合法正文保存为 trim 后内容并绑定 `auth.uid()`。
- 60 秒内重复提交被拒绝。
- 日本自然日第 6 条被拒绝。
- 同一用户并发提交不能绕过限制。
- 不同用户互不影响。
- 客户端不能直接读取或写入表。

### 前端

- 未登录且未读时只显示一次公告。
- 已登录用户不显示公告。
- 关闭或点击登录后刷新不再显示同版本公告。
- 「立即登录」打开现有登录弹窗。
- 未登录点击反馈入口打开登录弹窗。
- 登录后反馈框只包含 textarea，不包含旧问卷字段。
- 成功提交清空并关闭，失败保留正文。
- 中日文、深色模式、键盘 Escape 和提交中禁用状态可用。

## 8. 非目标

- 不实现反馈回复、工单状态、附件、截图、公开反馈墙或管理员后台。
- 不发送反馈邮件。
- 不把公告阅读状态同步到不同设备。
- 不建立可动态编辑公告的数据库配置表。
