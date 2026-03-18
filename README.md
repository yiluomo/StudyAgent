<div align="center">
  <h1>🚀 StudyAgent - 次世代结构化学习基站</h1>
  <p>基于 Nuxt 4 + TailwindCSS + DeepSeek AI 打造的定制化技术学习计划生成器</p>
</div>

---

## ✨ 核心亮点

StudyAgent 并不是一个简单的套壳聊天机器人。它是为了解决**学习新技术时的信息滞后与实战卡壳痛点**而专门设计的结构化学习引擎：

* 🕷 **AI 原生前沿网罗 (Powered by Tavily)**：不再受限于大模型知识库（比如一年前的知识断层）。输入想要学习的「新版本」，底层爬虫模块将在几秒内为你获取该技术**最新的官方文档**与 **GitHub 最热实战样板库**。
* ⚠️ **版本代偿与防坑预警**：还在对比着旧视频学新版本？专门设计的旧版隔离通道，大模型会精准抓取差异，在你跟着敲代码前就直接标注出坑点。
* 📝 **极客级动态大纲渲染引擎**：告别干瘪的 Markdown 原文。自建 AST 动态分割器将文本解构为「独立交互步道卡片」，采用 macOS 工业范设计的 `Shiki` 原生代码高亮容器，支持一键复制代码。
* 💬 **悬浮随身专家伴读**：代码跑不通？卡片右下角随时呼出专属助教侧边栏，带着你的【定制化课件底座上下文】为你手把手改错。
* 🏁 **本地数据库打卡**：自带炫酷五彩纸屑礼炮！学习进度存在浏览器 `LocalStorage` 中，全站响应式进度条助你抗击“收藏全等于学会”。
* 📦 **防失联脱水导出**：学完直接脱水导出为「纯享 Markdown」或是基于内联样式渲染的「极速独立 HTML 文件」。

## 🛠 技术栈

* **框架核心**：[Nuxt 4](https://nuxt.com/) (Vue 3, Nitro 2) - 极致 SPA 单页应用模式，移除冗余 SSR 渲染避免内存溢出，全客户端沙盒运行，性能怪兽
* **状态总线**：[Pinia](https://pinia.vuejs.org/) + Vue Composition API
* **交互极客美学**：[Tailwind CSS](https://tailwindcss.com/) + Typography 全局接管
* **底层能力引擎**：
  * `@tavily/core` (AI Search) + `cheerio` (全量净化爬取)
  * `openai sdk` + `deepseek` (SSE 打字机流式长文本输出)
  * `shiki` (超低时延的异步单例引擎) + `marked`
* **架构范式**：BYOK (Bring Your Own Key) 设计模式 —— 用户无缝自主填写鉴权密匙并本地隔离加密，服务端纯净转发，0 负担全免费。

---

## 🚀 起步指南

确保您的运行环境为 **Node.js 18+**。

### 1. 依赖安装

```bash
# 推荐使用 npm
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

成功后请在浏览器访问 `http://localhost:3000`。

### 3. 开始你的定制化学习
第一次使用时：
1. 点击界面顶部右侧的【API 配置】玻璃按钮。
2. 免费获取并填入你的 **DeepSeek API Key** 和 **Tavily API Key**。
3. 返回主页面，输入你想要学习的技术名，开始探索！

*(所有的配置状态只保存在你本地所在的浏览器内。不需要任何第三方验证登录即可享受极致快感。)*

---

## 🏗 开源扩展目录指引

对于想要改造它的魔法师们：

* `app/composables/useMarkdownParser.ts` ➜ 这是能够将大模型打字机流瞬间变种成为卡片的绝对核心！
* `server/utils/llm.ts` ➜ 这是深埋进 DeepSeek 思维底座的 System Prompt 命脉区。你可以为他再增加更变态的强约束任务。
* `app/components/qa/QaPanel.vue` ➜ 右侧答疑专家。包含了悬浮状态处理与气泡复写！

---
<div align="center">
  <sub>Built with ❤️ by You & StudyAgent | Powered by the brilliant AI community.</sub>
</div>
