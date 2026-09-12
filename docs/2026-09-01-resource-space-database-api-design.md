# 日本語 HUB：资源、个人 Space、数据库与 API 设计

- 日期：2026-09-01
- 最后修订：2026-09-07
- 状态：设计已确认；schema、RLS、RPC、授权目录、个人 Space 页面与私人资源新增/编辑/删除界面已在隔离 worktree 实现并通过本地测试，生产环境连接尚未执行
- 适用范围：游客资源限制、登录、Mark、浏览历史、私人资源、个人 Space
- 技术路径：React + TypeScript + Supabase Auth/Postgres/RLS

## 0. 系统责任边界

本章是后续数据库、权限和 API 设计的总约束。实现与本章冲突时，应先修订设计并完成评审，不能由页面代码临时绕过。

文档中的规范词含义如下：

- **必须（MUST）**：安全性或数据一致性的硬性要求。
- **应当（SHOULD）**：默认执行；偏离时需要在代码评审中说明理由。
- **禁止（MUST NOT）**：任何实现层都不得绕过的限制。

### 0.1 组件职责与权威数据源

| 模块 | 负责 | 不负责 | 权威数据源 |
|---|---|---|---|
| React 页面与组件 | 渲染数据、收集输入、触发用户操作、显示反馈 | 拼接 Supabase 查询、判断最终权限、实现资源限额 | Hooks 返回的页面状态 |
| Hooks | 请求生命周期、缓存失效、加载/错误状态、可回滚的乐观更新 | 了解表结构、编写 RLS、决定数据库事务 | Service 返回结果 |
| `src/service/` | 业务流程编排、输入预校验、Space 合并与分组、把底层错误转为用户动作 | 充当最终安全边界、生成可信 `owner_id`、直接访问 Supabase | API 返回的领域对象 |
| `src/api/` | 前端访问 Supabase 的唯一入口；调用查询/RPC；映射数据库行、类型和错误码 | 页面布局、交互文案、跨页面状态 | Supabase 响应与生成的数据库类型 |
| `src/observability/` | 统一错误上报、脱敏、事件字段和 release 信息 | 决定业务恢复动作、记录私人内容 | `AppError` 与安全诊断上下文 |
| Supabase Auth | 登录、会话、签发身份；提供 `auth.uid()` | 资源业务规则和页面授权提示 | `auth.users` 与已验证会话 |
| PostgreSQL 表 | 持久化资源、Mark、历史等事实数据 | 页面展示顺序之外的视觉配置 | 表中已提交的数据 |
| RLS | 对每一行执行读取、修改和删除隔离 | 复杂多步业务编排、友好错误提示 | `auth.uid()` 与目标行 |
| Postgres RPC | 原子执行需要组合校验的读写：游客目录、私人资源及主题关联创建/修改、数量限制、重复检查、历史 upsert | 渲染 UI、调用浏览器能力 | 同一事务内的数据库状态 |
| 约束、唯一索引与 Trigger | 保证结构不变量、阻止精确重复、统一生成 `normalized_url` 和更新时间 | 决定“相似资源”如何展示、代替完整业务流程 | 数据库 schema |
| Supabase Dashboard 管理操作 | 维护首版公共资源 | 代表普通用户提交资源、绕过正式迁移修改生产结构 | 管理员身份与审计记录 |
| 外部资源网站 | 提供最终学习内容 | 保证链接永久有效、向本系统回传学习状态 | 外部网站自身 |

### 0.2 调用方向

应用代码只能沿以下方向依赖：

```text
UI → Hooks → Service → API → Supabase Auth / Postgres
```

- 页面与组件**禁止**直接调用 `supabase.from(...)` 或 RPC。
- Service **禁止**绕过 `src/api/` 直接访问 Supabase。
- API **禁止**依赖 React 组件、Hooks 或页面状态。
- 数据库错误由 API 映射为稳定错误码，Service 决定业务恢复动作，Hook 管理前端状态，UI 只负责呈现。

这条边界确保未来把某个 API 实现替换为 Edge Function 时，上层 Hook 和 UI 的调用契约可以保持不变。

### 0.3 信任边界

浏览器属于不可信环境。用户可以修改请求、绕过页面、重复发送请求，因此：

1. 客户端传入的 `user_id`、`owner_id`、计数、`normalized_url` 和权限结论一律不可信。
2. 用户身份必须由数据库中的 `auth.uid()` 获取；写入私人资源时由数据库赋予 `owner_id`。
3. `anon` key 可以出现在浏览器；`service_role` key **禁止**进入前端代码、构建产物和公开仓库。
4. 前端校验只用于即时反馈；权限、资源上限、精确重复和相似数量必须在实际写入的同一数据库事务中再次校验。
5. 其他用户的私人资源不得进入当前用户的查询结果、重复推荐或错误详情。
6. 200/30 是单账号存储约束，不能防止攻击者批量注册账号。首版接受该剩余风险并监控异常注册和写入；出现真实滥用后再引入 CAPTCHA、注册限制或服务端速率限制，不提前建设风控系统。

### 0.4 数据与权限不变量

以下规则必须由数据库保证，不能只靠 UI 约定：

1. `resources.owner_id IS NULL` 唯一表示公共资源；非空 UUID 唯一表示该用户的私人资源。公共资源可以关联多个主题，私人资源首版必须且只能关联一个主题。
2. 普通用户只能读写自己的私人资源；公共资源只有管理员可写。
3. 游客只能通过目录 RPC 获取每个主题排序最前的 6 条公共资源。
4. 每个用户的私人资源总数不得超过 200；限制值由数据库函数集中提供。
5. 用户创建或更新私人资源时，在“全部公共资源 + 当前用户私人资源”范围内发现完整 `url` 相同则拒绝该次写入，并返回已有资源作为推荐。管理员以后新增公共资源不会反向删除已有私人资源。
6. 同一用户具有相同 `normalized_url` 的私人资源最多 30 条；公共资源只参与相似推荐，不占用该限额。
7. Mark 只能指向公共资源；同一用户与资源最多一条 Mark。该规则由受控 RPC 和 RLS 共同保证。
8. 同一用户与资源最多一条浏览历史，通过原子 upsert 累计次数并更新最近访问时间。

### 0.5 失败处理边界

- 打开外部链接是主要动作；浏览历史写入失败不得阻止跳转，只记录可观测错误并允许后续重试。
- Mark 的乐观更新失败时，Hook 必须回滚星标并显示可操作提示。
- 私人资源创建或修改失败时，以 RPC 返回的稳定错误码为准；页面不得通过解析数据库原始错误文本判断业务分支。
- 数据库和外部链接故障不应导致页面泄露其他用户数据；安全失败默认拒绝访问。

### 0.6 首版明确不负责的事项

本阶段不包含用户公开资源、内容审核、社交分享、学习状态、独立学习路线实体、AI 推荐、微信登录和外部网站学习进度同步。未来增加这些能力时必须重新评审本章，尤其是内容审核、隐私边界和服务端密钥管理。

## 1. 已确认的产品规则

