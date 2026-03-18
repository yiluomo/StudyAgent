# StudyAgent 开发上下文文档

> 供 AI 助手（Gemini/Antigravity）在上下文超限后快速恢复对项目的理解。
> 最后更新：2026-03-18

---

## 一、项目定位

**项目名称**：StudyAgent —— 通用技术学习 Agent

**核心流程**：
```
用户输入技术名 → 联网抓取官方文档 → AI 生成结构化学习计划 → 交互答疑 & 进度追踪
```

**双重目标**：
1. 产品目标：帮助用户学习任意新技术（无固定范围）
2. 开发学习目标：通过本项目系统掌握 **Nuxt.js 3** 技术栈

---

## 二、技术栈（已锁定）

| 层级 | 技术 | 版本 |
|------|------|------|
| 核心框架 | Nuxt.js | **4.4.2**（含 Nitro 2.13.1, Vite 7.3.1）|
| 前端语言 | Vue 3 + TypeScript | — |
| 样式 | Tailwind CSS | v3（Nuxt 官方模块 `@nuxtjs/tailwindcss`）|
| 状态管理 | Pinia | `@pinia/nuxt` |
| 后端 | Nuxt Server API（`server/api/`）| H3 框架 |
| 搜索引擎 | Tavily API | — |
| 大模型 | DeepSeek（`deepseek-chat`）| OpenAI SDK 兼容 |
| 爬虫 | cheerio（静态）/ playwright（动态，备用）| — |
| 代码高亮 | shiki | Nuxt 官方推荐 |
| 导出 | file-saver | Phase 2 |

---

## 三、目录结构（目标）

```
studyAgent/
├── .env                       # 本地密钥（不提交）
├── .env.example               # 密钥模板
├── nuxt.config.ts             # Nuxt 配置（含 Tailwind、Pinia 模块）
├── tailwind.config.ts         # Tailwind 配置
├── package.json
├── README.md
├── AGENT_CONTEXT.md           # 本文件：AI 快速理解项目用
│
├── types/
│   └── index.ts               # 全局 TypeScript 类型定义
│
├── pages/
│   ├── index.vue              # 首页（表单输入 + 计划展示 + QA）
│   └── history.vue            # 历史计划（Phase 2）
│
├── components/
│   ├── form/
│   │   ├── TechInput.vue      # 技术名称输入（含自动补全提示）
│   │   ├── LevelSelect.vue    # 基础水平下拉（零基础/入门/进阶/精通）
│   │   └── GoalSelect.vue     # 学习目标下拉（快速入门/项目实战/面试备考）
│   ├── plan/
│   │   ├── PlanDisplay.vue    # 学习计划主展示区（接受 markdown 流）
│   │   ├── LearningStep.vue   # 单步骤卡片（可折叠展开、标记完成）
│   │   ├── CodeBlock.vue      # 代码高亮 + 一键复制
│   │   └── StreamingText.vue  # 流式文本渲染组件
│   ├── qa/
│   │   └── QaPanel.vue        # 答疑面板（Phase 2）
│   └── ui/
│       ├── LoadingSpinner.vue
│       ├── SkeletonCard.vue   # 骨架屏
│       └── StatusBadge.vue
│
├── composables/
│   ├── useLearningPlan.ts     # 学习计划生成主逻辑（调用两个 API）
│   ├── useStreamOutput.ts     # SSE 流式输出处理（fetch + ReadableStream）
│   ├── useProgress.ts         # 学习进度管理（Phase 2）
│   └── useQa.ts              # 答疑逻辑（Phase 2）
│
├── stores/
│   ├── planStore.ts           # 学习计划状态（Pinia）
│   └── progressStore.ts       # 学习进度状态（Phase 2，Pinia persist）
│
└── server/
    ├── api/
    │   ├── fetch-docs.post.ts    # 文档抓取接口
    │   ├── generate-plan.post.ts # 学习计划生成（SSE 流式）
    │   └── qa.post.ts            # 答疑接口（Phase 2）
    └── utils/
        ├── search.ts             # Tavily API 封装
        ├── crawler.ts            # cheerio 网页抓取
        ├── llm.ts                # DeepSeek（OpenAI SDK）封装
        └── cache.ts              # 内存缓存（Map + TTL）
```

---

## 四、核心接口规范

### 4.1 POST `/api/fetch-docs`
**请求**：
```typescript
{
  techName: string    // 技术名称，如 "Next.js 14"
  version?: string   // 可选版本号
  tavilyKey: string  // 必填：前端传入的用户 Tavily API Key
}
```
**响应**：
```typescript
{
  docContent: string  // 抓取的文档文本（≤8000字符）
  sourceUrl: string   // 文档来源 URL
  fallback: boolean   // true = 抓取失败，使用 LLM 知识降级
  cached: boolean     // 是否来自缓存
}
```
**逻辑**：Tavily 搜索 → cheerio 抓取 → 内存缓存（TTL 1小时）→ 失败降级

---

### 4.2 POST `/api/generate-plan`（SSE 流式）
**请求**：
```typescript
{
  techName: string
  level: 'beginner' | 'elementary' | 'intermediate' | 'advanced'
  goal: 'quickstart' | 'project' | 'interview'
  withRelated: boolean
  docContent: string  // 来自 fetch-docs 的文档内容
  deepseekKey: string // 必填：前端传入的用户 DeepSeek API Key
}
```
**响应**：SSE Event Stream，每个 `data:` 为 JSON token
```
data: {"token": "## React"}
data: {"token": " 核心定位"}
...
data: {"done": true}
```
**大模型 Prompt 结构**：
- System：要求输出 Markdown 格式，含固定结构（见下方学习计划结构）
- User：技术名 + 基础水平 + 学习目标 + 文档内容摘要

---

