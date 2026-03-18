<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Highlighter } from 'shiki'

const props = defineProps<{
  code: string
  lang: string
}>()

const htmlStr = ref('')
const isLoading = ref(true)
const isCopied = ref(false)

// 单例共享一个被缓存的全局 Highlighter 实例（规避 Vue 并发性能问题）
const getShiki = (() => {
  // 因为这是在浏览器环境调用，只在客户发起交互后进行高开销加载
  let hlPromise: Promise<Highlighter> | null = null
  return async () => {
    if (!hlPromise) {
      const { createHighlighter } = await import('shiki')
      hlPromise = createHighlighter({
        themes: ['github-dark'],
        langs: ['javascript', 'typescript', 'vue', 'python', 'html', 'css', 'bash', 'json', 'markdown', 'rust', 'go', 'java', 'c', 'cpp']
      })
    }
    return hlPromise
  }
})()

watch(() => props.code, async (newCode) => {
  if (!newCode) return
  
  // 增加 SSR 安全逃生舱：在构建时服务端绝不触碰 Shiki
  if (typeof window === 'undefined') {
    htmlStr.value = `<pre><code>${newCode}</code></pre>`
    isLoading.value = false
    return
  }

  isLoading.value = true
  try {
    const highlighter = await getShiki()
    const loadedLangs = highlighter.getLoadedLanguages()
    const langToUse = loadedLangs.includes(props.lang as any) ? props.lang : 'javascript'
    
    htmlStr.value = highlighter.codeToHtml(newCode, { 
      lang: langToUse, 
      theme: 'github-dark' 
    })
  } catch (err) {
    console.error('Shiki error', err)
    // 保护性降级
    htmlStr.value = `<pre><code>${newCode}</code></pre>`
  } finally {
    isLoading.value = false
  }
}, { immediate: true })

const doCopy = async () => {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(props.code)
    isCopied.value = true
    setTimeout(() => { isCopied.value = false }, 2000)
  }
}
</script>

<template>
  <div class="relative group rounded-xl overflow-hidden bg-[#24292e] shadow-lg my-4 text-sm font-mono border border-gray-700/50">
     <!-- 语言标识与极客风一键复制栏 -->
     <div class="flex justify-between items-center px-4 py-2 bg-[#1f2428] border-b border-gray-700/50 text-gray-400 select-none">
       <span class="text-xs uppercase tracking-wider">{{ lang || 'text' }}</span>
       <button 
        @click="doCopy" 
        class="flex items-center gap-1.5 hover:text-white transition-colors focus:outline-none"
        :class="{ 'text-green-400 hover:text-green-400': isCopied }"
       >
         <svg v-if="!isCopied" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
         </svg>
         <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
         </svg>
         <span class="text-xs">{{ isCopied ? '已复制' : '复制' }}</span>
       </button>
     </div>

     <!-- Native Code Highlight 面板区 -->
     <div class="relative">
       <div v-if="isLoading" class="absolute inset-0 bg-[#24292e]/50 flex items-center justify-center backdrop-blur-sm z-10 transition-opacity">
         <div class="w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></div>
       </div>

       <!-- shiki 内部包含结构化的 html、style 和 pre/code，用 v-html 去接并用 Tailwind 覆盖内边距 -->
       <div 
         v-html="htmlStr" 
         class="overflow-x-auto min-h-[4rem] text-[13px] leading-[1.6] [&>pre]:!p-4 [&>pre]:!bg-transparent [&>pre]:!m-0 outline-none" 
       ></div>
     </div>
  </div>
</template>
