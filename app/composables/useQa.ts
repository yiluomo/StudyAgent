import { ref } from 'vue'
import { usePlanStore } from '../stores/planStore'
import { useSettingStore } from '../stores/settingStore'
import type { QaMessage } from '../../types'

export const useQa = () => {
  const planStore = usePlanStore()
  const settingStore = useSettingStore()

  // 以本地为生，不需要全局 store，随面板生存
  const messages = ref<QaMessage[]>([])
  const isStriving = ref(false)

  const askQuestion = async (question: string) => {
    if (!question.trim() || isStriving.value) return

    if (!settingStore.isConfigured) {
      alert('请先在设置中配置 API Key')
      return
    }

    // 将用户问题打屏
    messages.value.push({ role: 'user', content: question, timestamp: Date.now() })
    
    // 增加一个助手回答位（初始为空）
    const assistantMsgIndex = messages.value.length
    messages.value.push({ role: 'assistant', content: '', timestamp: Date.now() })
    
    isStriving.value = true

    try {
      // 提取目前积攒的有价值历史上下文送回（最多回溯 5 条以省 tokens）
      const historyContext = messages.value
        .slice(0, assistantMsgIndex)
        .slice(-6)
        .map(m => ({ role: m.role, content: m.content }))

      const response = await fetch('/api/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          techName: planStore.form.techName,
          docContent: planStore.docContent,
          planMarkdown: planStore.planMarkdown,
          history: historyContext,
          deepseekKey: settingStore.deepseekKey,
        }),
      })

      if (!response.ok || !response.body) {
         throw new Error('QA Request Failed')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const chunkText = decoder.decode(value, { stream: true })
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
                   const activeMsg = messages.value[assistantMsgIndex]
                   if (activeMsg) activeMsg.content += parsed.token
                }
              }
            } catch (e) {
              // 忽略截断报错
            }
          }
        }
      }
    } catch (error: any) {
      const activeMsg = messages.value[assistantMsgIndex]
      if (activeMsg) activeMsg.content = `⚠️ 请求失败: ${error.message}`
    } finally {
      isStriving.value = false
    }
  }

  return {
    messages,
    isStriving,
    askQuestion
  }
}
