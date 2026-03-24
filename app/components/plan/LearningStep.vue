<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import MarkdownBlocks from './MarkdownBlocks.vue'
import StepQuiz from './StepQuiz.vue'
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
  progressStore.toggleStep(planStore.form.techName, props.title)
  
  if (isLearned.value) {
    setTimeout(() => {
      const planStructure = planStore.planMarkdown ? planStore.parsedPlan : null
      if (planStructure && props.index < planStructure.steps.length - 1) {
        planStore.setActiveStep(props.index + 1)
      }
    }, 450)
  }
}

// 测验通过后自动触发（不需要手动点按钮）
const handleLearnAuto = () => {
  setTimeout(() => {
    const planStructure = planStore.planMarkdown ? planStore.parsedPlan : null
    if (planStructure && props.index < planStructure.steps.length - 1) {
      planStore.setActiveStep(props.index + 1)
    }
  }, 1200)
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

// 用 mouseup 捕获选中文字，但只在内容区域内触发
const handleMouseUp = (e: MouseEvent) => {
  // 如果点击的是划词菜单本身，不处理
  const target = e.target as HTMLElement
  if (target.closest('[data-selection-menu]')) return

  // 延迟一帧，确保浏览器已完成选区更新
  setTimeout(() => {
    const selection = window.getSelection()
    const text = selection?.toString().trim()
    if (text && text.length > 2) {
      selectionMenu.value = {
        show: true,
        x: e.clientX,
        y: e.clientY - 48,
        text,
      }
    }
  }, 10)
}

// 点击页面任意位置关闭菜单
const handleGlobalClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('[data-selection-menu]')) {
    selectionMenu.value.show = false
  }
}

// 选区清空时也关闭
const handleSelectionChange = () => {
  const selection = window.getSelection()
  if (!selection || selection.toString().trim() === '') {
    selectionMenu.value.show = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleGlobalClick)
  document.addEventListener('selectionchange', handleSelectionChange)
})

onUnmounted(() => {
  document.removeEventListener('click', handleGlobalClick)
  document.removeEventListener('selectionchange', handleSelectionChange)
})

const handleExportStep = () => {
  const techName = planStore.form.techName
  const outline = props.content
  const expanded = planStore.expandedContent[props.title] || ''

  let md = `# ${techName} — 课时 ${props.index + 1}：${props.title}\n\n`
  if (props.stage) md += `> 所属阶段：${props.stage}\n\n`
  md += `---\n\n## 学习大纲\n\n${outline}\n\n`
  if (expanded) md += `---\n\n## 详细课件\n\n${expanded}\n\n`

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${techName}_Step${props.index + 1}_${props.title.replace(/[^\w\u4e00-\u9fa5]/g, '_').substring(0, 30)}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const askAssistant = () => {
  alert(`正在请教助教解释「${selectionMenu.value.text}」... (功能连接中)`)
  selectionMenu.value.show = false
  window.getSelection()?.removeAllRanges()
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

      <!-- 课时测验 -->
      <StepQuiz
        :step-index="index"
        :title="title"
        :context="content"
        @passed="handleLearnAuto"
      />

      <!-- 动作条 -->
      <div class="mt-10 flex flex-wrap items-center justify-between pt-6 border-t border-gray-100 gap-4">
        <div class="flex items-center gap-3 flex-wrap">
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

          <!-- 导出当前课时 -->
          <button
            @click.stop="handleExportStep"
            class="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm text-sm"
            title="导出当前课时为 Markdown"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            导出本课时
          </button>
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
    <Teleport to="body">
      <div 
        v-if="selectionMenu.show" 
        data-selection-menu
        :style="{ left: selectionMenu.x + 'px', top: selectionMenu.y + 'px' }"
        class="fixed z-[200]"
      >
        <button 
          @click.stop="askAssistant"
          class="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white rounded-lg shadow-2xl text-xs font-bold hover:bg-brand-600 transition-colors border border-white/20 select-none"
        >
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          解释「{{ selectionMenu.text.substring(0, 10) }}{{ selectionMenu.text.length > 10 ? '...' : '' }}」
        </button>
      </div>
    </Teleport>
  </div>
</template>
