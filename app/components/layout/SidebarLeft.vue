<script setup lang="ts">
import { usePlanStore } from '../../stores/planStore'
import { parsePlanStructure } from '../../composables/useMarkdownParser'
import { computed } from 'vue'

const planStore = usePlanStore()

// 获取当前计划的大纲
const structure = computed(() => parsePlanStructure(planStore.planMarkdown))

const formatDate = (ts: number) => {
  return new Date(ts).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const handleSwitchPlan = (id: string) => {
  planStore.switchPlan(id)
}
</script>

<template>
  <aside 
    class="fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 transform"
    :class="planStore.leftSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <!-- Header -->
    <div class="p-6 border-b border-gray-50 flex items-center justify-between">
      <h2 class="font-black text-xl tracking-tight text-gray-900 flex items-center gap-2">
        <span class="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white text-xs">SA</span>
        Study Agent
      </h2>
      <button @click="planStore.toggleLeftSidebar" class="p-2 hover:bg-gray-50 rounded-lg text-gray-400">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>
    </div>

    <!-- History List -->
    <div class="flex-1 overflow-y-auto p-4 space-y-6">
      <section>
        <h3 class="px-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">历史路线图</h3>
        <div class="space-y-1">
          <button 
            v-for="plan in planStore.savedPlans" 
            :key="plan.id"
            @click="handleSwitchPlan(plan.id)"
            class="w-full text-left px-3 py-3 rounded-xl transition-all flex flex-col gap-1 group"
            :class="planStore.currentPlanId === plan.id ? 'bg-brand-50 text-brand-700' : 'hover:bg-gray-50 text-gray-600'"
          >
            <span class="font-bold text-sm truncate">{{ plan.form.techName }}</span>
            <span class="text-[10px] opacity-60">{{ formatDate(plan.createdAt) }}</span>
          </button>
          
          <div v-if="planStore.savedPlans.length === 0" class="p-4 text-center border-2 border-dashed border-gray-50 rounded-2xl">
            <p class="text-xs text-gray-400">尚无存档</p>
          </div>
        </div>
      </section>

      <!-- Current TOC -->
      <section v-if="structure.steps.length > 0">
        <h3 class="px-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">当前大纲</h3>
        <div class="space-y-1">
          <button 
            v-for="(step, idx) in structure.steps" 
            :key="idx"
            @click="planStore.setActiveStep(idx)"
            class="w-full text-left px-3 py-2 text-sm rounded-lg transition-all truncate"
            :class="planStore.activeStepIndex === idx ? 'bg-brand-500 text-white font-bold shadow-md shadow-brand-200' : 'text-gray-600 hover:text-brand-600 hover:bg-brand-50/50'"
          >
             {{ idx + 1 }}. {{ step.title }}
          </button>
        </div>
      </section>
    </div>

    <!-- Footer -->
    <div class="p-4 border-t border-gray-50 text-[10px] text-gray-400 text-center">
      v2.0 Bootcamp Edition
    </div>
  </aside>

  <!-- Overlay for mobile if needed -->
  <div 
    v-if="planStore.leftSidebarOpen" 
    @click="planStore.toggleLeftSidebar"
    class="fixed inset-0 bg-black/5 z-30 lg:hidden"
  ></div>
</template>
