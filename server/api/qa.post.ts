import { createEventStream } from 'h3'
import type { QaRequest, StreamChunk } from '../../types'
import { createQaStream } from '../utils/llm'

export default defineEventHandler(async (event) => {
  const body = await readBody<QaRequest>(event)

  if (!body.techName || !body.question) {
    throw createError({
      statusCode: 400,
      message: 'techName and question are required',
    })
  }

  if (!body.deepseekKey) {
    throw createError({
      statusCode: 400,
      message: 'DeepSeek API Key is missing. Please configure it in settings.',
    })
  }

  const config = useRuntimeConfig(event)
  const eventStream = createEventStream(event)

  ;(async () => {
    try {
      const gptStream = await createQaStream({
         apiKey: body.deepseekKey,
         baseUrl: config.deepseekBaseUrl,
         techName: body.techName,
         docContent: body.docContent,
         planMarkdown: body.planMarkdown,
         question: body.question,
         history: body.history || [],
      })

      for await (const chunk of gptStream) {
        const text = chunk.choices[0]?.delta?.content || ''
        if (text) {
          eventStream.push({
            event: 'message',
            data: JSON.stringify({ token: text }),
          })
        }
      }

      eventStream.push({
        event: 'message',
        data: JSON.stringify({ done: true }),
      })
    } catch (error: any) {
      console.error('QA Streaming Error:', error)
      eventStream.push({
        event: 'message',
        data: JSON.stringify({ error: error.message || 'Error occurred during QA' }),
      })
    } finally {
      eventStream.close()
    }
  })()

  return eventStream.send()
})