1. 游客在每个主题中只能读取排序最前的 6 条公共资源。
2. 登录用户可以读取全部公共资源。
3. 登录方式首版为邮箱魔法链接和 Google；微信登录放到后续版本。
4. 登录用户可以 Mark 公共资源。卡片右上角用星标表示 Mark，点击可取消。
5. 仅访问资源不会自动 Mark；访问行为只进入浏览历史。
6. 用户可以添加、编辑和删除自己的私人资源；私人资源仅本人可见。
7. Space 是单页个人资源地图，不需要创建单独的“学习路线”。
8. Space 顶部用单行横向滑动区域展示最近浏览历史。
9. Space 下方按现有主题竖向展示已 Mark 的公共资源和私人资源。
10. 没有内容的主题不显示；Space 不分页。
11. 首版不做公共投稿、审核后台、AI 自动路线、学习中/已完成状态。

## 2. 分层架构的具体落地

第 0 章定义了强制责任边界。本章用“点击星标”说明它如何落到代码中：

```text
ResourceCard
  → useResourceMark
    → resourceService.setMarked(resourceId, true)
      → resourceApi.upsertMark(resourceId)
        → Supabase / Postgres
```

各层在代码中的落点如下：

| 层 | 目录 | 职责 | 不应负责 |
|---|---|---|---|
| 页面与组件 | `src/pages/`、`src/components/` | 显示数据、接收点击、展示加载和错误状态 | 编写 `.from(...).select(...)` 数据库查询 |
| Hooks | `src/hooks/` | 管理页面状态、请求生命周期、乐观更新 | 知道数据库表结构和 RLS 细节 |
| Service | `src/service/` | 组合业务规则、校验输入、合并和分组 Space 数据 | 直接渲染 UI |
| API | `src/api/` | 封装 Supabase 查询和 RPC，把数据库行转换为应用类型 | 决定页面布局 |
| Supabase | Postgres、RLS、RPC | 保存数据、强制权限、执行原子写入 | 处理 React 状态 |

例如，页面只调用：

```ts
await setMarked(resource.id, true);
```

而不是在组件里写：

```ts
await supabase.from('resource_marks').insert(...);
```

这样做的价值是：

- 数据库字段变化时，主要修改 `src/api/`，不必逐个修改组件。
- 权限与 UI 解耦，组件不会因为一次查询写错而意外暴露数据。
- API 可以单独测试和替换。
- 将来若部分操作改走服务端函数，组件调用方式可以保持不变。

## 3. Edge Function 是什么

Edge Function 是部署在 Supabase 服务器端的轻量函数。浏览器不是直接操作表，而是先请求函数，由函数完成校验、数据库写入或调用第三方服务，再返回结果。

```text
浏览器 → Edge Function → Postgres / 第三方 API
```

适合使用 Edge Function 的场景包括：

- 必须保存密钥，不能把密钥放进浏览器。
- 一次操作需要修改多张表并执行复杂业务规则。
- 接入微信等需要服务端适配的认证流程。
- 资源公开投稿需要审核、风控或管理员通知。
- 生成 AI 学习建议或调用付费第三方 API。

当前首版的读取资源、Mark、浏览历史和私人资源 CRUD 都可以安全地由 Supabase SDK + RLS + Postgres RPC 完成，不需要 Edge Function。设计中保留 API 层，是为了未来替换底层实现时不重写页面，并不意味着现在必须使用 Edge Function。

## 4. TypeScript 类型从哪里来

文档里的 `type` 是前端与 API 之间的数据契约，不是凭空产生的变量。它应从数据库 schema 派生，再根据页面需要转换成更适合 UI 使用的结构。

建议在正式迁移后使用 Supabase CLI 从数据库生成原始类型：

```text
Postgres schema
  → 自动生成 Database 类型
    → API 层映射
      → ResourceRecord、SpaceSection 等应用类型
```

### 三种 ID 分别使用什么类型

本项目采用三种不同用途的 ID：

```ts
type ResourceId = number;
type ResourceCategory =
  | 'basic'
  | 'exam'
  | 'listening'
  | 'speaking'
  | 'reading'
  | 'writing'
  | 'tools'
  | 'japan'
  | 'weekly';
type UserId = string;
```

- 资源 ID 使用 PostgreSQL 自增 `bigint`。资源插入同一个数据库时由数据库自动分配，不由浏览器生成或传入。
- 资源主题使用 PostgreSQL `resource_category` enum，保存在资源与主题的关联表中；前端对应为 `ResourceCategory` 字符串联合类型。
- 用户 ID 使用 Supabase Auth 原生 UUID。UUID 经 JSON 返回到 JavaScript 后表现为 `string`。

资源主键定义为：

```sql
id bigint generated always as identity primary key
```

插入资源时不提交 `id`，数据库写入成功后通过 `returning id` 返回生成值。当前项目只有一个生产数据真源，公共资源由 Dashboard 维护，私人资源也直接写入同一个数据库，因此不需要为跨数据库离线合并提前生成 UUID。

PostgreSQL `bigint` 的理论范围大于 JavaScript 安全整数范围，但本项目的资源数量不可能接近 `Number.MAX_SAFE_INTEGER`。正式实现仍以 Supabase CLI 自动生成的数据库类型为准；如果客户端生成类型将该字段表示为字符串，API 映射层再统一转换或保留字符串，组件不自行猜测。

## 5. 数据库设计

### 5.0 键与约束标记说明

| 标记 | 英文 | 含义 |
|---|---|---|
| `PK` | Primary Key | 主键，唯一标识表中的一行；不能为空、不能重复 |
| `FK` | Foreign Key | 外键，引用另一张表的主键，保证关联对象真实存在 |
| `UQ` | Unique | 唯一约束，禁止出现重复值或重复组合 |
| `NN` | Not Null | 非空约束，插入时必须提供有效值 |
| `CK` | Check | 检查约束，要求数据满足指定业务条件 |
| `DF` | Default | 默认值，调用方未提供时由数据库自动填写 |

一个字段可以同时拥有多个标记。例如 `resource_marks.user_id` 同时是联合主键的一部分和外键，因此标记为 `PK, FK`。

### 5.1 `resource_category` enum

```sql
create type public.resource_category as enum (
  'basic',
  'exam',
  'listening',
  'speaking',
  'reading',
  'writing',
  'tools',
  'japan',
  'weekly'
);
```

主题的中日文名称、图标和显示顺序继续由前端 `src/data/categories.ts` 管理。

### 5.2 `resources`

统一保存公共资源和私人资源。这里一行代表一个可访问的资源实体；资源出现在哪些主题、在主题中的顺序，由 `resource_categories` 单独记录。

