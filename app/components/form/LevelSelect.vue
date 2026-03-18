<script setup lang="ts">
import { usePlanStore } from '../../stores/planStore'
import { LEVEL_OPTIONS, type LevelType } from '../../../types'

const planStore = usePlanStore()

const localLevel = computed({
  get: () => planStore.form.level,
  set: (val: LevelType) => planStore.updateForm({ level: val })
})
</script>

<template>
  <div class="flex flex-col mb-4">
    <label class="block text-sm font-semibold text-gray-700 mb-2">自身基础水平</label>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <label 
        v-for="opt in LEVEL_OPTIONS" 
        :key="opt.value"
        class="relative flex cursor-pointer rounded-xl border p-3 text-center transition-all hover:bg-gray-50 focus:outline-none"
        :class="[
          localLevel === opt.value 
            ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500 shadow-sm' 
            : 'border-gray-200 bg-white text-gray-600'
        ]"
      >
        <!-- 隐藏的 input -->
        <input 
          type="radio" 
          v-model="localLevel" 
          :value="opt.value" 
          class="sr-only" 
        />
        <span class="w-full text-sm font-medium">{{ opt.label }}</span>
      </label>
    </div>
  </div>
</template>
