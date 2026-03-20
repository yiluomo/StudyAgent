import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { stepTitle, context, techName, deepseekKey } = body

  if (!deepseekKey) {
    throw new Error('Missing API Key')
  }

  const prompt = `
你是一名擅长深入浅出讲解各类知识的资深导师。
当前用户正在学习「${techName}」，目前所在章节是：${stepTitle}。

【已有的大纲背景】：
${context}

【核心任务】：
针对该章节，生成一份以「概念理解」为核心的深度讲解文档。根据主题自动判断领域，用该领域的专业视角展开讲解。

【必须包含的版块】：
1. **📖 核心概念解析**：用清晰的语言解释本节涉及的所有关键名词和概念，说明它们是什么、为什么存在、解决了什么问题。
2. **🔗 概念关系图谱**：用文字或简单列表说明本节各概念之间的关系与依赖，帮助建立整体认知框架。
3. **💡 关键示例**：提供能说明核心概念的最小化示例（代码、公式、案例或图示描述均可），重点在于展示「这个概念长什么样」。示例必须有注释或说明解释每个关键部分的含义，且不超过 25 行。
4. **⚠️ 常见误区**：列出初学者对这些概念最容易产生的误解，并给出正确理解。

【严格禁令】：
- **禁止** 提供完整的可直接套用的项目方案。
- **禁止** 只罗列条目，必须解释每个概念背后的设计意图或原理。
- **必须** 用通俗语言解释，避免堆砌术语而不解释。

请直接输出 Markdown 内容，不需要任何开场白。
`

  const RETRIES = 2

  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const controller = new AbortController()
      const id = setTimeout(() => controller.abort(), 150000)

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
      return { content: data.choices[0].message.content }

    } catch (err: any) {
      console.error(`Expansion error (attempt ${attempt + 1}):`, err)

      const isRetryable = err.cause?.code === 'ECONNRESET' || err.name === 'TypeError'
      if (isRetryable && attempt < RETRIES) {
        await new Promise(r => setTimeout(r, 1500))
        continue
      }

      return { error: err.name === 'AbortError' ? '生成内容超时，请重试' : `网络连接失败，请重试 (${err.cause?.code || err.message})` }
    }
  }
})
