# 日本語 HUB：资源、个人 Space、数据库与 API 设计

- 日期：2026-09-01
- 最后修订：2026-09-05
- 状态：设计已确认，等待最终文档复核；尚未执行数据库迁移
- 适用范围：游客资源限制、登录、Mark、浏览历史、私人资源、个人 Space
- 技术路径：React + TypeScript + Supabase Auth/Postgres/RLS

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

## 2. 分层原则是什么意思

当前应用已经大体按 `UI → Hook → Service → API → Supabase` 分层。一个“点击星标”的完整调用应为：

```text
ResourceCard
  → useResourceMark
    → resourceService.setMarked(resourceId, true)
      → resourceApi.upsertMark(resourceId)
        → Supabase / Postgres
```

各层职责如下：

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
- 资源主题使用 PostgreSQL `resource_category` enum；前端对应为 `ResourceCategory` 字符串联合类型。
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

统一保存公共资源和私人资源。

| 字段 | PostgreSQL 类型 | 键/约束 | 约束说明 | 数据示例 |
|---|---|---|---|---|
| `id` | `bigint` | `PK` | 自增：`generated always as identity` | `301` |
| `category` | `resource_category` | `NN` | 资源所属主题；取值由 `resource_category` enum 限制 | `listening` |
| `owner_id` | `uuid` | `FK` | 可空；引用 `auth.users.id`；`NULL` 表示公共资源，UUID 表示该用户的私人资源 | 公共资源：`NULL`；私人资源：`6fda32b8-67a1-4b7e-b427-10a38c3d550c` |
| `name` | `text` | `NN, CK` | 非空，建议最多 120 字符 | `NHK Easy News` |
| `description` | `text` | `NN, CK` | 非空，建议最多 500 字符 | `带有注音和音频的简明日语新闻` |
| `url` | `text` | `NN, CK` | 只接受 HTTP(S) | `https://www3.nhk.or.jp/news/easy/` |
| `normalized_url` | `text` | `NN` | 相似资源分组键，由数据库 URL 标准化函数根据 `url` 生成 | `https://www3.nhk.or.jp/news/easy` |
| `tags` | `text[]` | `NN, DF, CK` | 默认空数组；最多 10 项 | `{"beginner","news"}` |
| `sort_order` | `integer` | `NN, DF, CK` | 非负；公共资源展示顺序，私人资源默认 0 | `1` |
| `created_at` | `timestamptz` | `NN, DF` | 默认 `now()` | `2026-09-01T10:30:00+09:00` |
| `updated_at` | `timestamptz` | `NN, DF` | 默认 `now()`，trigger 自动更新 | `2026-09-01T14:45:00+09:00` |

资源类型由 `owner_id` 唯一确定：

| `owner_id` 状态 | 资源类型 | 首版权限 |
|---|---|---|
| `NULL` | 公共资源 | 只有 Dashboard 管理员可以新增、修改和删除 |
| 当前用户 UUID | 该用户的私人资源 | 只有该用户可以读取、修改和删除 |

#### URL 重复与相似资源规则

检查范围是全部公共资源和当前用户自己的私人资源，不读取或暴露其他用户的私人资源。

| 比较结果 | 保存规则 | 给用户的操作 |
|---|---|---|
| `url` 完全相同 | 禁止新增 | 推荐已有资源；公共资源提供“直接 Mark”，私人资源提供“查看已有资源” |
| `url` 不同、`normalized_url` 相同 | 相似资源不足 30 条时允许继续 | 先展示相似资源，用户确认后继续保存 |
| `url` 不同、`normalized_url` 相同，已有 30 条 | 禁止新增 | 推荐已有的 30 条相似资源 |
| `normalized_url` 不同 | 允许保存 | 正常创建私人资源 |

