<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { usePlanStore } from '../../stores/planStore'
import { useSettingStore } from '../../stores/settingStore'
import type { QaMessage } from '../../../types'

const emit = defineEmits<{ close: [] }>()

const planStore = usePlanStore()
const settingStore = useSettingStore()

const messages = ref<QaMessage[]>([])
const inputVal = ref('')
const isThinking = ref(false)
const scrollArea = ref<HTMLElement | null>(null)
const parsedForm = ref<Record<string, string> | null>(null)

// 自动滚动
watch(messages, () => {
  nextTick(() => {
    if (scrollArea.value) scrollArea.value.scrollTop = scrollArea.value.scrollHeight
  })
}, { deep: true })

// 开场：自动发一条空消息触发 AI 开场白
const init = async () => {
  await sendToAI()
}
init()

async function sendToAI(userText?: string) {
  if (userText) {
    messages.value.push({ role: 'user', content: userText, timestamp: Date.now() })
  }

  const assistantIndex = messages.value.length
  messages.value.push({ role: 'assistant', content: '', timestamp: Date.now() })
  isThinking.value = true

  try {
    const history = messages.value
      .slice(0, assistantIndex)
      .map(m => ({ role: m.role, content: m.content }))

    const res = await fetch('/api/intake-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history, deepseekKey: settingStore.deepseekKey }),
    })

    if (!res.ok || !res.body) throw new Error('请求失败')

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      const lines = decoder.decode(value, { stream: true }).split('\n')
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const parsed = JSON.parse(line.replace('data: ', ''))
          if (parsed.token) {
            fullText += parsed.token
            messages.value[assistantIndex].content = fullText
          }
        } catch {}
      }
    }

    // 检测是否包含 FORM_DATA
    const match = fullText.match(/<FORM_DATA>([\s\S]*?)<\/FORM_DATA>/)
    if (match) {
      try {
        parsedForm.value = JSON.parse(match[1].trim())
        // 从显示内容中移除 FORM_DATA 块
        messages.value[assistantIndex].content = fullText.replace(/<FORM_DATA>[\s\S]*?<\/FORM_DATA>/, '').trim()
      } catch {}
    }
  } catch (e: any) {
    messages.value[assistantIndex].content = `⚠️ 出错了：${e.message}`
  } finally {
    isThinking.value = false
  }
}

const send = async () => {
  const text = inputVal.value.trim()
  if (!text || isThinking.value) return
  inputVal.value = ''
  await sendToAI(text)
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}

const applyForm = () => {
  if (!parsedForm.value) return
  const f = parsedForm.value
  planStore.updateForm({
    techName: f.techName || '',
    level: (f.level as any) || 'elementary',
    goal: (f.goal as any) || 'quickstart',
    domain: f.domain || '',
  })
  emit('close')
}
</script>

<template>
  <div class="w-full bg-white border border-gray-100 rounded-3xl shadow-xl overflow-hidden animate-slide-up">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>
        <span class="font-bold text-gray-800 text-sm">课程规划顾问</span>
        <span class="text-xs text-gray-400 font-normal">告诉我你想学什么，我来帮你规划</span>
      </div>
      <button @click="emit('close')" class="text-gray-300 hover:text-gray-500 transition-colors p-1">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- 消息区 -->
    <div ref="scrollArea" class="h-72 overflow-y-auto p-5 space-y-4">
      <template v-for="(msg, idx) in messages" :key="idx">
        <!-- 用户 -->
        <div v-if="msg.role === 'user'" class="flex justify-end">
          <div class="bg-brand-500 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%] text-sm">
            {{ msg.content }}
          </div>
        </div>
        <!-- AI -->
        <div v-else class="flex items-start gap-2">
          <div class="w-7 h-7 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0 text-xs font-black">S</div>
          <div class="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%] text-sm text-gray-700 leading-relaxed">
            <template v-if="msg.content.trim() === '' && isThinking">
              <div class="flex gap-1 items-center h-5">
                <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay:0.1s"></div>
                <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay:0.2s"></div>
              </div>
            </template>
            <span v-else class="whitespace-pre-wrap">{{ msg.content }}</span>
          </div>
        </div>
      </template>
    </div>

    <!-- 填入表单按钮（检测到 FORM_DATA 后出现） -->
    <div v-if="parsedForm" class="px-5 pb-3 animate-fade-in">
      <button
        @click="applyForm"
        class="w-full flex items-center justify-center gap-2 py-3 bg-brand-500 text-white rounded-2xl font-black hover:bg-brand-600 transition-all shadow-lg shadow-brand-200 text-sm active:scale-[0.98]"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        一键填入表单，开始生成课程
      </button>
    </div>

    <!-- 输入区 -->
    <div class="px-5 pb-5">
      <div class="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition-all">
        <input
          v-model="inputVal"
          @keydown="handleKeydown"
          :disabled="isThinking"
          placeholder="输入你的回答..."
          class="flex-1 bg-transparent text-sm outline-none placeholder-gray-400 disabled:opacity-50"
        />
        <button
          @click="send"
          :disabled="!inputVal.trim() || isThinking"
          class="p-1.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