| 字段 | PostgreSQL 类型 | 键/约束 | 约束说明 | 数据示例 |
|---|---|---|---|---|
| `id` | `bigint` | `PK` | 自增：`generated always as identity` | `301` |
| `owner_id` | `uuid` | `FK` | 可空；引用 `auth.users.id ON DELETE CASCADE`；`NULL` 表示公共资源，UUID 表示该用户的私人资源 | 公共资源：`NULL`；私人资源：`6fda32b8-67a1-4b7e-b427-10a38c3d550c` |
| `name` | `text` | `NN, CK` | trim 后 1～120 字符 | `NHK Easy News` |
| `description` | `text` | `NN, CK` | trim 后 1～500 字符 | `带有注音和音频的简明日语新闻` |
| `url` | `text` | `NN, CK` | trim 后 1～2048 字符，只接受 HTTP(S) | `https://www3.nhk.or.jp/news/easy/` |
| `normalized_url` | `text` | `NN` | 相似资源的来源主机键，由数据库 URL 标准化函数根据 `url` 生成 | `www3.nhk.or.jp` |
| `tags` | `text[]` | `NN, DF, CK` | 默认空数组；最多 10 项，每项 trim 后 1～30 字符 | `{"beginner","news"}` |
| `created_at` | `timestamptz` | `NN, DF` | 默认 `now()` | `2026-09-01T10:30:00+09:00` |
| `updated_at` | `timestamptz` | `NN, DF` | 默认 `now()`，trigger 自动更新 | `2026-09-01T14:45:00+09:00` |

资源类型由 `owner_id` 唯一确定：

| `owner_id` 状态 | 资源类型 | 首版权限 |
|---|---|---|
| `NULL` | 公共资源 | 只有 Dashboard 管理员可以新增、修改和删除 |
| 当前用户 UUID | 该用户的私人资源 | 只有该用户可以读取、修改和删除 |

#### URL 重复与相似资源规则

精确重复和相似推荐的搜索范围是全部公共资源和当前用户自己的私人资源，不读取或暴露其他用户的私人资源。30 条限额的计数范围不同：只统计 `owner_id = auth.uid()` 且 `normalized_url` 相同的私人资源，公共资源只用于推荐，不占用用户额度。

| 比较结果 | 保存规则 | 给用户的操作 |
|---|---|---|
| `url` 完全相同 | 禁止新增 | 推荐已有资源；公共资源提供“直接 Mark”，私人资源提供“查看已有资源” |
| `url` 不同、`normalized_url` 相同 | 本人同组私人资源不足 30 条时允许继续 | 先展示公共资源和本人私人资源，用户确认后继续保存 |
| `url` 不同、`normalized_url` 相同，本人已有 30 条私人资源 | 禁止新增 | 展示相似推荐，但公共资源数量不影响该限额 |
| `normalized_url` 不同 | 允许保存 | 正常创建私人资源 |

`url` 在保存前会去除首尾空白并通过 URL 解析器校验；完全相同是指清理后的完整 URL 字符串相同。数据库 trigger 在插入或修改前调用统一标准化函数生成 `normalized_url`，客户端不能自行指定该字段。首版标准化键取小写主机名、忽略协议并移除普通 `www.` 前缀，例如阅读页与听力页虽然完整 URL 不同，但同属 `example.com`。这样符合“同一来源先推荐、仍允许保存不同直达链接”的需求；代价是 YouTube 等大型平台会被归为同一来源，后续若误报明显，再升级为可配置的来源识别规则。`normalized_url` 不建立唯一约束，只建立普通查询索引。

公共资源可以通过数据库部分唯一索引避免管理员重复写入完全相同的 URL：

```text
UNIQUE(url) WHERE owner_id IS NULL
```

同一用户的私人资源可以通过数据库部分唯一索引避免并发产生完全相同的 URL：

```text
UNIQUE(owner_id, url) WHERE owner_id IS NOT NULL
```

“当前用户准备保存的 URL 与某条公共资源完全相同”横跨公共和私人两个集合，由创建私人资源的数据库 RPC 在写入前检查并拒绝。

#### 私人资源数量限制

- 每个用户最多保存 200 条私人资源。
- 不设置每日新增限制。
- 限制值由数据库函数集中返回，不增加配置表。
- 创建私人资源必须通过数据库 RPC；RPC 在同一事务中检查总量、精确重复和本人同组私人资源数量。

```sql
private_resource_limit() returns integer   -- 200
similar_resource_limit() returns integer   -- 30
```

限制值改变时使用数据库 migration 执行 `create or replace function`，前端从 API 返回值读取限制，不另外写死数字。

### 5.3 `resource_categories`

记录“资源放在哪个主题”的关系。同一个公共资源只在 `resources` 保存一次，但可以拥有多条主题关系。

| 字段 | PostgreSQL 类型 | 键/约束 | 约束说明 | 数据示例 |
|---|---|---|---|---|
| `resource_id` | `bigint` | `PK, FK` | 联合主键的一部分；引用 `resources.id ON DELETE CASCADE` | `301` |
| `category` | `resource_category` | `PK` | 联合主键的一部分；取值由 enum 限制 | `listening` |
| `sort_order` | `integer` | `NN, DF, CK` | 默认 0，必须为非负整数；表示该资源在当前主题内的顺序 | `1` |

主键 `(resource_id, category)` 防止同一资源在同一主题重复出现。公共资源允许关联多个主题。首版私人资源必须且只能关联一个主题；该业务约束由后续的创建/修改 RPC 在同一事务中维护，普通用户没有直接写关联表的权限。

这里不再增加 `categories` 配置表：主题集合固定且改动需要随代码发布，enum 已能提供数据库约束；主题名称、图标和页面顺序仍由前端维护。关联表的必要性来自“一个资源可以属于多个主题”，而不是为了把 enum 再做成一张表。

### 5.4 `resource_marks`

只记录用户对公共资源的二元 Mark。

| 字段 | PostgreSQL 类型 | 键/约束 | 约束说明 | 数据示例 |
|---|---|---|---|---|
| `user_id` | `uuid` | `PK, FK` | 联合主键的一部分；引用 `auth.users.id ON DELETE CASCADE` | `6fda32b8-67a1-4b7e-b427-10a38c3d550c` |
| `resource_id` | `bigint` | `PK, FK` | 联合主键的一部分；引用 `resources.id`，删除资源时级联删除 | `301` |
| `marked_at` | `timestamptz` | `NN, DF` | 默认 `now()` | `2026-09-01T15:10:00+09:00` |

主键：`(user_id, resource_id)`。重复 Mark 使用 upsert，不产生重复行。

普通外键只能证明资源存在，不能证明它是公共资源。因此 Mark 的新增与取消必须调用 `set_resource_mark` RPC：RPC 从 `auth.uid()` 取得用户身份，并在写入前确认目标资源满足 `owner_id IS NULL`。普通用户没有该表的直接写权限；RLS 仍限制本人数据并要求关联资源为公共资源，形成纵深防御。

### 5.5 `resource_history`

每个用户与资源只保留一条汇总记录，防止浏览日志无限追加。

