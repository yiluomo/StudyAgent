<div align="center">
  <h1>🚀 StudyAgent - 结构化 AI 学习基站</h1>
  <p>基于 Nuxt 4 + TailwindCSS + DeepSeek AI 打造的全领域定制化学习计划生成器</p>
</div>

---

## ✨ 核心功能

### 🤖 对话式课程规划
不知道从哪里开始？首页内置课程规划顾问，通过 3-5 轮自然对话了解你的学习目标、当前水平和应用方向，自动填入表单一键生成课程。

### 🌐 全领域支持
不再局限于编程技术。无论是数据分析、乐理基础、金融知识、外语学习还是任何其他领域，AI 会自动识别领域并用对应的专业视角设计课程结构。

### 🕷 联网文档抓取（Powered by Tavily）
输入想学的内容，底层爬虫模块实时获取最新官方文档与实战资料，避免大模型知识断层问题。抓取失败时自动降级为模型底座知识。

### � 结构化课程大纲
自建 Markdown 解析引擎将生成内容实时解构为独立课时卡片，每个课时包含：
- 必学知识点、独立挑战、学习思路、常见误区、成果验证
- 一键生成深度课件（概念解析 + 关键示例 + 常见误区）
- 导出当前课时或完整课件为 Markdown 文件

### 🧪 课时测验与通关机制
每个课时可生成 4 道测验题，全部答对才能打卡通关。错题附带详细解析，支持重新作答或换一组题。通关后自动跳转下一课时。

### 📝 随堂笔记
右侧笔记栏支持自由新建笔记、编辑、删除，笔记与课程绑定持久化存储，可一键导出为 Markdown。

### � 专属助教答疑
学习过程中随时呼出助教侧边栏，结合当前课程上下文回答问题、解析报错。

### 🏁 学习进度追踪
全局进度条实时显示完成百分比，进度存储在本地浏览器，刷新不丢失。

---

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | [Nuxt 4](https://nuxt.com/) (Vue 3 + Nitro) |
| 状态管理 | [Pinia](https://pinia.vuejs.org/) + Composition API |
| 样式 | [Tailwind CSS](https://tailwindcss.com/) + Typography |
| AI 调用 | OpenAI SDK + DeepSeek API（SSE 流式输出） |
| 联网搜索 | `@tavily/core` + `cheerio` |
| Markdown | `marked` + 自建 AST 分割器 |
| 代码高亮 | `shiki` |

架构采用 **BYOK（Bring Your Own Key）** 模式，API Key 仅存储在用户本地浏览器，服务端不留存任何鉴权信息。

---

## 🚀 快速开始

**环境要求：** Node.js 18+

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 `http://localhost:3000`

### 首次使用
1. 点击右上角【API 配置】，填入 **DeepSeek API Key** 和 **Tavily API Key**
2. 点击"不知道学什么？让顾问帮你规划"，通过对话确定学习目标，或直接填写表单
3. 点击"一键定制精品课"开始生成

> DeepSeek Key 获取：[platform.deepseek.com](https://platform.deepseek.com/)
> Tavily Key 获取：[tavily.com](https://tavily.com/)（免费注册）

---

## 🏗 项目结构

```
├── app/
│   ├── components/
│   │   ├── form/          # 表单组件（含对话式规划 IntakeChat）
│   │   ├── plan/          # 课程展示（LearningStep、StepQuiz、PlanDisplay）
│   │   ├── qa/            # 助教答疑面板
│   │   ├── layout/        # 左右侧边栏
│   │   └── ui/            # 通用 UI 组件
│   ├── composables/
│   │   ├── useLearningPlan.ts   # 课程生成主流程
│   │   └── useMarkdownParser.ts # Markdown → 卡片解析核心
│   ├── stores/
│   │   ├── planStore.ts         # 课程状态 + 持久化
│   │   ├── progressStore.ts     # 学习进度
│   │   └── settingStore.ts      # API Key 管理
│   └── pages/index.vue
├── server/
│   ├── api/
│   │   ├── intake-chat.post.ts  # 对话式规划 API
│   │   ├── fetch-docs.post.ts   # 联网文档抓取
│   │   ├── generate-plan.post.ts # 课程大纲生成（SSE）
│   │   ├── expand-step.post.ts  # 课时详细课件生成
│   │   ├── generate-quiz.post.ts # 课时测验题生成
│   │   └── qa.post.ts           # 助教答疑（SSE）
│   └── utils/
│       ├── llm.ts               # DeepSeek Prompt 核心
│       ├── crawler.ts           # 网页爬取
│       └── search.ts            # Tavily 搜索
└── types/index.ts               # 全局类型定义
```

---

<div align="center">
  <sub>Built with ❤️ | Powered by DeepSeek & Tavily</sub>
</div>
