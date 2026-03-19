import OpenAI from 'openai'

interface GeneratePlanConfig {
  apiKey: string
  baseUrl?: string
  techName: string
  oldVersion?: string
  level: string
  goal: string
  withRelated: boolean
  docContent: string
}

export async function createStudyPlanStream(config: GeneratePlanConfig) {
  const openai = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl || 'https://api.deepseek.com',
  })

  const systemPrompt = `
你是一位来自顶级IT培训机构（类似开课吧、拉勾教育、极客时间）的首席课程架构师。你擅长打造千万级的爆款技术精品课。
当前任务：请为用户定制一份专业级、成体系、高强度的「全栈技术进阶实战大纲」。

【课程设计核心原则】
1. **对标大厂实战**：内容必须涵盖真实业务场景，而不只是 API 手册。
2. **深度源码剖析**：不仅教怎么用，还要深入核心源码和设计模式。
3. **结构化递进**：按照「行业综述 -> 环境基石 -> 核心 API -> 原理拆解 -> 高阶优化 -> 实战演兵 -> 面试突击」的 7 级演进逻辑设计。
4. **Anti-Vibe(独立思考)**：课程设计中要包含「自主实现环节」，禁止用户直接复制粘贴。

【强制分章节结构要求】（必须生成 10-15 个细分阶段，用于侧边栏多级导航）：

## 🎯 课程总纲与核心价值
[一句话对标名企需求]

## 🏗️ 第一阶段：[模块名，如：核心原理与基座搭建]
### Step 1：[课时名]
**🔍 必学知识点**：[知识点1, 知识点2]
**🧠 独立挑战**：[具体手动实现目标]
**💡 实现思路 (Hints)**：[逻辑提示]
**⚠️ 避坑指南**：[大厂实战踩坑经历]
**🏁 成果验证**：[结果]

### Step 2：[课时名]
...

## 🚀 第二阶段：[模块名，如：高阶特性与性能攻坚]
...

## 💻 课程终极实战项目：[项目名称]
\`\`\`[对应的语言标识]
// 提供一个最接近真实生产环境的核心代码结构模板
\`\`\`
`

  // 为了保证响应格式与稳定性，在 deepseek 时通常指定一个较大的上下文即可
  const stream = await openai.chat.completions.create({
    model: 'deepseek-chat', // 默认使用 deepseek v3/chat 模型
    messages: [
      { role: 'system', content: systemPrompt.trim() },
      { role: 'user', content: `【我要学习的技术】: ${config.techName}\n\n【我的水平】: ${config.level}\n\n【我的目标】: ${config.goal}\n\n【提供给你的官方文档参考资料 (如果内容残缺表示获取失败，请用你的底座知识补充)】:\n${config.docContent}` }
    ],
    temperature: 0.7,
    stream: true,
  })

  return stream
}

export interface QaConfig {
  apiKey: string
  baseUrl?: string
  techName: string
  docContent: string
  planMarkdown: string
  question: string
  history: { role: 'user' | 'assistant', content: string }[]
}

/**
 * 创建伴随式学习答疑流
 */
export async function createQaStream(config: QaConfig) {
  const openai = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl || 'https://api.deepseek.com',
  })

  const systemPrompt = `你是一位极具耐心的技术前沿布道师。用户正在学习【${config.techName}】。
你不仅脑子里有世界基准的底座常识，而且还具有下方的特权资料。

特权资料 1 -【当前该技术的官网最新动态简文】：
${config.docContent}

特权资料 2 -【系统刚才为该用户独家定制的学习进度规划表】：
${config.planMarkdown}

要求：
1. 用户的提问极可能是看了旧视频后在对照上面的“学习规划表”实战时产生的报错，你必须结合最新动态给予最精准的找茬和修复。
2. 回答要简短、一针见血。如果是代码段，请用 Markdown 代码块展示。绝不许编造。`

  // 拼接历史
  const messages: any[] = [
    { role: 'system', content: systemPrompt }
  ]
  
  // 装载历史聊天记录
  if (config.history && config.history.length > 0) {
    messages.push(...config.history)
  }

  // 装载本次问题
  messages.push({ role: 'user', content: config.question })

  const stream = await openai.chat.completions.create({
    model: 'deepseek-chat',
    messages,
    temperature: 0.5, // 答疑要求更严谨
    stream: true,
  })

  return stream
}