| 字段 | PostgreSQL 类型 | 键/约束 | 约束说明 | 数据示例 |
|---|---|---|---|---|
| `user_id` | `uuid` | `PK, FK` | 联合主键的一部分；引用 `auth.users.id ON DELETE CASCADE` | `6fda32b8-67a1-4b7e-b427-10a38c3d550c` |
| `resource_id` | `bigint` | `PK, FK` | 联合主键的一部分；引用 `resources.id ON DELETE CASCADE` | `301` |
| `visit_count` | `integer` | `NN, DF, CK` | 默认 1，必须大于 0 | `7` |
| `first_visited_at` | `timestamptz` | `NN, DF` | 默认 `now()`，首次访问时间 | `2026-08-20T19:15:00+09:00` |
| `last_visited_at` | `timestamptz` | `NN, DF` | 默认 `now()`，最近访问时间 | `2026-09-01T15:20:00+09:00` |

主键：`(user_id, resource_id)`。每次点击执行原子 upsert：已有行就增加 `visit_count` 并更新时间。

### 5.6 删除行为

- 删除私人资源时，级联删除它的主题关系和浏览历史。
- 删除公共资源时，级联删除它的主题关系、相关 Mark 和历史；该操作仅管理员在 Dashboard 中执行。
- 删除账号的用户数据清理由 `user_id` 外键级联完成。

### 5.7 索引

至少建立：

```text
resource_categories(category, sort_order, resource_id)
resources(owner_id, created_at desc, id) where owner_id is not null
resources(normalized_url) where owner_id is null
resources(owner_id, normalized_url) where owner_id is not null
resource_history(user_id, last_visited_at desc, resource_id)
unique resources(url) where owner_id is null
unique resources(owner_id, url) where owner_id is not null
```

选择依据是实际查询的“筛选列在前、排序列在后”，并用部分索引排除无关行：

- 公共目录和 Space 都先按 `resource_categories.category` 找到主题内的资源，再按 `sort_order, resource_id` 稳定排序；同一索引也支持一个资源出现在多个主题。
- 私人资源查询先按 `resources.owner_id` 隔离用户，再按 `created_at DESC, id` 稳定排序；主题筛选通过关联表完成。
- 两个 `normalized_url` 索引分别服务公共资源和当前用户私人资源的相似推荐，避免扫描其他用户数据。
- 历史先锁定 `user_id`，再按最近访问时间倒序读取前 30 条；`resource_id` 用作时间相同时的稳定排序键。
- 两个部分唯一索引是精确 URL 防重的最后防线；跨“公共 + 当前用户私人”集合的重复仍由受控 RPC 检查。

`resource_marks` 的主键 `(user_id, resource_id)` 已能支持“查询某用户全部 Mark”。首版不按 `marked_at` 排序，因此不额外建立 `(user_id, marked_at)` 索引；只有未来增加“最近 Mark”功能并由 `EXPLAIN ANALYZE` 证明有需要时再添加。索引会增加写入和存储成本，不应仅因某列可能被查询就预先创建。

## 6. 权限设计（RLS）

RLS 是 PostgreSQL 的行级权限。即使用户绕过 React 页面直接调用 Supabase REST API，数据库仍会按每一行判断是否允许读取或修改。

### 6.1 权限矩阵

| 操作 | 游客 `anon` | 登录用户 `authenticated` | Dashboard 管理员 |
|---|---|---|---|
| 读取公共资源 | 仅通过预览 RPC，每类前 6 条 | 全部 | 全部 |
| 新增/修改/删除公共资源 | 禁止 | 禁止 | 允许 |
| 读取私人资源 | 禁止 | 仅本人 | 全部 |
| 新增私人资源 | 禁止 | 仅通过受控 RPC 写入本人名下 | 允许 |
| 修改私人资源 | 禁止 | 仅通过受控 RPC 修改本人资源 | 允许 |
| 删除私人资源 | 禁止 | 仅本人 | 允许 |
| 读取/写入 Mark | 禁止 | 仅本人 | 允许 |
| 读取/写入历史 | 禁止 | 仅本人 | 允许 |

`resources` 的 RLS 以 `owner_id` 为判断依据：

- 公共读取条件：`owner_id IS NULL`。
- 私人读取、修改和删除条件：`owner_id = auth.uid()`。
- 普通用户没有对 `resources` 表的直接 `INSERT`、`UPDATE` 权限；新增和修改必须通过受控 RPC，以强制执行重复检查和数量限制。
- 新增和修改 RPC 只能写入 `owner_id = auth.uid()` 的资源，不能创建或修改 `owner_id IS NULL` 的公共资源。
- 首版没有普通用户将私人资源公开的 policy 或 API。

### 6.2 为什么游客不能直接读取 `resources`

如果允许游客直接 `SELECT` 全部公共资源，再由 React 用 `slice(0, 6)` 隐藏，用户可以直接调用 API 拿到所有数据。正确做法是：

1. 不给 `anon` 角色直接读取 `resources` 的 policy。
2. 给 `anon` 角色执行 `get_catalog_snapshot` RPC 的权限。
3. RPC 在数据库中对每个主题使用窗口排序，只返回前 6 条。
4. RPC 可以另行返回总数和锁定数量，但不返回被锁定资源的字段。

### 6.3 RPC 安全要求

- `SECURITY DEFINER` 函数必须固定 `search_path`。
- 创建后执行 `REVOKE EXECUTE ... FROM PUBLIC`。
- 只向需要的 `anon` 或 `authenticated` 角色授权。
- 函数内部使用 `auth.uid()` 判断身份，不接受客户端传入 `user_id`。
- 所有资源 ID 都重新验证可见性，不能只相信客户端参数。

### 6.4 首版 RPC 合约

| RPC | 可执行角色 | 关键参数 | 返回/错误 |
|---|---|---|---|
| `get_catalog_snapshot()` | `anon`, `authenticated` | 无 | 游客每主题最多 6 条；登录用户返回全部公共主题位置 |
| `set_resource_mark(p_resource_id, p_marked)` | `authenticated` | 公共资源 ID、目标状态 | 成功返回 `void`；私人资源抛出 `RESOURCE_NOT_PUBLIC` |
| `record_resource_visit(p_resource_id)` | `authenticated` | 当前用户可见的资源 ID | 原子 upsert；不可见资源抛出 `RESOURCE_NOT_VISIBLE` |
| `find_similar_resources(p_url, p_exclude_resource_id default null)` | `authenticated` | 待检查 URL、更新时排除的资源 ID | 最多 10 条公共资源和本人私人资源，不返回其他用户私人资源 |
| `create_private_resource(...)` | `authenticated` | 主题、字段、是否看过相似推荐 | 返回下表中的稳定 JSON 状态 |
| `update_private_resource(...)` | `authenticated` | 本人资源 ID、主题、字段、确认状态 | 与创建使用相同重复/相似规则；越权抛出 `RESOURCE_NOT_OWNED` |
| `private_resource_limit()` | `authenticated` | 无 | `200` |
| `similar_resource_limit()` | `authenticated` | 无 | `30` |

创建和更新 RPC 的预期结果状态：

| `status` | 含义 |
|---|---|
| `saved` | 创建或更新成功，响应包含 `resourceId` |
| `invalid_input` | 必填字段、URL、长度或标签不符合数据库规则 |
| `exact_url_exists` | 公共资源或本人私人资源已有完全相同 URL，并返回推荐 |
| `similar_review_required` | 存在同源推荐，必须先让用户确认 |
| `private_limit_reached` | 本人私人资源已达到 200 条 |
| `similar_limit_reached` | 本人同一来源的私人资源已达到 30 条；公共资源不参与计数 |

