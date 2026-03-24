import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { stepTitle, context, techName, deepseekKey } = body

  if (!deepseekKey) {
    return { error: 'Missing API Key' }
  }

  const prompt = `
你是一位出题专家。用户正在学习「${techName}」，当前章节是：${stepTitle}。

【章节内容】：
${context}

【出题要求】：
根据章节内容出 4 道单选题，难度适中，考察核心概念理解而非死记硬背。

【严格要求】：
- 必须返回合法的 JSON 数组，不要有任何多余文字、markdown 标记或代码块包裹
- 每道题有且仅有 4 个选项
- answer 是正确选项的索引（0、1、2 或 3）
- explanation 简明解释为什么正确，以及其他选项错在哪

返回格式（直接输出 JSON，不要加 \`\`\`）：
[
  {
    "question": "题目",
    "options": ["选项A", "选项B", "选项C", "选项D"],
    "answer": 0,
    "explanation": "解析"
  }
]
`

  const RETRIES = 2
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const controller = new AbortController()
      const id = setTimeout(() => controller.abort(), 60000)

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepseekKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
        }),
        signal: controller.signal
      })

      clearTimeout(id)

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        return { error: errData.error?.message || `HTTP ${response.status}` }
      }

      const data = await response.json()
      const raw = data.choices[0].message.content.trim()

      // 容错：去掉可能的 markdown 代码块包裹
      const jsonStr = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim()
      const questions = JSON.parse(jsonStr)
      return { questions }

    } catch (err: any) {
      const isRetryable = err.cause?.code === 'ECONNRESET' || err.name === 'TypeError'
      if (isRetryable && attempt < RETRIES) {
        await new Promise(r => setTimeout(r, 1500))
        continue
      }
      return { error: err.name === 'AbortError' ? '生成超时，请重试' : err.message }
    }
  }
})
