import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { stepTitle, context, techName, deepseekKey } = body

  if (!deepseekKey) {
    throw new Error('Missing API Key')
  }

  const prompt = `
你是一名顶级技术架构师和金牌讲师。
当前用户正在研习 ${techName} 技术，目前所在章节是：${stepTitle}。

【已有的大纲背景】：
${context}

【任务要求】：
请针对该章节生成一份【极其详尽】且【具有实战深度】的正式课件。
你的输出必须包含以下核心版块：
1. **🚀 深度原理剖析**：不要只说知识点，要深入底层（如源码级、协议级或架构级）讲解其运作机理。
2. **💻 生产级代码实战**：提供一个可以直接拷贝、注释详尽的完整代码案例。
3. **⚠️ 避坑与性能优化**：列出在实际大厂开发中会遇到的坑（Gotchas）以及对应的优化建议。
4. **🏢 行业应用场景**：描述这个技术点在实际业务（如电商、金融、社交）中是如何落地的。

【禁令】：
- **禁止** 只是复读或稍微润色已有的大纲思路。
- **禁止** 只给出一级列表，必须有丰富的正文解释。
- **必须** 包含至少一个 Markdown 代码块。
- 输出内容必须显著长于并深于原大纲内容。

请直接输出 Markdown 内容，不需要任何开场白。
`

  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 150000) // 服务端给予 150 秒超长容忍

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }]
      }),
      signal: controller.signal
    })
    
    clearTimeout(id)

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      return { error: errData.error?.message || `HTTP ${response.status} Error` }
    }

    const data = await response.json()
    return {
      content: data.choices[0].message.content
    }
  } catch (err: any) {
    console.error('Expansion error:', err)
    return { error: err.name === 'AbortError' ? '生成内容超时, 请重试' : err.message }
  }
})