判断顺序为：输入校验 → 用户级事务锁 → 精确重复 → 总量 → 同源数量 → 是否完成相似推荐确认 → 写入。精确重复先于容量判断，确保响应丢失后的同 URL 重试仍得到 `exact_url_exists`，而不是误报容量已满。

首版“Dashboard 管理员”指使用 Supabase Dashboard 或仅存在于受信服务端的 `service_role`。应用内不建立管理员角色表或管理员登录入口；浏览器构建中绝不能出现 `service_role` key。

## 7. API 设计

### 7.1 应用类型

```ts
// API 层根据 owner_id 是否为空推导，不是数据库字段。
export type ResourceSource = 'public' | 'private';
export type ResourceCategory =
  | 'basic'
  | 'exam'
  | 'listening'
  | 'speaking'
  | 'reading'
  | 'writing'
  | 'tools'
  | 'japan'
  | 'weekly';

export interface ResourceRecord {
  id: number; // 数据库自增 bigint；最终以 Supabase 生成类型为准
  category: ResourceCategory; // 来自 resource_categories 的当前主题位置
  name: string;
  description: string;
  url: string;
  tags: string[];
  source: ResourceSource;
  marked: boolean;
  sortOrder: number;
}

export interface CategoryCatalog {
  category: ResourceCategory;
  resources: ResourceRecord[];
  totalCount: number;
  lockedCount: number;
}

export interface HistoryItem {
  resource: ResourceRecord;
  visitCount: number;
  lastVisitedAt: string; // timestamptz 的 ISO 8601 字符串
}

export interface SpaceSection {
  category: ResourceCategory;
  resources: ResourceRecord[];
}

export interface PrivateResourceInput {
  category: ResourceCategory;
  name: string;
  description: string;
  url: string;
  tags: string[];
}

export interface SimilarResourceMatch {
  resource: ResourceRecord;
  matchType: 'exact_url' | 'same_normalized_url';
}

export type SavePrivateResourceResult =
  | { status: 'saved'; resourceId: ResourceId }
  | { status: 'invalid_input' }
  | { status: 'exact_url_exists'; recommendations: SimilarResourceMatch[] }
  | { status: 'similar_review_required'; recommendations: SimilarResourceMatch[] }
  | { status: 'similar_limit_reached'; recommendations: SimilarResourceMatch[] }
  | { status: 'private_limit_reached'; current: number; limit: number };

export interface AppError extends Error {
  code: AppErrorCode;
  operationId: string;
  retryable: boolean;
}
```

`ResourceRecord` 是面向页面的查询结果，不是 `resources` 表的逐列复制。API 会把 `resources` 与 `resource_categories` 联查后补上 `category` 和 `sortOrder`。因此同一个公共资源 ID 可以在不同主题结果中出现；它们共享同一个 Mark 状态和浏览历史。

创建或更新成功只返回 `resourceId`，随后由 Hook 使 Space 查询缓存失效并重新读取。这里不为了返回整张卡片再增加一次数据库查询：Space 才是私人资源展示状态的真源，重新读取也能同时得到最终主题顺序和其他并发变化。

### 7.2 文件边界

```text
src/api/
├── supabaseClient.ts
├── apiError.ts
├── authApi.ts
├── resourceCatalogApi.ts
└── resourceApi.ts

src/service/
├── catalogService.ts
└── spaceService.ts

src/observability/
└── errorReporter.ts
```

首版按领域合并 Mark、History 和私人资源 API，减少小文件之间的跳转；当单个文件超过约 300 行、出现两个以上独立变化原因，或多人并行开发频繁冲突时再拆分。`authApi.ts` 是认证访问 Supabase 的唯一入口，Hooks 不直接导入 Supabase client。选择这个粒度是为了保留分层边界，同时避免为尚未出现的团队规模提前拆分。

Review 5 已删除 `userDataApi.ts` 的旧 `user_resources` 兼容路径。Review 6 已删除 `catalogApi.ts`、旧静态搜索函数和浏览器 bundle 中的静态资源副本；`src/data/categories.ts` 只保留主题名称键与图标等视觉 metadata。公共资源的唯一内容真源是数据库，目录查询统一由 `resourceCatalogApi.ts` 承担。

首版请求生命周期使用 React 原生 Hook 管理 `loading`、`error`、`retry` 和过期响应抑制，不新增 TanStack Query 或 SWR。当前只有目录与 Space 两个读取入口，原生实现的依赖和概念最少；接受的代价是两个 Hook 可能分别读取目录。未来出现三个以上页面共享同一数据、明显重复请求、后台自动刷新或复杂缓存失效时，优先迁移到 TanStack Query；SWR 更轻，但本项目后续的多类 mutation 与精确缓存失效更适合 TanStack Query。

### 7.3 Catalog API

```ts
fetchCatalog(): Promise<CategoryCatalog[]>
searchVisibleCatalog(query: string, catalog: CategoryCatalog[]): ResourceRecord[]
```

`fetchCatalog` 调用 `get_catalog_snapshot` RPC。身份从当前 Supabase session 获取，不接受 `userId` 参数，避免调用方冒充其他用户。

`searchCatalog` 的权限与目录读取完全一致。API 只搜索数据库已经授权返回的目录结果；登录用户的私人资源由 `spaceService` 合并后参与页面搜索：

- 游客只能搜索每个主题可见的 6 条。
- 登录用户可以搜索全部公共资源和自己的私人资源。
- 查询文本 trim 后为空则直接返回空数组。
- 最多返回 100 条，防止过大响应。

### 7.4 Mark API

```ts
setResourceMark(resourceId: number, marked: boolean): Promise<void>
```

- `marked = true`：upsert `(auth.uid(), resourceId)`。
- `marked = false`：删除当前用户对应行。
- 两种操作都通过 `set_resource_mark` RPC；数据库确认目标存在且 `owner_id IS NULL`。
- 撤销普通用户对 `resource_marks` 的直接 `INSERT/DELETE` 权限；RLS 仍对表访问执行本人数据和公共资源检查，作为纵深防御。
- Hook 可以先乐观更新星标；失败时恢复原状态并显示错误。

### 7.5 History API

```ts
recordResourceVisit(resourceId: number): Promise<void>
fetchRecentHistory(limit?: number): Promise<HistoryItem[]>
```

- `recordResourceVisit` 调用数据库 RPC，原子增加次数。
- 只允许记录当前用户有权读取的资源。
- 记录失败不能阻止外部链接打开。
- `fetchRecentHistory` 默认 30 条，最大 100 条。

浏览历史只记录登录用户。游客不写数据库，也不使用匿名指纹追踪。

### 7.6 Private Resource API

```ts
findSimilarResources(url: string): Promise<SimilarResourceMatch[]>

createPrivateResource(
  input: PrivateResourceInput,
  options: { similarResourcesReviewed: boolean },
): Promise<SavePrivateResourceResult>

updatePrivateResource(
  resourceId: number,
  input: PrivateResourceInput,
  options: { similarResourcesReviewed: boolean },
): Promise<SavePrivateResourceResult>

deletePrivateResource(resourceId: number): Promise<void>
```

