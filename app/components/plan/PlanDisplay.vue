<script setup lang="ts">
import { computed } from 'vue'
import { usePlanStore } from '../../stores/planStore'
import { useProgressStore } from '../../stores/progressStore'
import { parsePlanStructure } from '../../composables/useMarkdownParser'
import LearningStep from './LearningStep.vue'
import MarkdownBlocks from './MarkdownBlocks.vue'
import LoadingSpinner from '../ui/LoadingSpinner.vue'

const planStore = usePlanStore()
const progressStore = useProgressStore()

// 数据流一旦收到 SSE 的 Token，将会响应式驱动进行正则划片并自动在页面结构化映射！
const structure = computed(() => parsePlanStructure(planStore.planMarkdown))

// 全局响应进度（0-100）
const currentProgress = computed(() => {
  return progressStore.getTechProgress(planStore.form.techName, structure.value.steps.length)
})

// 处理生成初期：网络延迟导致尚未出现规范大标题时，不能空着白板。给一个骨架态或回显态
const showRaw = computed(() => {
  return planStore.status === 'generating' && 
         !structure.value.intro && 
         structure.value.steps.length === 0 && 
         !structure.value.outro
})

const handleExportCourse = () => {
  const content = `# ${planStore.form.techName} 学习课件\n\n> 生成时间: ${new Date().toLocaleString()}\n\n---\n\n${planStore.planMarkdown}`
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `StudyCourse_${planStore.form.techName.replace(/\s+/g, '_')}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="w-full relative">
    
    <!-- 刚生成时没捕捉到标题时，使用基础显示的消隐过度态 -->
    <div v-if="showRaw" class="animate-pulse bg-white/60 rounded-3xl p-6 shadow-sm border border-gray-100 backdrop-blur">
       <div class="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
       <div class="h-4 bg-gray-200 rounded w-2/4 mb-4"></div>
       <div class="h-4 bg-gray-200 rounded w-1/3"></div>
       <pre class="whitespace-pre-wrap font-sans text-gray-400 mt-4 max-h-20 px-2 overflow-hidden text-xs">{{ planStore.planMarkdown }}...正在脑补中</pre>
    </div>

    <!-- 结构化魔法卡片展现区 -->
    <div v-else class="space-y-6 lg:space-y-8 animate-fade-in">
      
      <!-- 导语与场景概览 -->
      <div v-if="structure.intro.trim()" class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 border-t-brand-500 border-t-4 transition-all">
        <MarkdownBlocks :content="structure.intro" />
      </div>

      <!-- 当前选中课时 -->
      <div v-if="structure.steps.length > 0" class="w-full">
         
         <!-- 全局错误浮窗：用于显示内容扩充失败或 API 报错 -->
         <Transition name="fade">
           <div v-if="planStore.error" class="mb-6 animate-slide-up">
              <div class="bg-red-50 border border-red-100 text-red-600 px-4 py-4 rounded-2xl flex items-start gap-3 shadow-sm">
                 <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 <div class="flex-1">
                    <p class="text-sm font-bold">操作执行遇到问题</p>
                    <p class="text-xs opacity-80 mt-1">{{ planStore.error }}</p>
                 </div>
                 <button @click="planStore.error = null" class="p-1 hover:bg-red-100 rounded-lg">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                 </button>
              </div>
           </div>
         </Transition>

         <!-- 总进度看板区 -->
        <div class="mb-8 p-6 bg-white rounded-3xl shadow-sm border border-gray-100">
           <div class="flex justify-between items-end mb-3">
             <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
               <svg class="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
               </svg>
               全路径进阶大纲（共 {{ structure.steps.length }} 课时）
             </h2>
             <span class="text-2xl font-black text-brand-600 tracking-tighter">{{ currentProgress }}%</span>
           </div>
           
           <div class="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
             <div class="h-full bg-gradient-to-r from-brand-400 to-green-400 transition-all duration-1000 ease-out" 
                  :style="{ width: `${currentProgress}%` }">
             </div>
           </div>
        </div>
        <!-- 仅展示当前激活的章节 (单课时模式) -->
        <div class="relative min-h-[400px]">
          <LearningStep 
            v-if="structure.steps[planStore.activeStepIndex]"
            :key="planStore.activeStepIndex"
            :index="planStore.activeStepIndex"
            :title="structure.steps[planStore.activeStepIndex].title"
            :content="structure.steps[planStore.activeStepIndex].content"
            :stage="structure.steps[planStore.activeStepIndex].stage"
          />
          
          <!-- 分页控制器 -->
          <div class="mt-10 flex items-center justify-between gap-4">
             <button 
               @click="planStore.activeStepIndex > 0 && planStore.setActiveStep(planStore.activeStepIndex - 1)"
               :disabled="planStore.activeStepIndex === 0"
               class="flex items-center gap-2 px-5 py-3 border border-gray-200 bg-white text-gray-700 rounded-2xl font-bold hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
             >
               <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
               </svg>
               上一课时
             </button>

             <div class="text-sm font-bold text-gray-400">
               {{ planStore.activeStepIndex + 1 }} / {{ structure.steps.length }}
             </div>

             <button 
               @click="planStore.activeStepIndex < structure.steps.length - 1 && planStore.setActiveStep(planStore.activeStepIndex + 1)"
               :disabled="planStore.activeStepIndex === structure.steps.length - 1"
               class="group flex items-center gap-2 px-8 py-3 bg-brand-500 text-white rounded-2xl font-black hover:bg-brand-600 disabled:bg-gray-200 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-200 active:scale-95"
             >
               <span>下一课时</span>
               <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
               </svg>
             </button>
          </div>
        </div>
      </div>

      <!-- 实战项目展现区 -->
      <div v-if="structure.outro.trim()" class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 transition-all">
        <MarkdownBlocks :content="structure.outro" />
      </div>

      <!-- 快捷导出课件 -->
      <div v-if="planStore.status === 'done'" class="flex justify-center flex-wrap gap-4 mt-8 pt-4 pb-8 transition-all animate-fade-in">
         <button @click="handleExportCourse" class="flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl hover:bg-black group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all shadow-xl active:scale-[0.98]">
           <svg class="w-5 h-5 text-brand-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
           </svg>
           <span class="font-black">导出完整课件 (.md)</span>
         </button>
      </div>

    </div>

    <!-- 推送心跳动画针在底部打标 -->
    <div v-if="planStore.status === 'generating'" class="mt-4 flex items-center justify-center p-2 text-brand-500 absolute -bottom-10 left-1/2 -translate-x-1/2">
       <LoadingSpinner />
    </div>
  </div>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.98);
}
</style>
