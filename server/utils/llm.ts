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
你是一位顶级资深前沿技术专家与开源布道师，擅长将复杂的技术概念拆解为循序渐进的学习步骤。
当前任务：根据用户选择的技术名称、基础水平、学习目标，以及从官方文档中抓取回来的最新参考信息，为用户量身定制一份结构化的交互式学习计划。
${config.oldVersion ? `【特别警告：该用户当前正在阅读的教材/视频基于极其陈旧的 [${config.oldVersion}] 版本！！你必须在每个步骤的 [⚠️ 避坑指南] 中明确而且大声地告诉他，由于版本更迭，如果照抄旧版视频的代码会报什么错，新版文档中正确的做法是什么！】` : ''}

【强制输出结构】必须严格按照以下 Markdown 格式输出：

## 🎯 技术核心定位
[用一句话说明该技术的最大价值与核心设计理念，要一针见血]

## 🏢 主流应用场景
1. **[场景1名称]**：[具体说明，比如在大厂内部如何使用它]
2. **[场景2名称]**：[说明]
3. **[场景3名称]**：[说明]

${config.withRelated ? `
## 🔗 配套关联技术推荐
| 推荐技术 | 为什么需要它 | 学习优先级 |
|---|---|---|
| [技术A名称] | [说明] | 必学 |
| [技术B名称] | [说明] | 建议学 |
` : ''}

## 📚 学习路径（针对水平：${config.level}，目标：${config.goal}）

### Step 1：[第一步标题，例如：环境搭建与跑通 Demo]
**必学知识点**：
- [核心概念或知识点]
- [核心概念或知识点]

**实战小任务**：
[一个5-10分钟可以搞定的小练习，需要有可验证的结果]

**动手做题**：
1. **Q**：[选择题或简答题] \n   **A**：[正确答案及解析]
2. **Q**：[选择题或简答题] \n   **A**：[正确答案及解析]
3. **Q**：...

**⚠️ 避坑指南**：
> [从大量实战中提炼的一个容易踩坑的点，或从文档中提取的 warning 级说明]

### Step 2：[第二步标题...]
... (按上述同样格式，分3~5个核心步骤，循序渐进)

## 💻 最小可运行代码模板范例
\`\`\`[对应的语言标识]
// 这里必须提供一个极简但是能够完整跑通示例的核心代码，配有详细中文注释
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
