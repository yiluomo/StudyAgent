import { usePlanStore } from '../stores/planStore'
import { useSettingStore } from '../stores/settingStore'

export const useLearningPlan = () => {
  const planStore = usePlanStore()
  const settingStore = useSettingStore()

  const generatePlan = async () => {
    // 基础校验
    if (!planStore.form.techName.trim()) {
      planStore.setError('请输入你想学习的框架或技术名称')
      return
    }

    if (!settingStore.isConfigured) {
      planStore.setError('请先在设置中配置必需的 API Key')
      return
    }

    try {
      // 1. 抓取文档
      planStore.setStatus('fetching-docs')
      planStore.error = null
      planStore.planMarkdown = '' // 重置之前的 Markdown

      const docsResponse = await $fetch('/api/fetch-docs', {
        method: 'POST',
        body: {
          techName: planStore.form.techName,
          tavilyKey: settingStore.tavilyKey,
        },
      })

      planStore.setDocResult({
        docContent: docsResponse.docContent,
        sourceUrl: docsResponse.sourceUrl,
        fallback: docsResponse.fallback,
        cached: docsResponse.cached,
      })

      // 2. 将结果和用户偏好丢给大模型生成计划（流式）
      planStore.setStatus('generating')

      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...planStore.form,
          docContent: planStore.docContent,
          deepseekKey: settingStore.deepseekKey,
        }),
      })

      if (!response.ok || !response.body) {
        const errText = await response.text()
        throw new Error(`Failed to generate plan: ${errText}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const chunkText = decoder.decode(value, { stream: true })
        // chunkText 可能是多个 Server-Sent Events 发回来的拼接字符
        // event: message \n data: {"token":"123"}
        const lines = chunkText.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '')
            try {
              if (dataStr.trim()) {
                const parsed = JSON.parse(dataStr)
                if (parsed.error) {
                  throw new Error(parsed.error)
                }
                if (parsed.token) {
                  planStore.appendToken(parsed.token)
                }
                if (parsed.done) {
                  // 完成
                  break
                }
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', dataStr, e)
            }
          }
        }
      }

      planStore.setStatus('done')
    } catch (err: any) {
      console.error('Workflow error:', err)
      planStore.setError(err.message || '未知错误导致生成失败')
    }
  }

  return {
    generatePlan,
  }
}
