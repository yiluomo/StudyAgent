<script setup lang="ts">
import { ref, computed } from 'vue'
import MarkdownBlocks from './MarkdownBlocks.vue'
import { useProgressStore } from '../../stores/progressStore'
import { usePlanStore } from '../../stores/planStore'
import { useSettingStore } from '../../stores/settingStore'

const props = defineProps<{
  index: number
  title: string
  content: string
  stage?: string
}>()

const progressStore = useProgressStore()
const planStore = usePlanStore()
const settingStore = useSettingStore()

const isLearned = computed(() => {
  return progressStore.isStepCompleted(planStore.form.techName, props.title)
})

const isGeneratingDetails = ref(false)
const selectionMenu = ref({ show: false, x: 0, y: 0, text: '' })

const handleLearn = async (e: Event) => {
  e.stopPropagation()
  // 先执行状态切换
  progressStore.toggleStep(planStore.form.techName, props.title)
  
  // 此时 isLearned.value 应该是最新的响应式结果
  if (isLearned.value) { // 意味着现在状态是「已掌握」
    setTimeout(() => {
      const planStructure = planStore.planMarkdown ? planStore.parsedPlan : null
      if (planStructure && props.index < planStructure.steps.length - 1) {
        planStore.setActiveStep(props.index + 1)
      }
    }, 450) // 缩短一点，让体感更灵敏
  }
}

const handleExpandStep = async () => {
  if (isGeneratingDetails.value) return
  isGeneratingDetails.value = true
  try {
    await planStore.expandStepAction(
      props.title, 
      props.content, 
      planStore.form.techName, 
      settingStore.deepseekKey
    )
  } finally {
    isGeneratingDetails.value = false
  }
}

const handleMouseUp = (e: MouseEvent) => {
  const selection = window.getSelection()
  const text = selection?.toString().trim()
  
  if (text && text.length > 0) {
    selectionMenu.value = {
      show: true,
      x: e.pageX,
      y: e.pageY - 40,
      text: text
    }
  } else {
    selectionMenu.value.show = false
  }
}

const askAssistant = () => {
  alert(`正在请教助教解释「${selectionMenu.value.text}」... (功能连接中)`)
  selectionMenu.value.show = false
}
</script>

<template>
  <div 
    :id="'step-' + index" 
    class="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden mb-4 transition-all duration-300"
    :class="{ 'opacity-80 grayscale-[20%]': isLearned }"
    @mouseup="handleMouseUp"
  >
    <!-- Stage Indicator Badge -->
    <div v-if="stage" class="px-5 py-2.5 bg-brand-50 border-b border-brand-100/50 flex items-center justify-between">
       <div class="flex items-center gap-2">
          <span class="flex h-2 w-2 rounded-full bg-brand-500"></span>
          <span class="text-[10px] font-black text-brand-600 uppercase tracking-widest">{{ stage }}</span>
       </div>
       <div class="text-[10px] text-brand-300 font-bold tracking-tighter cursor-default select-none">MILESTONE</div>
    </div>

    <!-- Header -->
    <div class="px-5 py-4 flex items-center justify-between bg-gray-50/50">
      <div class="flex items-center gap-3">
        <div class="w-7 h-7 rounded-sm flex items-center justify-center font-black text-xs"
             :class="isLearned ? 'bg-green-100 text-green-700' : 'bg-brand-500 text-white shadow-sm'">
          {{ index + 1 }}
        </div>
        <h3 class="font-bold text-gray-900">{{ title }}</h3>
      </div>
      <div class="flex items-center gap-2">
         <span v-if="isLearned" class="text-[10px] font-bold text-green-600 px-2 py-0.5 bg-green-50 rounded-full">已掌握</span>
      </div>
    </div>

    <!-- Content Area -->
    <div class="px-6 py-6 border-t border-gray-100/50">
      <!-- 原始大纲思路 -->
      <div class="mb-8">
        <h4 class="text-xs font-black text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span class="w-1.5 h-1.5 bg-gray-200 rounded-full"></span>
          本节学习大纲与思路
        </h4>
        <MarkdownBlocks :content="content" />
      </div>

      <!-- 扩充后的详细课件内容 -->
      <div v-if="planStore.expandedContent[title]" class="mt-8 pt-8 border-t border-gray-100 animate-fade-in">
        <h4 class="text-xs font-black text-brand-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <span class="w-1.5 h-1.5 bg-brand-500 rounded-full"></span>
          详细课件内容及案例
        </h4>
        <div class="bg-gray-50/30 rounded-2xl p-6 border border-gray-50 prose prose-brand max-w-none">
          <MarkdownBlocks :content="planStore.expandedContent[title]" />
        </div>
      </div>

      <!-- 动作条 -->
      <div class="mt-10 flex flex-wrap items-center justify-between pt-6 border-t border-gray-100 gap-4">
        <div class="flex items-center gap-3">
          <button 
             v-if="!planStore.expandedContent[title]"
             @click="handleExpandStep"
             :disabled="isGeneratingDetails"
             class="group flex items-center gap-2 px-6 py-3 bg-brand-50 text-brand-700 rounded-xl font-bold hover:bg-brand-100 transition-all border border-brand-100 disabled:opacity-50"
          >
            <template v-if="isGeneratingDetails">
              <div class="w-4 h-4 border-2 border-brand-500 border-t-transparent animate-spin rounded-full"></div>
              <span>正在生成详细课件与代码...</span>
            </template>
            <template v-else>
              <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>生成详细内容与案例</span>
            </template>
          </button>

          <span class="text-xs text-gray-400 font-medium">💡 对思路不清晰？点击按钮由 AI 扩充具体代码和原理。</span>
        </div>

        <button 
           @click.stop="handleLearn"
           class="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-sm active:scale-95"
           :class="isLearned 
             ? 'bg-green-50 text-green-600 border border-green-100'
             : 'bg-green-600 text-white hover:bg-green-500 hover:shadow-green-600/20'"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ isLearned ? '已通关' : '打卡学习' }}</span>
        </button>
      </div>
    </div>

    <!-- 划词悬浮菜单 -->
    <div 
      v-if="selectionMenu.show" 
      :style="{ left: selectionMenu.x + 'px', top: selectionMenu.y + 'px' }"
      class="fixed z-[100] animate-bounce-in"
    >
      <button 
        @click="askAssistant"
        class="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white rounded-lg shadow-2xl text-xs font-bold hover:bg-brand-600 transition-colors border border-white/20"
      >
        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        解释「{{ selectionMenu.text.substring(0, 10) }}{{ selectionMenu.text.length > 10 ? '...' : '' }}」
      </button>
    </div>
  </div>
</template>