### 4.3 POST `/api/qa`（Phase 2）
**请求**：
```typescript
{
  question: string
  techName: string
  docContent: string
  planMarkdown: string  // 当前学习计划内容
  history: { role: 'user' | 'assistant', content: string }[]
}
```
**响应**：SSE 流式，格式同 generate-plan

---

## 五、学习计划输出结构

大模型必须输出以下 Markdown 结构（通过 Prompt 强制约束）：

```markdown
## 🎯 技术核心定位
[一句话说明技术价值]

## 🏢 主流应用场景
1. [场景名]：[说明]
2. ...（3-5个）

## 🔗 配套关联技术（仅 withRelated=true 时）
| 技术 | 用途 | 学习优先级 |
...

## 📚 学习路径（共 N 步）

### Step 1：[步骤名]
**必学知识点**：...
**实战小任务**：...
**检测题**：
1. Q：... A：...
2. Q：... A：...
3. Q：... A：...
**⚠️ 避坑提示**：...

### Step 2：...

## 💻 最小可运行代码模板
\`\`\`[language]
// 带注释的示例代码
\`\`\`
```

---

## 六、Pinia Store 结构

### planStore.ts
```typescript
interface PlanState {
  // 状态机
  status: 'idle' | 'fetching-docs' | 'generating' | 'done' | 'error'
  error: string | null

  // 表单数据
  techName: string
  level: 'beginner' | 'elementary' | 'intermediate' | 'advanced'
  goal: 'quickstart' | 'project' | 'interview'
  withRelated: boolean

  // 结果
  docContent: string
  sourceUrl: string
  isFallback: boolean
  planMarkdown: string  // 流式追加
}
```

---

## 七、关键技术决策（最新）

1. **Local First 与 BYOK (Bring Your Own Key)**：
   用户的 DeepSeek 和 Tavily API Key 由前端页面通过设置弹窗填写，并持久化到浏览器的 `localStorage` 中。后端不再硬编码 Key，变更为无状态代理层，请求时通过 Request Body 将 Key 带入。保障用户的密钥隐私安全。

2. **交互性重于单纯的内容生成**：
   学习计划不只渲染静态 Markdown，而是通过折叠卡片（标记完成进度）和伴随式 QA 面板（将即时抓取的文档作为上下文），将内容转化为了一个完整的动态互动教程。

---

## 八、开发进度

### Phase 1 - MVP（进行中）

| Step | 任务 | 状态 | 备注 |
|------|------|------|------|
| 1.1 | 项目初始化 | ✅ 完成 | Nuxt 4.4.2 + Tailwind(@nuxtjs/tailwindcss 6.14.0) + Pinia(@pinia/nuxt 0.11.3) + types/index.ts + planStore.ts |
| 1.2 | 后端 API 开发 | ✅ 完成 | search/crawler/llm/fetch-docs/generate-plan |
| 1.3 | 前端表单与状态 | ✅ 完成 | Pinia Store + 表单组件 + App总成 |
| 1.4 | 学习计划展示 | ✅ 完成 | 流式响应切分 + Shiki语法高亮 + 折叠动画 |
| 1.5 | 集成测试 | ✅ 完成 | 在 UI 进行边界用例测试，并输出测试指南 |

### Phase 2 - 拓展功能（未开始）

| Step | 任务 | 状态 |
|------|------|------|
| 2.1 | 交互式答疑 QA (含带旧版排坑修正) | ✅ 完成 | 答疑侧边面板及带有特权语境判定指令的大模型防幻觉回答机制 |
| 2.2 | 学习进度追踪 | ✅ 完成 | 在 Store 中落盘记录，引入彩带动画和响应式总进度条 |
| 2.3 | 内容导出 | ✅ 完成 | 实现了 Blob URL 脱水下载 Markdown 与动态编译内联 CSS 单页 HTML 功能 |

### Phase 3 - 打磨交付（未开始）

| Step | 任务 | 状态 |
|------|------|------|
| 3.1 | 性能优化 | ✅ 完成 | 移除冗余 SSR 模块，改 Shiki 与 Confetti 为客户端沙盒惰性运行以拔高性能 |
| 3.2 | README & 文档整理 | ✅ 完成 | 已重构高质感 Readme 并向用户输出。 |

> **提示**：用户要求跳过该阶段关于特定领域 SEO 的支持。

---

## 九、关键决策记录

| 决策 | 选择 | 原因 |
|------|------|------|
| 搜索 API | Tavily（非 SerpAPI）| 专为 AI 设计，直接返回结构化内容 |
| 大模型 | DeepSeek 优先 | 国内无障碍，价格低，OpenAI SDK 兼容 |
| 生成方式 | SSE 流式输出 | 用户体验远优于等待 15 秒后显示 |
| 抓取失败处理 | 降级到 LLM 知识 | 保证核心功能在网络受限时可用 |
| 样式方案 | Tailwind CSS | Nuxt 官方推荐，与需求文档一致 |
| 代码高亮 | shiki | Nuxt 官方推荐 |

---

## 十、常用命令

```bash
# 开发
npm run dev

# 构建
npx nuxi build

# 预览生产包
npx nuxi preview

# 添加 Nuxt 模块
npx nuxi module add [module-name]

# 检查 Nuxt 项目
npx nuxi info
```

---

## 十一、AI 助手工作建议

当你（AI 助手）重新进入此项目时：
1. **先读本文件**（AGENT_CONTEXT.md）了解项目全貌
2. **查看第八节进度表**，确认当前应该做哪个 Step
3. **查看对应目录**的现有代码，避免重复创建
4. **遵循第四节接口规范**，不要随意改变接口格式
5. **更新进度表**，每完成一个 Step 就把状态改为 ✅

---

*本文档随项目开发持续更新，是项目的"真相唯一来源"。*