创建流程：

1. 用户第一次点击保存时直接调用 `createPrivateResource(..., { similarResourcesReviewed: false })`，避免一次独立预查询与实际写入之间出现竞态。
2. RPC 在同一事务中查询全部公共资源和当前用户私人资源；精确匹配排在最前，相同 `normalized_url` 的结果随后展示。推荐响应最多返回 10 条，但该返回上限不等于私人资源限额。
3. 存在完全相同的 `url` 时不显示“仍然保存”，只允许直接 Mark 公共资源或查看已有私人资源。
4. 只有相同 `normalized_url` 时，RPC 返回 `similar_review_required`；用户看过推荐后可以选择“仍然保存”，前端再调用 `createPrivateResource(..., { similarResourcesReviewed: true })`。
5. `createPrivateResource` 不能信任前端预检查结果；数据库 RPC 在写入事务中重新检查完全相同 URL、本人同组私人资源 30 条上限和本人私人资源总量 200 条上限。
6. `similarResourcesReviewed` 只代表交互确认，不替代数据库安全检查。
7. 更新现有私人资源时，相似和重复检查必须排除当前正在编辑的 `resourceId`，并使用与创建相同的用户级事务锁。

Service 层校验：

- 名称和 URL 必填。
- URL 必须是 `http:` 或 `https:`。
- 名称、描述和标签有长度限制。
- 标签 trim、去空、去重，最多 10 个。

数据库层再次通过约束和 RLS 校验。客户端不传 `owner_id`；API 使用当前认证用户，避免伪造所有者。

所有需要用户身份的前端 API 都不接受 `userId` 参数。API 从当前 Supabase session 发起请求，数据库最终只信任 `auth.uid()`。如果同一次创建因响应丢失而被重试，RPC 遇到精确重复后返回已有资源；Service 将其解释为“资源已存在，可直接查看”，不新增首版幂等记录表。

### 7.7 Space API

`useSpace` 并行读取：

1. 最近 30 条浏览历史。
2. 当前用户的 Mark 及对应公共资源。
3. 当前用户的私人资源。

`spaceService` 把三个结果组合成 `SpaceSnapshot`，按前端 `src/data/categories.ts` 中的既定主题顺序分组和排序，并过滤空主题。`SpacePage` 只消费该快照，不调用 API：顶部历史为单行横向滚动，下方主题 section 竖向排列且不分页。未登录时 `useSpace(false)` 不读取个人数据；失败时显示重试而不是空状态。

### 7.8 错误类型

API 层应把 Supabase 错误映射成应用可识别的错误：

```ts
type AppErrorCode =
  | 'AUTH_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'EXACT_URL_EXISTS'
  | 'SIMILAR_RESOURCE_LIMIT_REACHED'
  | 'PRIVATE_RESOURCE_LIMIT_REACHED'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';
```

- `AUTH_REQUIRED`：打开登录弹窗。
- `EXACT_URL_EXISTS`：禁止新增并展示已有资源推荐。
- `SIMILAR_RESOURCE_LIMIT_REACHED`：本人具有相同标准化 URL 的私人资源已有 30 条，禁止新增并展示推荐。
- `PRIVATE_RESOURCE_LIMIT_REACHED`：私人资源已达到 200 条。
- `NETWORK_ERROR`：保留当前表单内容，允许重试。
- `FORBIDDEN`：不自动重试，记录诊断信息但不展示数据库细节。

