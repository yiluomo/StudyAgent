<script setup lang="ts">
import TechInput from '../components/form/TechInput.vue'
import LevelSelect from '../components/form/LevelSelect.vue'
import GoalSelect from '../components/form/GoalSelect.vue'
import LoadingSpinner from '../components/ui/LoadingSpinner.vue'
import PlanDisplay from '../components/plan/PlanDisplay.vue'
import QaPanel from '../components/qa/QaPanel.vue'

import { usePlanStore } from '../stores/planStore'
import { useLearningPlan } from '../composables/useLearningPlan'

const planStore = usePlanStore()
const { generatePlan } = useLearningPlan()

const isGeneratingBtnDisabled = computed(() => {
  return planStore.isLoading || !planStore.form.techName.trim()
})

const onSubmit = async () => {
  await generatePlan()
}
</script>

<template>
  <div class="pt-10 pb-20 max-w-3xl mx-auto w-full flex flex-col items-center">
    
    <!-- 头部口号区：若还没有结果，居中放大展示 -->
    <div 
      class="text-center transition-all duration-500 flex flex-col items-center" 
      :class="planStore.hasResult ? 'mb-10 scale-90 opacity-70' : 'mb-16'"
    >
      <h1 class="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
        输入技术盲区，输出<span class="text-brand-600">最佳实践</span>
      </h1>
      <p class="text-lg text-gray-500 max-w-xl">
        StudyAgent 会为你实时抓取这项技术最新的官方文档，然后为你量身定做一个可实战的结构化学习进度。
      </p>
    </div>

    <!-- 交互表单主区 -->
    <div class="w-full bg-white/50 backdrop-blur-xl border border-gray-100 shadow-xl shadow-brand-100/20 rounded-3xl p-6 sm:p-8 animate-slide-up relative">
      <form @submit.prevent="onSubmit" class="space-y-6">
        <!-- 搜索大框 -->
        <TechInput />
        
        <div class="border-t border-gray-100 my-4 h-px w-full"></div>

        <!-- 偏好矩阵 -->
        <LevelSelect />
        <GoalSelect />

        <!-- 推荐技术联动开关 -->
        <div class="flex items-center justify-between py-2 border-t border-gray-100 mt-2 pt-4">
          <div>
            <span class="text-sm font-semibold text-gray-700 block">推荐相关生态组件？</span>
            <span class="text-xs text-gray-400">比如学 React 可能会为你推荐 Router 和 Zustand</span>
          </div>
          <button 
            type="button"
            @click="planStore.updateForm({ withRelated: !planStore.form.withRelated })"
            class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            :class="planStore.form.withRelated ? 'bg-brand-500' : 'bg-gray-200'"
          >
            <span 
              aria-hidden="true" 
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
              :class="planStore.form.withRelated ? 'translate-x-5' : 'translate-x-0'"
            />
          </button>
        </div>

        <!-- 报错提示区 -->
        <div v-show="planStore.error" class="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl flex items-start gap-2 border border-red-100">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="font-medium break-all">{{ planStore.error }}</span>
        </div>

        <!-- 提交按组 -->
        <div class="pt-4 flex justify-between items-center">
          <div class="flex text-sm">
            <!-- 加载状态展示 -->
             <div v-if="planStore.status === 'fetching-docs'" class="flex items-center text-brand-600 gap-2 animate-fade-in">
               <LoadingSpinner />
               <span>正在跨端网罗最新官方文档...</span>
             </div>
             <div v-else-if="planStore.status === 'generating'" class="flex items-center text-purple-600 gap-2 animate-fade-in">
               <LoadingSpinner />
               <span>AI大模型研判中，生成定制规划...</span>
             </div>
          </div>

          <button
            type="submit"
            :disabled="isGeneratingBtnDisabled"
            class="group relative flex items-center gap-2 justify-center px-6 py-3.5 text-base font-bold text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md active:scale-[0.98]"
          >
            <span>开始定制学习计划</span>
            <svg 
              class="w-5 h-5 transition-transform group-hover:translate-x-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </form>
    </div>

    <!-- 以下是智能化交互呈现的学习看板区（彻底取代黑板报） -->
    <div v-if="planStore.hasResult || planStore.status === 'generating'" class="w-full mt-10">
      
      <div class="mb-6 px-2">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">
          为「{{ planStore.form.techName }}」量身定制的演进之路
        </h2>
        
        <div v-if="planStore.hasFallbackWarning" class="p-3 bg-brand-50 text-brand-700 border border-brand-200 rounded-lg text-sm flex items-center gap-2 w-fit shadow-sm">
          <span>⚠️</span> 
          <span>由于搜索引擎被风控反爬或不可抗力，此方案由高基元模型自底蕴脑补而出。</span>
        </div>
      </div>

      <!-- 神器面世！ -->
      <PlanDisplay />
    </div>

    <!-- 仅当我们产出了干货给用户之后，这个贴身助教按钮才会探头出来！ -->
    <QaPanel v-if="planStore.hasResult" />

  </div>
</template>

<style scoped>
/* 仅仅针对表单内部容器动画增强一点质感 */
</style>
