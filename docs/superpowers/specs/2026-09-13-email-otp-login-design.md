# 邮箱验证码登录设计

- 日期：2026-09-13
- 状态：待用户 Review
- 实施分支：`feature/email-otp-login`
- 基线：远程 `dev`（`83516d8`）

## 1. 目标

将现有邮箱 Magic Link 登录改为邮箱一次性验证码（Email OTP）登录。用户可以在电脑请求验证码、在手机查看邮件，再回到电脑输入验证码，不会因为点击手机邮件链接而把会话建立在错误设备上。

本阶段继续保留 Google 登录与 Resend SMTP，不新增密码登录、Edge Function、用户资料表或自建验证码表。

## 2. 用户体验

登录弹窗分为三个状态，状态之间在同一个弹窗内切换。

### 2.1 选择登录方式

弹窗首次打开时只展示：

- “邮箱验证码登录”
- “Google 登录”

不直接展示邮箱输入框，避免用户把“登录方式选择”和“邮箱验证步骤”混在一起。

### 2.2 输入邮箱

用户选择“邮箱验证码登录”后展示：

- 邮箱输入框
- “发送验证码”主按钮
- “返回登录方式”按钮

邮箱使用浏览器原生 `type="email"` 校验，提交前执行 `trim()`。新邮箱允许自动创建账号。

### 2.3 输入验证码

发送成功后展示：

- 验证码已发送到的邮箱
- 6 位数字验证码输入框
- “验证并登录”主按钮
- “更换邮箱”按钮
- “返回登录方式”按钮
- 60 秒重新发送倒计时；结束后显示可点击的“重新发送验证码”

验证码输入使用适合一次性验证码的自动填充提示，限制为数字和 6 位。用户粘贴包含空格或连字符的验证码时，只保留数字。

验证成功后由 Supabase 创建 session。现有认证状态监听器收到 session 后更新应用登录状态，弹窗关闭。

关闭弹窗再打开时回到“选择登录方式”，不保留上一次邮箱、验证码、倒计时或错误。

## 3. 技术方案选择

采用 Supabase 原生 Email OTP：

- 发送：`supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })`
- 验证：`supabase.auth.verifyOtp({ email, token, type: 'email' })`
- 邮件：由 Supabase 生成验证码，经已配置的 Resend SMTP 投递

### 3.1 方案对比

| 方案 | 优点 | 本项目中的问题 | 结论 |
| --- | --- | --- | --- |
| Supabase 原生 Email OTP | 复用现有 Auth、session 和用户表；无需新后端；前端 SDK 原生支持 | 需要手动修改远程邮件模板 | 采用 |
| 邮件同时提供链接与验证码 | 用户可以选择两种操作 | 登录路径含义不唯一，跨设备问题仍可能发生，测试和客服解释成本更高 | 不采用 |
| Edge Function 自建验证码 | 生成、发送、频率和模板完全可控 | 必须自行处理验证码哈希、过期、防刷、并发与密钥，增加安全责任 | 当前不采用 |

选择原生 OTP 的决定性原因是：当前项目已经使用 Supabase Auth，OTP 能沿用相同用户 ID、session 刷新与 RLS 权限体系；当前规模也没有自建验证码系统的业务必要。

接受的代价是邮件模板与 OTP 长度属于 Supabase 环境配置，代码部署不能自动保证远程 Dashboard 配置正确。因此上线清单必须明确验证模板。

可迁移规则：认证能力优先使用现有身份系统提供的原语；只有当产品规则无法由现有系统表达时，才承担自建认证逻辑的安全和运维成本。

## 4. 责任边界

### `src/api/authApi.ts`

- 唯一直接调用 Supabase Auth SDK 的模块。
- `sendEmailOtp(email)` 负责请求发送验证码。
- `verifyEmailOtp(email, token)` 负责验证验证码并建立 session。
- 将 Supabase 错误转换为项目统一的 `AppError`。
- 不保存 UI 步骤、倒计时或表单内容。

### `src/hooks/useSupabaseAuth.ts`

- 向页面暴露发送验证码与验证验证码两个业务动作。
- 管理认证请求错误。
- 继续通过 `onAuthStateChange` 同步 session 用户。
- 不直接渲染文案或控制登录弹窗步骤。

### `src/components/AuthDialog.tsx`

- 管理 `method → email → otp` 三个界面状态。
- 管理邮箱、验证码、pending 动作和 60 秒倒计时。
- 提供返回、更换邮箱与重新发送交互。
- 不直接调用 Supabase。

### `src/App.tsx`

- 把 hook 的动作传给 `AuthDialog`。
- 当认证用户出现时关闭弹窗。
- 不理解验证码验证细节。

### Supabase Auth 与 Resend

