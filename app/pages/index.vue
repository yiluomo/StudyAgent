<script setup lang="ts">
import TechInput from '../components/form/TechInput.vue'
import LevelSelect from '../components/form/LevelSelect.vue'
import GoalSelect from '../components/form/GoalSelect.vue'
import DomainInput from '../components/form/DomainInput.vue'
import LoadingSpinner from '../components/ui/LoadingSpinner.vue'
import PlanDisplay from '../components/plan/PlanDisplay.vue'
import QaPanel from '../components/qa/QaPanel.vue'
import SidebarLeft from '../components/layout/SidebarLeft.vue'
import SidebarRight from '../components/layout/SidebarRight.vue'
import SettingModal from '../components/ui/SettingModal.vue'

import { computed, watch, onMounted } from 'vue'
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

// 自动加载该技术的历史笔记
watch(() => planStore.form.techName, (newVal) => {
  if (newVal) {
    planStore.loadAllPlans()
  }
})

onMounted(() => {
  planStore.loadAllPlans()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50/30 flex overflow-hidden">
    <!-- Left Sidebar -->
    <SidebarLeft />

    <!-- Main Content wrapper -->
    <main 
      class="flex-1 transition-all duration-300 overflow-y-auto h-screen"
      :class="[
        planStore.leftSidebarOpen ? 'lg:pl-64' : 'pl-0',
        planStore.rightSidebarOpen ? 'lg:pr-80' : 'pr-0'
      ]"
    >
      <!-- Top nav toolbar -->
      <nav class="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur border-b border-gray-100 flex items-center justify-between px-6">
        <div class="flex items-center gap-4">
          <button 
            v-if="!planStore.leftSidebarOpen" 
            @click="planStore.toggleLeftSidebar"
            class="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-black text-sm shadow-sm">
              S
            </div>
            <h1 class="font-bold text-gray-900 tracking-tight">
              StudyAgent
            </h1>
          </div>
        </div>
        
        <div class="flex items-center gap-3">
          <!-- 返回首页/重新开始 -->
          <button 
            v-if="planStore.hasResult"
            @click="planStore.reset"
            class="flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg text-xs font-bold transition-all"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>重新定制</span>
          </button>

          <SettingModal />
          <div class="h-4 w-px bg-gray-200 mx-1"></div>
          <button 
            v-if="!planStore.rightSidebarOpen" 
            @click="planStore.toggleRightSidebar"
            class="flex items-center gap-2 px-3 py-1.5 bg-brand-50 text-brand-600 rounded-lg text-xs font-bold hover:bg-brand-100 transition-colors"
          >
             <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
             </svg>
             笔记
          </button>
        </div>
      </nav>

      <div class="flex flex-col items-center pt-10 pb-24 px-6 sm:px-10">
        
        <!-- 头部口号区：仅在未生成结果时展示 -->
        <div 
          v-if="!planStore.hasResult && planStore.status !== 'generating'"
          class="text-center transition-all duration-500 flex flex-col items-center mb-12"
        >
          <h1 class="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            输入学习目标，输出<span class="text-brand-600">专属课程</span>
          </h1>
          <p class="text-lg text-gray-500 max-w-xl font-medium">
            无论编程、设计、金融还是其他领域，为你量身定制结构化学习路径。
          </p>
        </div>

        <!-- 交互表单主区：仅在未生成结果时展示 -->
        <div v-if="!planStore.hasResult && planStore.status !== 'generating'" class="w-full max-w-2xl bg-white border border-gray-100 shadow-2xl shadow-brand-100/10 rounded-3xl p-6 sm:p-10 animate-slide-up relative z-10">
          <form @submit.prevent="onSubmit" class="space-y-6">
            <TechInput />
            <div class="border-t border-gray-50 my-6 h-px w-full"></div>
            <LevelSelect />
            <GoalSelect />
            <DomainInput />

            <!-- 报错提示区 -->
            <div v-show="planStore.error" class="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl flex items-start gap-2 border border-red-100">
              <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="font-medium break-all">{{ planStore.error }}</span>
            </div>

            <!-- 提交按钮 -->
            <div class="pt-6 flex justify-between items-center text-right">
              <button
                type="submit"
                :disabled="isGeneratingBtnDisabled"
                class="group relative ml-auto flex items-center gap-2 justify-center px-8 py-4 text-base font-black text-white bg-gray-900 rounded-2xl hover:bg-black disabled:bg-gray-200 disabled:cursor-not-allowed transition-all shadow-xl active:scale-[0.98]"
              >
                <span>一键定制精品课</span>
                <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </form>
        </div>

        <!-- 正在生成时的 Loading 状态占位 -->
        <div v-if="planStore.status === 'fetching-docs' || planStore.status === 'generating'" class="flex flex-col items-center justify-center py-20 space-y-6 animate-fade-in">
           <LoadingSpinner class="w-12 h-12" />
           <div class="text-2xl font-black text-gray-900 tracking-tight">
              {{ planStore.status === 'fetching-docs' ? '正在搜索相关资料...' : '正在为你定制学习计划...' }}
           </div>
           <p class="text-gray-400 font-medium">预计耗时 15-30 秒，深度内容值得等待。</p>
        </div>

        <!-- 学习看板内容区 -->
        <div v-if="planStore.hasResult || planStore.status === 'generating'" class="w-full max-w-3xl mt-16 animate-fade-in">
          <div v-if="planStore.hasFallbackWarning" class="mb-4 p-3 bg-brand-50 text-brand-700 border border-brand-200 rounded-lg text-xs flex items-center gap-2 w-fit">
            <span>⚠️</span> 
            <span>联网抓取受限，已切换为大模型底层基座知识生成。</span>
          </div>
          <PlanDisplay />
        </div>
      </div>
      
      <!-- 问答浮箱 -->
      <QaPanel v-if="planStore.hasResult" />
    </main>

    <!-- Right Note Sidebar -->
    <SidebarRight />

  </div>
</template>

<style scoped>
/* 仅仅针对表单内部容器动画增强一点质感 */
</style>
