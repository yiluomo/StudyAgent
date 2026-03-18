<script setup lang="ts">
import { usePlanStore } from '../../stores/planStore'

const config = useRuntimeConfig()
const planStore = usePlanStore()

// 本地绑定便于双向数据，失焦或提交时写入 Pinia
const inputValue = computed({
  get: () => planStore.form.techName,
  set: (val: string) => planStore.updateForm({ techName: val })
})

const oldVersionValue = computed({
  get: () => planStore.form.oldVersion || '',
  set: (val: string) => planStore.updateForm({ oldVersion: val })
})

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    // 阻止默认提交，交由外部接管
    e.preventDefault()
  }
}
</script>

<template>
  <div class="space-y-3 relative w-full">
    <!-- 主搜框 -->
    <div class="relative w-full">
      <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <svg class="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
        </svg>
      </div>
      <input 
        type="text"
        v-model="inputValue"
        @keydown="handleKeydown"
        class="block w-full pl-11 pr-4 py-4 text-lg text-gray-900 bg-white border-2 border-transparent shadow-sm rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-500 transition-all font-medium placeholder-gray-400"
        placeholder="你想学什么技术的新版？如：Next.js 14、React 19"
        required
      />
    </div>

    <!-- 旧版兼容配置区 -->
    <div class="flex items-center gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100 transition-all focus-within:border-brand-300">
      <div class="flex-shrink-0 text-amber-500">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div class="flex-1">
        <input 
          type="text"
          v-model="oldVersionValue"
          class="block w-full bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400"
          placeholder="(选填) 我正在看老视频，帮我避坑。如：视频用的还是 React 17..."
        />
      </div>
    </div>
  </div>
</template>
