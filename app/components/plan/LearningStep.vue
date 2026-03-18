<script setup lang="ts">
import { ref, computed } from 'vue'
import MarkdownBlocks from './MarkdownBlocks.vue'
import { useProgressStore } from '../../stores/progressStore'
import { usePlanStore } from '../../stores/planStore'

const props = defineProps<{
  index: number
  title: string
  content: string
}>()

const isExpanded = ref(true) // 默认展开

const progressStore = useProgressStore()
const planStore = usePlanStore()

// 当其所属的技术分支与标题名一致时判断为学过
const isLearned = computed(() => {
  return progressStore.isStepCompleted(planStore.form.techName, props.title)
})

const handleLearn = async (e: Event) => {
  e.stopPropagation() // 防止触发折叠事件
  progressStore.toggleStep(planStore.form.techName, props.title)
  
  if (isLearned.value) {
    // 撒花庆祝效果 - 通过原生 DOM 拉取 CDN，彻底隔离 SSR 引擎解析
    if (typeof window !== 'undefined') {
      const runConfetti = () => {
        // @ts-ignore
        if (window.confetti) {
          // @ts-ignore
          window.confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 }, colors: ['#22c55e', '#3b82f6', '#8b5cf6'] })
        }
      }

      // @ts-ignore
      if (window.confetti) {
        runConfetti()
      } else {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js'
        script.onload = () => runConfetti()
        document.head.appendChild(script)
      }
    }
    // 自动折叠本章，逼迫往下走
    isExpanded.value = false
  }
}
</script>

<template>
  <div class="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden mb-4 transition-all duration-300 hover:shadow-md"
       :class="{ 'opacity-80 grayscale-[20%]': isLearned }">
    <!-- Header（可折叠点按区） -->
    <button 
      @click="isExpanded = !isExpanded"
      class="w-full px-5 py-4 flex items-center justify-between bg-gray-50/50 hover:bg-brand-50/50 transition-colors focus:outline-none"
    >
      <div class="flex items-center gap-3 text-left">
        <!-- 序列圆角标识牌 -->
        <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors"
             :class="isLearned ? 'bg-green-100 text-green-700' : 'bg-brand-100 text-brand-700'">
          <svg v-if="isLearned" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
          <span v-else>{{ index + 1 }}</span>
        </div>
        <!-- 纯干标题 -->
        <h3 class="text-base sm:text-lg font-bold transition-colors"
            :class="isLearned ? 'text-gray-500 line-through' : 'text-gray-900 group-hover:text-brand-700'">
          {{ title }}
        </h3>
      </div>
      
      <!-- 卡片开合指示箭头 -->
      <div class="text-gray-400 transition-transform duration-300 flex-shrink-0 ml-4" :class="{ 'rotate-180': isExpanded }">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </button>

    <!-- Content (高能折叠排版展现动画区，使用 Grid 强制排开) -->
    <div 
      class="grid transition-all duration-300 ease-in-out"
      :class="isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
    >
      <div class="overflow-hidden">
        <div class="px-5 pb-6 pt-2 border-t border-gray-100/50">
          <!-- 递归调入 Markdown 分块解析核心 -->
          <MarkdownBlocks :content="content" />

          <!-- 完成本章的打卡器 -->
          <div class="mt-8 flex justify-end items-center pt-4 border-t border-dashed border-gray-200">
            <button 
               @click.stop="handleLearn"
               class="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
               :class="isLearned 
                 ? 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200'
                 : 'bg-green-500 text-white hover:bg-green-400 hover:shadow-green-500/20'"
            >
              <svg v-if="!isLearned" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ isLearned ? '撤销打卡 (需温习)' : '已经自测通过！下一步' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
