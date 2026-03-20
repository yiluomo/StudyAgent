import { createEventStream } from 'h3'
import type { GeneratePlanRequest, StreamChunk } from '../../types'
import { createStudyPlanStream } from '../utils/llm'

export default defineEventHandler(async (event) => {
  const body = await readBody<GeneratePlanRequest>(event)

  if (!body.techName || !body.docContent) {
    throw createError({
      statusCode: 400,
      message: 'techName and docContent are required',
    })
  }

  if (!body.deepseekKey) {
    throw createError({
      statusCode: 400,
      message: 'DeepSeek API Key is missing. Please configure it in settings.',
    })
  }

  const config = useRuntimeConfig(event)

  // 创建 SSE (Server-Sent Events) 流对象
  const eventStream = createEventStream(event)

  // 为了不阻塞整个 response，我们在一个异步自执行函数中完成推送逻辑
  ;(async () => {
    try {
      const gptStream = await createStudyPlanStream({
        apiKey: body.deepseekKey,
        baseUrl: config.deepseekBaseUrl,
        techName: body.techName,
        oldVersion: body.oldVersion,
        level: body.level,
        goal: body.goal,
        domain: body.domain,
        withRelated: body.withRelated,
        docContent: body.docContent,
      })

      // 遍历 AI 模型的返回块并推入客户端
      for await (const chunk of gptStream) {
        // DeepSeek/OpenAI 兼容返回结构
        const text = chunk.choices[0]?.delta?.content || ''
        if (text) {
          const streamChunk: StreamChunk = { token: text }
          eventStream.push({
            event: 'message',
            data: JSON.stringify(streamChunk),
          })
        }
      }

      // 最后推送一个结束信号
      eventStream.push({
        event: 'message',
        data: JSON.stringify({ done: true } as StreamChunk),
      })
    } catch (error: any) {
      console.error('LLM Streaming Error:', error)
      eventStream.push({
        event: 'message',
        data: JSON.stringify({ error: error.message || 'Error occurred during generation' } as StreamChunk),
      })
    } finally {
      // 必须关闭流，否则客户端会认为一直被 pending
      eventStream.close()
    }
  })()

  // 立即返回 stream 给客户端进行持续监听
  return eventStream.send()
})
