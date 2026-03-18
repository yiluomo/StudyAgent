<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { useQa } from '../../composables/useQa'
// 复用刚才写好的 Markdown 解析器与组件来渲染聊天！
import MarkdownBlocks from '../plan/MarkdownBlocks.vue'

const { messages, isStriving, askQuestion } = useQa()
const inputVal = ref('')
const scrollArea = ref<HTMLElement | null>(null)
const isPanelOpen = ref(false)

const send = async () => {
  const v = inputVal.value.trim()
  if (!v) return
  inputVal.value = ''
  await askQuestion(v)
}

const handleKeydown = (e: KeyboardEvent) => {
  // 阻止换行，按 Enter 直接发送
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}

// 自动滚动到底部
watch(() => messages.value, () => {
  nextTick(() => {
    if (scrollArea.value) {
      scrollArea.value.scrollTop = scrollArea.value.scrollHeight
    }
  })
}, { deep: true })
</script>

<template>
  <div>
    <!-- 悬浮召唤按钮 -->
    <div 
      class="fixed bottom-6 right-6 z-40 transition-transform duration-300"
      :class="isPanelOpen ? 'translate-x-32 opacity-0 pointer-events-none' : 'translate-x-0'"
    >
      <button 
        @click="isPanelOpen = true"
        class="group flex items-center gap-3 bg-gray-900 text-white px-5 py-3.5 rounded-full shadow-2xl hover:shadow-brand-500/20 hover:-translate-y-1 transition-all focus:outline-none"
      >
        <svg class="w-6 h-6 text-brand-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <span class="font-bold tracking-wide">遇到报错？问我</span>
      </button>
    </div>

    <!-- 侧边伸缩交互答疑面板 -->
    <div 
      class="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white sm:border-l border-gray-100 shadow-[0_0_50px_-15px_rgba(0,0,0,0.1)] z-50 flex flex-col transition-transform duration-500 ease-out"
      :class="isPanelOpen ? 'translate-x-0' : 'translate-x-full'"
    >
      <!-- Header -->
      <div class="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 backdrop-blur">
        <div class="flex items-center gap-3">
          <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <h3 class="font-bold text-gray-900">Study Agent <span class="text-sm font-normal text-gray-500 ml-1">专属助教</span></h3>
        </div>
        <button @click="isPanelOpen = false" class="text-gray-400 hover:text-gray-600 bg-white shadow-sm p-1.5 rounded-lg border border-gray-200">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- 消息流区 -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6" ref="scrollArea">
        <div v-if="messages.length === 0" class="h-full flex flex-col items-center justify-center text-gray-400 gap-4 opacity-70">
          <svg class="w-16 h-16 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p class="text-sm text-center max-w-[240px]">
            把跟着旧教程敲出来的代码、遇到的任何运行红端报错抛给我。
          </p>
        </div>

        <template v-for="(msg, idx) in messages" :key="idx">
          <!-- 用户气泡 -->
          <div v-if="msg.role === 'user'" class="flex justify-end animate-fade-in text-[15px]">
            <div class="bg-gray-100 text-gray-800 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%] whitespace-pre-wrap">
              {{ msg.content }}
            </div>
          </div>
          <!-- Agent 气泡 -->
          <div v-else class="flex justify-start animate-fade-in">
            <div class="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm mr-3">
              <span class="font-bold text-xs">AI</span>
            </div>
            <!-- 由于是编程类问题回答，使用之前写好的 Markdown 截断器保证高亮依然生效！ -->
            <div class="bg-white border border-gray-200 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
              <div v-if="msg.content.trim() === ''" class="flex gap-1.5 items-center h-5">
                <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
              </div>
              <MarkdownBlocks v-else :content="msg.content" class="!space-y-2 [&_p]:!m-0 text-[14px]" />
            </div>
          </div>
        </template>
      </div>

      <!-- 底端输入区 -->
      <div class="p-4 bg-white border-t border-gray-100">
        <div class="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:border-brand-500 focus-within:ring-brand-100 transition-all">
          <textarea
             v-model="inputVal"
             @keydown="handleKeydown"
             placeholder="粘贴报错信息，可直接黏贴多行代码..."
             class="w-full bg-transparent px-4 py-3 max-h-32 outline-none text-sm resize-none custom-scrollbar"
             rows="2"
          ></textarea>
          <button 
             @click="send" 
             :disabled="!inputVal.trim() || isStriving"
             class="absolute right-2 bottom-2 p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
             <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
             </svg>
          </button>
        </div>
        <p class="text-[10px] text-gray-400 text-center mt-3">Shift + Enter 换行 / Enter 发送</p>
      </div>

    </div>
    
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #e5e7eb;
  border-radius: 4px;
}
</style>