`url` 在保存前会去除首尾空白并通过 URL 解析器校验；完全相同是指清理后的完整 URL 字符串相同。数据库 trigger 在插入或修改前调用统一标准化函数生成 `normalized_url`，客户端不能自行指定该字段。`normalized_url` 不建立唯一约束，只建立普通查询索引。

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
- 创建私人资源必须通过数据库 RPC；RPC 在同一事务中检查总量、精确重复和相似资源数量。

```sql
private_resource_limit() returns integer   -- 200
similar_resource_limit() returns integer   -- 30
```

限制值改变时使用数据库 migration 执行 `create or replace function`，前端从 API 返回值读取限制，不另外写死数字。

### 5.3 `resource_marks`

只记录用户对公共资源的二元 Mark。

| 字段 | PostgreSQL 类型 | 键/约束 | 约束说明 | 数据示例 |
|---|---|---|---|---|
| `user_id` | `uuid` | `PK, FK` | 联合主键的一部分；引用 `auth.users.id` | `6fda32b8-67a1-4b7e-b427-10a38c3d550c` |
| `resource_id` | `bigint` | `PK, FK` | 联合主键的一部分；引用 `resources.id`，删除资源时级联删除 | `301` |
| `marked_at` | `timestamptz` | `NN, DF` | 默认 `now()` | `2026-09-01T15:10:00+09:00` |

主键：`(user_id, resource_id)`。重复 Mark 使用 upsert，不产生重复行。

### 5.4 `resource_history`

每个用户与资源只保留一条汇总记录，防止浏览日志无限追加。

| 字段 | PostgreSQL 类型 | 键/约束 | 约束说明 | 数据示例 |
|---|---|---|---|---|
| `user_id` | `uuid` | `PK, FK` | 联合主键的一部分；引用 `auth.users.id` | `6fda32b8-67a1-4b7e-b427-10a38c3d550c` |
| `resource_id` | `bigint` | `PK, FK` | 联合主键的一部分；引用 `resources.id` | `301` |
| `visit_count` | `integer` | `NN, DF, CK` | 默认 1，必须大于 0 | `7` |
| `first_visited_at` | `timestamptz` | `NN, DF` | 默认 `now()`，首次访问时间 | `2026-08-20T19:15:00+09:00` |
| `last_visited_at` | `timestamptz` | `NN, DF` | 默认 `now()`，最近访问时间 | `2026-09-01T15:20:00+09:00` |

主键：`(user_id, resource_id)`。每次点击执行原子 upsert：已有行就增加 `visit_count` 并更新时间。

### 5.5 删除行为

- 删除私人资源时，级联删除它的浏览历史。
- 删除公共资源时，级联删除相关 Mark 和历史；该操作仅管理员在 Dashboard 中执行。
- 删除账号的用户数据清理由 `user_id` 外键级联完成。

### 5.6 索引

至少建立：

```text
resources(category, sort_order) where owner_id is null
resources(owner_id, category, created_at)
resources(normalized_url) where owner_id is null
resources(owner_id, normalized_url) where owner_id is not null
resource_marks(user_id, marked_at desc)
resource_history(user_id, last_visited_at desc)
```

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
  category: ResourceCategory;
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

export type CreatePrivateResourceResult =
  | { status: 'created'; resource: ResourceRecord }
  | { status: 'exact_url_exists'; recommendations: SimilarResourceMatch[] }
  | { status: 'similar_limit_reached'; recommendations: SimilarResourceMatch[] }
  | { status: 'private_limit_reached'; current: number; limit: number };
```

### 7.2 文件边界

```text
src/api/
├── supabaseClient.ts
├── catalogApi.ts
├── resourceMarkApi.ts
├── resourceHistoryApi.ts
└── privateResourceApi.ts

