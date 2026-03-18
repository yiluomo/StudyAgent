<script setup lang="ts">
import { usePlanStore } from '../../stores/planStore'
import { GOAL_OPTIONS, type GoalType } from '../../../types'

const planStore = usePlanStore()

const localGoal = computed({
  get: () => planStore.form.goal,
  set: (val: GoalType) => planStore.updateForm({ goal: val })
})
</script>

<template>
  <div class="flex flex-col mb-4">
    <label class="block text-sm font-semibold text-gray-700 mb-2">核心学习诉求</label>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <label 
        v-for="opt in GOAL_OPTIONS" 
        :key="opt.value"
        class="relative flex cursor-pointer rounded-xl border p-3 items-center justify-center transition-all hover:bg-gray-50 focus:outline-none"
        :class="[
          localGoal === opt.value 
            ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500 shadow-sm' 
            : 'border-gray-200 bg-white text-gray-600'
        ]"
      >
        <input 
          type="radio" 
          v-model="localGoal" 
          :value="opt.value" 
          class="sr-only" 
        />
        <span class="text-sm font-medium">{{ opt.label }}</span>
      </label>
    </div>
  </div>
</template>
