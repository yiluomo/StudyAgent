<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePlanStore } from '../../stores/planStore'
import { DOMAIN_PRESETS } from '../../../types'

const planStore = usePlanStore()
const customInput = ref('')
const isCustom = ref(false)

const selected = computed(() => planStore.form.domain || '')

const select = (val: string) => {
  isCustom.value = false
  customInput.value = ''
  planStore.updateForm({ domain: val === selected.value ? '' : val })
}

const enableCustom = () => {
  isCustom.value = true
  planStore.updateForm({ domain: '' })
}

const onCustomBlur = () => {
  if (!customInput.value.trim()) isCustom.value = false
}

const onCustomInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  customInput.value = val
  planStore.updateForm({ domain: val.trim() })
}
</script>

<template>
  <div class="flex flex-col mb-4">
    <label class="block text-sm font-semibold text-gray-700 mb-2">
      应用方向
      <span class="text-xs font-normal text-gray-400 ml-1">（选填，让内容场景更贴合你的实际工作）</span>
    </label>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="preset in DOMAIN_PRESETS"
        :key="preset"
        type="button"
        @click="select(preset)"
        class="px-3 py-1.5 rounded-lg border text-sm font-medium transition-all"
        :class="selected === preset && !isCustom
          ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500'
          : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'"
      >
        {{ preset }}
      </button>
      <button
        v-if="!isCustom"
        type="button"
        @click="enableCustom"
        class="px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-sm text-gray-400 hover:border-brand-400 hover:text-brand-500 transition-all"
      >
        + 自定义
      </button>
      <input
        v-else
        :value="customInput"
        @input="onCustomInput"
        @blur="onCustomBlur"
        autofocus
        placeholder="如：医疗 SaaS、量化交易..."
        class="px-3 py-1.5 rounded-lg border border-brand-400 text-sm outline-none focus:ring-2 focus:ring-brand-100 w-44"
      />
    </div>
  </div>
</template>