src/service/
├── catalogService.ts
├── resourceMarkService.ts
├── resourceHistoryService.ts
├── privateResourceService.ts
└── spaceService.ts
```

### 7.3 Catalog API

```ts
fetchCatalog(): Promise<CategoryCatalog[]>
searchCatalog(query: string): Promise<ResourceRecord[]>
```

`fetchCatalog` 调用 `get_catalog_snapshot` RPC。身份从当前 Supabase session 获取，不接受 `userId` 参数，避免调用方冒充其他用户。

`searchCatalog` 的权限与目录读取完全一致：

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
- 数据库确认目标是公共资源。
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
): Promise<CreatePrivateResourceResult>

updatePrivateResource(
  resourceId: number,
  input: PrivateResourceInput,
  options: { similarResourcesReviewed: boolean },
): Promise<CreatePrivateResourceResult>

deletePrivateResource(resourceId: number): Promise<void>
```

创建流程：

1. 表单失焦或用户点击保存时调用 `findSimilarResources`。
2. 查询全部公共资源和当前用户私人资源，精确匹配排在最前，相同 `normalized_url` 的结果随后展示，最多返回 30 条。
3. 存在完全相同的 `url` 时不显示“仍然保存”，只允许直接 Mark 公共资源或查看已有私人资源。
4. 只有相同 `normalized_url` 时，用户看过推荐结果后可以选择“仍然保存”。
5. `createPrivateResource` 不能信任前端预检查结果；数据库 RPC 在写入事务中重新检查完全相同 URL、30 条相似上限和 200 条私人资源总量。
6. `similarResourcesReviewed` 只代表交互确认，不替代数据库安全检查。
7. 更新现有私人资源时，相似和重复检查必须排除当前正在编辑的 `resourceId`。

Service 层校验：

- 名称和 URL 必填。
- URL 必须是 `http:` 或 `https:`。
- 名称、描述和标签有长度限制。
- 标签 trim、去空、去重，最多 10 个。

数据库层再次通过约束和 RLS 校验。客户端不传 `owner_id`；API 使用当前认证用户，避免伪造所有者。

### 7.7 Space API

```ts
fetchSpace(): Promise<{
  recentHistory: HistoryItem[];
  sections: SpaceSection[];
}>
```

实现可以并行读取：

1. 最近 30 条浏览历史。
2. 当前用户的 Mark 及对应公共资源。
3. 当前用户的私人资源。

`spaceService` 按前端 `src/data/categories.ts` 中的既定主题顺序分组和排序，并过滤空主题。页面只消费最终 `sections`。

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
- `SIMILAR_RESOURCE_LIMIT_REACHED`：相同标准化 URL 已有 30 条，禁止新增并展示推荐。
- `PRIVATE_RESOURCE_LIMIT_REACHED`：私人资源已达到 200 条。
- `NETWORK_ERROR`：保留当前表单内容，允许重试。
- `FORBIDDEN`：不自动重试，记录诊断信息但不展示数据库细节。

## 8. 数据库操作文件

正式实现时创建：

```text
supabase/
├── migrations/
│   ├── 202609010001_create_resource_schema.sql
│   ├── 202609010002_create_resource_indexes_triggers.sql
│   ├── 202609010003_create_resource_rls.sql
│   └── 202609010004_create_resource_rpcs.sql
├── seed.sql
└── README.md
```

各文件职责：

1. `create_resource_schema.sql`：枚举、表、主外键、检查约束。
2. `create_resource_indexes_triggers.sql`：索引、URL 规范化、`updated_at` trigger。
3. `create_resource_rls.sql`：启用 RLS、创建 policies、撤销多余权限。
4. `create_resource_rpcs.sql`：游客目录读取、原子浏览记录、相似资源查询、私人资源创建与数量限制函数。
5. `seed.sql`：当前静态公共资源的一次性导入。
6. `README.md`：本地执行、验证、回滚和远端应用步骤。

这些 SQL 文件必须先经过人工评审和本地 Supabase 验证；在获得确认前，不对远端数据库执行任何迁移。

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
→ catalogApi.fetchCatalog()
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