API 每次操作生成 `operationId`，把 Supabase 返回错误映射为 `AppError` 后再抛给 Service。调用 Auth SDK 时必须检查返回对象中的 `error` 字段，不能只依赖 `try/catch`；[Supabase Auth 官方示例](https://supabase.com/docs/reference/javascript/auth-signinwithoauth)同样使用 `{ data, error }` 接收结果。UI 使用稳定的 `code` 决定提示，日志使用 `operationId` 关联同一次操作。

## 8. 数据库操作文件

正式实现时创建：

```text
supabase/
├── migrations/
│   ├── 202609010001_create_resource_schema.sql
│   ├── 202609010002_create_resource_indexes_triggers.sql
│   ├── 202609010003_create_resource_rls.sql
│   └── 202609010004_create_resource_rpcs.sql
├── migrations/202609090001_initialize_public_resources.sql
├── seed.sql                         # 保留为空，仅作为本地开发扩展入口
└── README.md
```

各文件职责：

1. `create_resource_schema.sql`：枚举、表、主外键、检查约束。
2. `create_resource_indexes_triggers.sql`：索引、URL 规范化、`updated_at` trigger。
3. `create_resource_rls.sql`：启用 RLS、创建 policies、撤销多余权限。
4. `create_resource_rpcs.sql`：游客目录读取、Mark、原子浏览记录、相似资源查询、私人资源创建/更新及数量限制函数。
5. `202609090001_initialize_public_resources.sql`：正式公共资源的版本化初始化；`seed.sql` 不承载生产数据。
6. `README.md`：本地执行、验证、回滚和远端应用步骤。

这些 SQL 文件必须先经过人工评审和本地 Supabase 验证；在获得确认前，不对远端数据库执行任何迁移。

### 8.1 首次建库与回滚边界

当前生产环境只有前端静态资源，没有需要迁移的数据库或用户数据。代码仓库中现有的 `user_resources`、`checkins` 调用属于未形成生产数据的早期代码，不作为旧数据源，也不设计数据迁移或双写。

1. 在本地 Supabase 空库执行全部 migration，验证 schema、RLS、RPC 和测试。
2. 通过版本化 migration 将当前公共资源导入新 `resources` 表，并核对分类、数量、排序和 URL；远程部署不使用 `--include-seed`。
3. 远端首次建库后再次执行相同核对，再发布使用新 API 的前端。
4. 上线观察期内保留前端静态公共资源作为代码级回滚路径，但不同时向静态数据和数据库双写。
5. 如需回滚，只将前端切回静态公共资源；新建数据库及上线后产生的用户数据保持不动，修复后继续使用，禁止通过回滚部署删除用户数据。
6. 稳定后删除仓库中废弃的 `user_resources` 资源路径；`checkins` 不属于本功能，是否保留另行评审。

因为不存在旧数据，备份旧表、数据映射、只读保留期和双写都会制造没有实际对象的工作，首版明确不实施。

## 9. 其他实施决定

1. 删除私人资源前显示二次确认。
2. Space 内同一主题先展示按创建时间倒序排列的私人资源，再展示按原目录顺序排列的已 Mark 公共资源。
3. 浏览历史为每个用户与资源保留一条汇总记录；Space 只查询最近访问的 30 条。
4. 首版不提供自助注销账号入口；确需删除账号时由管理员处理，并级联删除该用户数据。

## 10. 前端数据流

### 10.1 目录加载

```text
页面打开
→ useCatalog()
→ catalogService
→ resourceCatalogApi.fetchCatalog()
→ get_catalog_snapshot RPC
→ 游客每类 6 条 / 登录用户完整数据
```

### 10.2 Mark

```text
点击星标
→ UI 先切换星标状态
→ setResourceMark()
→ 成功：保留
→ 失败：恢复原状态并提示
```

### 10.3 打开资源

浏览器先打开已经校验为 HTTP(S) 的外部 URL，再异步记录浏览历史。新标签页必须使用 `noopener,noreferrer`，防止外部网站通过 `window.opener` 控制原页面。历史写入失败不能阻止或延迟用户访问资源。

### 10.4 添加私人资源

```text
填写 URL
→ createPrivateResource(reviewed=false)
→ RPC 原子检查完全相同 URL、总量和同源数量
→ 完全相同：禁止新增，推荐已有资源
→ 仅 normalized_url 相同：展示推荐
→ 用户确认后 createPrivateResource(reviewed=true)，RPC 再次检查
→ 创建成功后加入 Space 对应主题
```

## 11. 并发一致性

如果两个创建请求同时读到 199 条后分别插入，总量可能变成 201。因此创建和更新 RPC 都必须在事务中获取当前用户维度的事务锁，再依次检查总量、完全相同 URL 和本人相同 `normalized_url` 的私人资源数量：

```sql
pg_advisory_xact_lock(...)
```

同一用户的并发创建和更新请求会短暂排队。锁必须基于数据库会话中的 `auth.uid()` 计算，不能信任客户端传入用户 ID。更新检查排除当前资源 ID。删除不会突破数量上限，继续由普通 RLS 删除完成，不为它增加不必要的事务锁。

30 条是用户私人资源的写入门槛，不是公共与私人推荐结果的总量上限。管理员新增公共资源不获取用户级锁，也不占用或改变用户的私人资源额度。

## 12. 错误与交互处理

- 未登录：打开登录弹窗并保留当前 URL。
- 完全重复：不创建，展示已有资源推荐。
- 本人同组私人资源达到 30 条：不创建，并展示公共资源和本人私人资源候选。
- 私人资源达到 200 条：提示先删除旧资源。
- 网络失败：保留表单内容并允许重试。
- 权限失败：不展示数据库原始错误信息。
- 浏览历史写入失败：不影响打开外部链接。
- 删除私人资源：执行前二次确认。

## 13. 日志与可观测性

目标不是保存尽可能多的日志，而是在不泄露私人数据的前提下，能快速回答：哪个版本、哪个操作、哪类用户、在哪一层、因为什么失败。

### 13.1 首版工具选择

采用三类现有职责互补的工具：

| 工具 | 首版用途 | 不用于 |
|---|---|---|
| Sentry 前端 SDK | 捕获未处理异常、API 失败上下文和发布版本 | 产品点击统计、保存数据库原始数据 |
| Supabase Dashboard Logs | 排查 Auth、PostgREST、Postgres RPC、RLS 和慢查询 | React 渲染错误 |
| 现有 Umami | 匿名产品事件和功能使用率 | 错误堆栈、权限诊断 |

只使用 `console.error` 虽然零成本，但无法跨设备收集、按版本聚合或告警；自建日志表可以完全控制数据，却需要额外设计写入权限、清理、查询和告警，首版投入过大。因此选择托管前端错误平台 + Supabase 自带日志，不新增业务日志表。若未来有独立后端、合规留存要求或托管日志成本超过预算，再评估 OpenTelemetry 或自建集中日志。

### 13.2 统一错误事件

`src/api/` 为每次远端操作生成 UUID 格式的 `operationId`。记录错误时使用结构化字段，不拼接不可搜索的长句：

```ts
interface ErrorEventContext {
  event: string;          // private_resource.create_failed
  operationId: string;    // 同一次前端操作的关联 ID
  errorCode: AppErrorCode;
  layer: 'api' | 'service' | 'hook' | 'ui';
  release: string;        // Git commit SHA
  environment: 'development' | 'preview' | 'production';
  durationMs?: number;
  resourceId?: number;
  category?: ResourceCategory;
  sessionTraceId?: string; // 当前浏览器会话的随机 ID，不等于用户 ID
}
```

RPC 可以接收客户端生成的 `operation_id` 作为诊断字段，但它不参与身份或权限判断。需要数据库侧定位时，RPC 只在失败分支记录错误码、函数名和 `operation_id`；权限判断仍只使用 `auth.uid()`。

同一个前端错误只向 Sentry 上报一次：API 负责创建 `AppError`，Service 负责补充业务上下文，处理该错误的 Hook 负责调用 `errorReporter`；未被处理的渲染异常由 React Error Boundary 统一上报。各层禁止分别 `captureException`，否则同一故障会产生多条噪声记录。数据库端同一 `operation_id` 的日志属于跨系统关联，不算重复上报。

### 13.3 事件命名与严重级别

事件使用稳定的 `<domain>.<action>.<result>` 命名：

```text
auth.google.failed
catalog.fetch.failed
resource_mark.set.failed
resource_history.record.failed
private_resource.create.failed
private_resource.update.failed
space.fetch.failed
```

| 级别 | 条件 | 处理 |
|---|---|---|
| `info` | 用户主动取消、精确重复、达到 200/30 业务限额 | 默认不进错误告警；只做必要计数 |
| `warning` | 单次网络失败、浏览历史写入失败、可恢复的第三方错误 | 记录并聚合；不打断主要操作 |
| `error` | 未预期 RPC 错误、连续认证失败、数据映射失败、页面异常 | 进入 Sentry 并带 `operationId` |
| `fatal` | 多用户数据越权迹象、目录整体不可用、迁移导致广泛失败 | 立即告警并停止相关发布 |

“达到数量限制”和“精确重复”属于预期业务结果，不作为异常上报，避免错误平台充满无须修复的噪声。

### 13.4 隐私与脱敏

日志禁止包含：

- access token、refresh token、session、cookie 和任何密钥；
- 邮箱、OAuth 用户资料、完整或散列后的 `auth.users.id`；
- 私人资源的名称、描述、标签；
- 完整 URL 查询参数或 fragment，因为其中可能包含临时 token；
- Supabase 原始错误全文直接展示给用户。

允许记录资源数字 ID、category、稳定错误码、HTTP 状态、耗时、发布版本和脱敏后的域名。Sentry `beforeSend` 必须统一移除请求头、认证信息和敏感表单字段；生产 source map 上传后不得公开暴露。

首版关闭 Session Replay（会话录屏），因为私人资源表单可能进入录制范围，当前排错目标通过错误堆栈、breadcrumbs 和结构化上下文即可完成。只有完成单独的遮罩与隐私评审后才能启用。

首版也不启用全量性能 tracing，避免增加事件量与理解成本。先记录关键 API 的 `durationMs`；只有出现无法由 Supabase Logs 定位的持续延迟时，再对少量请求采样 tracing。

### 13.5 告警、版本与排查流程

首版只设置三个低噪声告警：

1. 5 分钟内出现 5 次以上目录加载失败。
2. 10 分钟内出现 5 次以上相同的未预期 `error`。
3. 任意疑似跨用户访问或 `fatal` 事件立即通知维护者。

每次部署必须写入 Git commit SHA 作为 `release`，并上传对应 source map。排查顺序固定为：用户反馈时间与操作 → Sentry 查 `operationId`、release 和堆栈 → Supabase Logs 查同时间 RPC/Auth/RLS 结果 → 本地使用相同 release 复现 → 修复后关联提交。日志保留期使用供应商当前套餐允许的默认值；若不足以覆盖实际反馈周期，再单独评估付费或导出，不在首版提前建设日志仓库。

实现依据参考 [Sentry source map 官方文档](https://docs.sentry.io/platforms/javascript/sourcemaps/) 和 [Supabase Logs 官方文档](https://supabase.com/docs/guides/monitoring-and-debugging/logs)。具体 SDK 版本和套餐能力在实施时重新核对，设计文档不锁死易变化的价格与保留天数。

### 13.6 降级规则

- 日志上报失败不得阻止业务请求，也不得无限重试。
- 浏览历史写入失败记录 `warning`，但外部链接照常打开。
- Space 加载失败必须显示“加载失败/重试”，不能静默显示为空 Space，避免用户误以为数据丢失。
- Mark 保存失败记录 `warning` 或 `error`，回滚乐观状态，并显示可重试提示。
- Auth API 必须同时处理返回的 `error` 和真正抛出的异常。
- 未预期错误的 UI 提示附带缩短后的 `operationId` 作为“诊断编号”，方便用户反馈；预期业务限制不显示诊断编号。

## 14. 测试设计

### 14.1 数据库测试

- 游客 RPC 每个主题最多返回 6 条。
- A 用户无法读取或修改 B 用户的资源、Mark 和历史。
- 第 201 条私人资源被拒绝。
- 完全相同 URL 被拒绝并返回推荐。
- URL 不同但 `normalized_url` 相同的本人第 30 条私人资源允许，第 31 条拒绝；公共资源不计入 30 条。
- 并发创建、并发更新以及创建与更新同时发生时，不会突破本人 200/30 上限。
- 其他用户的私人资源不会出现在相似推荐中。
- 私人资源无法被 Mark，即使调用方绕过页面直接写表。
- 浏览历史不能指向其他用户的私人资源。
- 删除账号后，其私人资源、Mark 和历史均被级联删除。
- 未授权角色不能执行受控 RPC；`SECURITY DEFINER` 固定 `search_path`。

### 14.2 Service 与 API 测试

- URL 校验和标准化规则。
- Supabase 数据行到应用类型的映射。
- 重复、相似、超限错误映射。
- Space 按主题分组、排序并隐藏空主题。
- Auth SDK 返回 `{ error }` 时能正确映射，而不依赖异常抛出。
- 需要身份的 API 不接受或转发调用方提供的 `userId`、`ownerId`。
- 同一创建请求因响应丢失而重试时，返回已有资源而不新增重复行。

### 14.3 组件测试

- 游客锁定区和登录入口。
- 星标乐观更新与失败回滚。
- 重复资源推荐弹窗。
- 相似资源确认后继续保存。
- 浏览历史横向列表。
- 私人资源编辑和删除确认。
- Space 请求失败时展示错误和重试，不伪装成空 Space。

### 14.4 端到端测试

```text
游客浏览 → 登录 → Mark 公共资源
→ 添加私人资源 → Space 出现
→ 点击资源 → 浏览历史更新
→ 取消 Mark → 从 Space 移除
```

### 14.5 建库、回滚与可观测性测试

- migration 从空库完整升级成功，并能按 README 回滚前端读取路径。
- 公共资源初始化 migration 与当前目录对账一致：37 个唯一公共资源、43 个主题位置，并保留各主题的 sort order。
- 前端切回静态目录时，新数据库及已产生的用户数据不被删除或覆盖。
- 构建产物不包含 `service_role` key、token 或生产 source map 公共地址。
- 错误事件包含 `operationId`、`errorCode`、`release`、`environment` 和操作名。
- Sentry 脱敏测试确认邮箱、token、私人资源内容和 URL 查询参数不会上报。
- 日志平台不可用时，目录、Mark 和私人资源操作仍按各自业务规则运行。

### 14.6 测试工具

| 范围 | 采用 | 原因 | 暂不选择 |
|---|---|---|---|
| TypeScript、Service、API、组件 | Vitest + React Testing Library | 与当前 Vite 项目集成简单，支持接近用户行为的组件测试 | Jest 可行，但需要更多 Vite/ESM 配置，当前没有迁移收益 |
| 浏览器端到端 | Playwright | 适合验证 OAuth 回跳、多个登录身份、弹窗和新标签页行为 | Cypress 可行，但本项目没有依赖其专用调试界面的需求 |
| 数据库 | 本地 Supabase + SQL 测试；复杂 policy 使用 pgTAP | 能在真实 Postgres、RLS 和 RPC 上验证权限与并发 | 仅 mock Supabase 无法证明 RLS 和事务锁正确 |

首版不追求覆盖率数字本身。数据库权限、不变量和错误映射属于必须测试路径；纯展示样式只测试关键交互，避免把大量测试绑定到 DOM 结构。

## 15. 分阶段上线

1. 接入错误追踪、release 标记和日志脱敏，确保后续阶段发生错误时可定位。
2. 建立数据库 schema、RLS、RPC 和测试，不连接生产页面。
3. 通过公共资源初始化 migration 导入并校验正式公共资源；不执行旧用户数据迁移。
4. 前端切换目录读取，验证游客每类 6 条。
5. 上线邮箱魔法链接和 Google 登录。
6. 上线 Mark、浏览历史和 Space。
7. 上线私人资源、相似推荐和数量限制。
8. 观察错误日志和用量后，再移除静态资源回滚路径。

## 16. 验收重点

- 游客无法通过 Supabase REST API 绕过每类 6 条限制。
- A 用户无法读取或修改 B 用户的私人资源、Mark 和历史。
- 取消 Mark 后资源从 Space 对应主题消失，但浏览历史不受影响。
- 访问资源只更新历史，不自动 Mark。
- 私人资源创建后立即出现在 Space 对应主题。
- 完全相同 URL 已存在时不创建新资源，并返回公共或本人私人资源作为推荐。
- URL 不同但 `normalized_url` 相同时，在本人同组私人资源少于 30 条且用户确认后允许创建。
- 本人相同 `normalized_url` 的私人资源达到 30 条时拒绝创建并返回推荐；公共资源数量不影响该限额。
- 私人资源总数达到 200 条时拒绝创建；系统没有每日新增限制。
- 同一资源反复访问只增加计数，不产生无限历史行。
- 源码、环境变量白名单和构建产物中均不存在 service-role key。
- 页面和组件中不存在直接的 Supabase 表查询。
- 私人资源不显示 Mark，且绕过 UI 直接调用数据库也无法 Mark 私人资源。
- 线上错误可以通过 `operationId + release` 在前端错误平台和 Supabase Logs 中完成定位，日志不包含用户私人内容或认证凭据。
