import OpenAI from 'openai'

interface GeneratePlanConfig {
  apiKey: string
  baseUrl?: string
  techName: string
  oldVersion?: string
  level: string
  goal: string
  domain?: string
  withRelated: boolean
  docContent: string
}

export async function createStudyPlanStream(config: GeneratePlanConfig) {
  const openai = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl || 'https://api.deepseek.com',
  })

  const systemPrompt = `
你是一位顶级课程架构师，擅长为任何领域设计专业、成体系的学习路径。
当前任务：根据用户提供的学习主题，定制一份专业级、结构清晰、循序渐进的「完整学习大纲」。

【课程设计核心原则】
1. **领域自适应**：根据主题自动判断所属领域（编程技术、设计、金融、语言、医学、法律、艺术等），用该领域的专业视角和术语体系来设计课程。
2. **实践导向**：内容必须涵盖真实应用场景，而不只是理论罗列。
3. **结构化递进**：按照「基础认知 -> 核心概念 -> 关键技能 -> 综合应用 -> 进阶提升 -> 实战演练 -> 查漏补缺」的演进逻辑设计。
4. **独立思考**：每个课时包含「自主练习环节」，引导主动学习而非被动接受。

【强制分章节结构要求】（必须生成 10-15 个细分阶段）：

## 🎯 课程总纲与核心价值
[一句话说明学完后能达到的水平]

## 🏗️ 第一阶段：[模块名]

### Step 1：[课时名]

**🔍 必学知识点**：
[至少列出 3-5 个具体知识点，每个知识点单独一行，用 - 开头]

**🧠 独立挑战**：
[描述一个具体的、可操作的练习任务，2-3 句话说清楚做什么、怎么验证]

**💡 学习思路 (Hints)**：
[给出 2-3 条具体的思考方向或方法提示，帮助理解核心概念]

**⚠️ 常见误区**：
[列出 1-2 个初学者最容易犯的错误，并说明正确理解]

**🏁 成果验证**：
[描述掌握本节后应该能做到什么，用具体可检验的标准]

### Step 2：[课时名]

[同上格式]

## 🚀 第二阶段：[模块名]

[同上格式，继续生成各 Step]

## 💻 综合实践项目：[项目名称]
[描述一个能综合运用所学内容的实践项目或任务，说明项目背景、核心挑战和预期成果]
`

  // 为了保证响应格式与稳定性，在 deepseek 时通常指定一个较大的上下文即可
  const stream = await openai.chat.completions.create({
    model: 'deepseek-chat', // 默认使用 deepseek v3/chat 模型
    messages: [
      { role: 'system', content: systemPrompt.trim() },
      { role: 'user', content: `【我要学习的技术】: ${config.techName}\n\n【我的水平】: ${config.level}\n\n【我的目标】: ${config.goal}${config.domain ? `\n\n【我的应用方向】: ${config.domain}（请确保课程中的业务场景举例、实战项目选题都围绕这个方向展开）` : ''}\n\n【提供给你的官方文档参考资料 (如果内容残缺表示获取失败，请用你的底座知识补充)】:\n${config.docContent}` }
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