浏览器先打开外部 URL，再异步记录浏览历史。历史写入失败不能阻止或延迟用户访问资源。

### 10.4 添加私人资源

```text
填写 URL
→ findSimilarResources()
→ 完全相同：禁止新增，推荐已有资源
→ 仅 normalized_url 相同：展示推荐，允许确认后继续
→ createPrivateResource RPC 再次检查
→ 创建成功后加入 Space 对应主题
```

## 11. 并发一致性

如果两个创建请求同时读到 199 条后分别插入，总量可能变成 201。因此创建 RPC 必须在事务中获取当前用户维度的事务锁，再依次检查总量、完全相同 URL 和相似资源数量：

```sql
pg_advisory_xact_lock(...)
```

同一用户的并发创建请求会短暂排队。锁必须基于数据库会话中的 `auth.uid()` 计算，不能信任客户端传入用户 ID。

## 12. 错误与交互处理

- 未登录：打开登录弹窗并保留当前 URL。
- 完全重复：不创建，展示已有资源推荐。
- 相似资源达到 30 条：不创建，展示现有候选。
- 私人资源达到 200 条：提示先删除旧资源。
- 网络失败：保留表单内容并允许重试。
- 权限失败：不展示数据库原始错误信息。
- 浏览历史写入失败：不影响打开外部链接。
- 删除私人资源：执行前二次确认。

## 13. 测试设计

### 13.1 数据库测试

- 游客 RPC 每个主题最多返回 6 条。
- A 用户无法读取或修改 B 用户的资源、Mark 和历史。
- 第 201 条私人资源被拒绝。
- 完全相同 URL 被拒绝并返回推荐。
- URL 不同但 `normalized_url` 相同的第 30 条允许，第 31 条拒绝。
- 并发创建不会突破 200/30 上限。
- 其他用户的私人资源不会出现在相似推荐中。

### 13.2 Service 与 API 测试

- URL 校验和标准化规则。
- Supabase 数据行到应用类型的映射。
- 重复、相似、超限错误映射。
- Space 按主题分组、排序并隐藏空主题。

### 13.3 组件测试

- 游客锁定区和登录入口。
- 星标乐观更新与失败回滚。
- 重复资源推荐弹窗。
- 相似资源确认后继续保存。
- 浏览历史横向列表。
- 私人资源编辑和删除确认。

### 13.4 端到端测试

```text
游客浏览 → 登录 → Mark 公共资源
→ 添加私人资源 → Space 出现
→ 点击资源 → 浏览历史更新
→ 取消 Mark → 从 Space 移除
```

## 14. 分阶段上线

1. 建立数据库 schema、RLS、RPC 和测试，不连接生产页面。
2. 导入并校验当前静态公共资源。
3. 前端切换目录读取，验证游客每类 6 条。
4. 上线邮箱魔法链接和 Google 登录。
5. 上线 Mark、浏览历史和 Space。
6. 上线私人资源、相似推荐和数量限制。
7. 观察错误日志和用量后，再移除静态资源回滚路径。

## 15. 验收重点

- 游客无法通过 Supabase REST API 绕过每类 6 条限制。
- A 用户无法读取或修改 B 用户的私人资源、Mark 和历史。
- 取消 Mark 后资源从 Space 对应主题消失，但浏览历史不受影响。
- 访问资源只更新历史，不自动 Mark。
- 私人资源创建后立即出现在 Space 对应主题。
- 完全相同 URL 已存在时不创建新资源，并返回公共或本人私人资源作为推荐。
- URL 不同但 `normalized_url` 相同时，在少于 30 条且用户确认后允许创建。
- 当前用户可见的相似资源达到 30 条时拒绝创建并返回推荐。
- 私人资源总数达到 200 条时拒绝创建；系统没有每日新增限制。
- 同一资源反复访问只增加计数，不产生无限历史行。
- API 文件中不存在 service-role key。
- 页面和组件中不存在直接的 Supabase 表查询。
