# 日本語 HUB（日语学习导航）

基于 React + TypeScript + Vite 的日语学习资源导航站点，采用 **UI / Service / Data** 三层思路组织代码：页面与组件负责展示，Service 承载业务规则，Data 与 API 层负责数据来源（当前为本地静态数据，后续可替换为网络请求）。

## 技术栈

- React 18、TypeScript、Vite 5
- React Router（路径与当前分类联动）
- Tailwind CSS、lucide-react
- Vercel Analytics（可选）

## 快速开始

```bash
npm install
npm run dev
```

本地开发默认访问 Vite 提示的地址（一般为 `http://localhost:5173`）。

```bash
npm run build    # 生产构建
npm run preview  # 预览构建产物
npm run lint     # ESLint 检查
```

## 项目结构

仓库根目录主要包含应用源码 `src/` 与构建配置（`vite.config.ts`、`tailwind.config.js`、`tsconfig*.json` 等）。

### `src/` 目录说明

```
src/
├── api/                    # 数据访问层：对外暴露「如何取数」（现为本地 data，可改为 fetch）
│   └── catalogApi.ts
├── service/                # 业务层：搜索、路由与分类解析、翻译函数等
│   └── catalogService.ts
├── data/                   # 数据层：类型定义、文案、分类与资源、今日短语等静态数据
│   ├── index.ts            # 统一导出
│   ├── types.ts
│   ├── translations.ts
│   ├── categories.ts
│   ├── todaysPhrases.ts
│   └── todaysPhrasesEasy.ts
├── hooks/                  # React 钩子：组合 Router + API + Service + UI 状态
│   └── useHubApp.ts
├── components/             # 可复用 UI 组件
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── ResourceCard.tsx
├── pages/                  # 页面级视图（首页、分类页、搜索结果）
│   ├── HomePage.tsx
│   ├── CategoryPage.tsx
│   └── SearchResults.tsx
├── utils/                  # 与框架无关的工具函数
│   └── tagStyles.ts        # 标签配色（随明暗主题切换）
├── App.tsx                 # 应用壳：布局与页面拼装
├── main.tsx                # 入口（含 BrowserRouter）
├── index.css               # 全局样式（含 Tailwind）
└── vite-env.d.ts
```

### 分层关系（简要）

| 层级 | 目录 | 职责 |
|------|------|------|
| Data | `data/` | 领域类型与静态内容，不包含 UI |
| API | `api/` | 读取数据的单一入口，便于日后接入后端或 JSON |
| Service | `service/` | 业务规则（如搜索匹配、路径解析、`t()` 工厂函数） |
| UI | `components/`、`pages/` | 展示与用户交互 |
| 胶水层 | `hooks/` | 把路由状态与上述层组合成页面所需的数据与方法 |

## 许可与说明

本项目为个人/小规模学习导航用途；站内链接指向第三方网站，使用时请遵守各站点条款。
