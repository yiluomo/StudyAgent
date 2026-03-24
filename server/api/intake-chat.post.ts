import { createEventStream } from 'h3'
import type { StreamChunk } from '../../types'
import OpenAI from 'openai'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { history, deepseekKey } = body

  if (!deepseekKey) {
    throw createError({ statusCode: 400, message: 'Missing API Key' })
  }

  const config = useRuntimeConfig(event)

  const systemPrompt = `你是一位友善的学习顾问，负责通过简短对话了解用户的学习需求，帮助他们明确学习目标。

你的任务是通过 3-5 轮对话，自然地收集以下信息：
1. 想学什么（techName）
2. 当前基础水平（level：beginner/elementary/intermediate/advanced）
3. 学习目标（goal：quickstart/project/interview）
4. 应用方向（domain，可选）

【对话原则】
- 每次只问一个问题，语气轻松自然，不要像填表格
- 根据用户回答灵活追问，不要死板地按顺序问
- 当你认为已经收集到足够信息时，在回复末尾附上一个 JSON 块，格式如下：

<FORM_DATA>
{"techName":"xxx","level":"elementary","goal":"quickstart","domain":"xxx"}
</FORM_DATA>

- domain 如果用户没提到可以省略或留空
- level 和 goal 必须是规定的枚举值
- 在输出 FORM_DATA 之前，先用一句话总结你的理解，让用户确认

开场白示例：「你好！告诉我你想学什么，我来帮你规划一条最适合你的学习路径 😊」`

  const openai = new OpenAI({
    apiKey: deepseekKey,
    baseURL: config.deepseekBaseUrl || 'https://api.deepseek.com',
  })

  const eventStream = createEventStream(event)

  ;(async () => {
    try {
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...(history || []),
      ]

      const stream = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
        stream: true,
      })

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || ''
        if (text) {
          eventStream.push({ event: 'message', data: JSON.stringify({ token: text } as StreamChunk) })
        }
      }

      eventStream.push({ event: 'message', data: JSON.stringify({ done: true } as StreamChunk) })
    } catch (err: any) {
      eventStream.push({ event: 'message', data: JSON.stringify({ error: err.message } as StreamChunk) })
    } finally {
      eventStream.close()
    }
  })()

  return eventStream.send()
})