- Supabase 生成、保存并验证 OTP，创建用户与 session。
- Resend 只负责 SMTP 邮件投递，不负责验证码正确性。
- 不创建应用业务表，不编写数据库 migration。

## 5. 状态模型

弹窗步骤定义为联合类型：

```ts
type AuthDialogStep = 'methods' | 'email' | 'otp';
```

pending 动作单独定义，避免一个布尔值无法判断正在发送、验证、重发还是 Google 跳转：

```ts
type PendingAuthAction = 'google' | 'send-otp' | 'verify-otp' | 'resend-otp' | null;
```

倒计时仅用于前端交互节流，不是安全边界。真正的发送频率限制仍由 Supabase Auth 执行。刷新页面或重新打开弹窗可以清除前端倒计时，但不能绕过 Supabase 服务端限制。

## 6. 错误处理

| 场景 | 用户表现 | 状态保留 |
| --- | --- | --- |
| 首次发送失败 | 显示“验证码发送失败，请稍后重试” | 保留邮箱，停留邮箱步骤 |
| 发送过于频繁 | 显示“发送过于频繁，请稍后再试” | 保留邮箱，停留当前步骤 |
| 验证码错误或过期 | 显示“验证码无效或已过期” | 保留邮箱，清空验证码并聚焦输入框 |
| 验证网络失败 | 显示“网络异常，请重试” | 保留邮箱和验证码，停留验证码步骤 |
| 重发失败 | 显示发送错误 | 不重启 60 秒倒计时 |
| 重发成功 | 显示“验证码已重新发送” | 清空验证码，倒计时重置为 60 秒 |

为了避免泄露某个邮箱是否已经注册，界面不区分“新用户”和“已有用户”。

错误日志继续使用现有 `AppError.operationId`。认证日志不得包含邮箱全文、OTP、access token、refresh token 或 Supabase secret。若需要关联排障，仅记录事件名、错误码、环境和 operation ID。

建议事件名：

- `auth.email_otp.send.failed`
- `auth.email_otp.verify.failed`

## 7. Supabase 环境配置

`signInWithOtp` 发送链接还是验证码，由邮件模板决定，不是由前端方法名决定。

远程 Supabase Dashboard 中需要打开：

`Authentication → Email Templates → Magic Link`

模板正文必须展示：

```text
{{ .Token }}
```

并移除用于直接登录的 `{{ .ConfirmationURL }}`。邮件中可以保留 Nihongo Hub 品牌文案，但不得记录或转发验证码。

本地 `supabase/config.toml` 的邮箱 OTP 长度保持为 6，远程环境也配置为 6 位；否则前端长度校验会与服务端不一致。当前过期时间保持 Supabase 环境设置，不在前端写死“有效多少分钟”的承诺。

Google OAuth 配置与 Redirect URLs 不因本功能改变。

## 8. 测试范围

### API

- 发送 OTP 使用 `shouldCreateUser: true`。
- 验证使用 `{ email, token, type: 'email' }`。
- Supabase 错误转换为 `AppError`。

### Hook

- 发送和验证动作正确委托给 API。
- 失败时设置适合当前动作的错误。
- 验证成功后由认证状态监听器更新用户。

### AuthDialog

- 初始只展示两种登录方式。
- 点击邮箱方式进入邮箱步骤。
- 发送成功进入验证码步骤。
- 只接受最多 6 位数字。
- 验证按钮在不足 6 位时不可提交。
- 倒计时结束前不能重发。
- 重发成功清空验证码并重置倒计时。
- 可更换邮箱或返回方式选择。
- 关闭再打开时重置所有内部状态。
- Google 登录流程不回归。

### App 集成

- 正确传递发送、验证动作。
- 用户登录成功后关闭弹窗。

## 9. 不在本阶段实现

- 邮箱密码登录
- 手机短信验证码
- 自建验证码数据库
- Edge Function 认证代理
- CAPTCHA
- 多身份手动合并页面
- 修改 Google OAuth 流程
- 自动修改远程 Supabase Dashboard 或 Resend 配置

## 10. 验收标准

1. 登录弹窗首次打开只显示“邮箱验证码登录”和“Google 登录”。
2. 用户可以请求 6 位邮箱验证码，新邮箱验证成功后自动创建账号。
3. 用户可以在发起请求的原设备输入验证码并登录。
4. 60 秒内不能通过 UI 重复发送，倒计时结束后可以重发。
5. 用户可以更换邮箱或返回登录方式选择。
6. 登录成功后弹窗关闭，用户现有 Space 数据按相同 `auth.users.id` 加载。
7. Google 登录保持可用。
8. 日文与中文文案完整。
9. 日志不包含邮箱全文、验证码或 session token。
10. 单元测试、类型检查、lint 和生产构建通过。
