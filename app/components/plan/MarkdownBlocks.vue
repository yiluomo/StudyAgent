<script setup lang="ts">
import { computed } from 'vue'
import { parseToBlocks } from '../../composables/useMarkdownParser'
// @ts-ignore (可能有些 IDE 的识别延迟)
import CodeBlock from './CodeBlock.vue'

const props = defineProps<{ content: string }>()

// 使用 composable 把带混合 Code 的 Markdown 切割成 Block 阵列
const blocks = computed(() => parseToBlocks(props.content))
</script>

<template>
  <div class="space-y-4">
    <template v-for="(block, idx) in blocks" :key="idx">
      <!-- Html 流采用 Tailwind Typography 覆盖顶级样式 -->
      <div 
        v-if="block.type === 'html'" 
        class="prose prose-sm sm:prose-base prose-slate max-w-none 
               prose-headings:font-bold prose-headings:text-gray-800 
               prose-a:text-brand-600 hover:prose-a:text-brand-700
               prose-code:text-brand-600 prose-code:bg-brand-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
               prose-li:marker:text-brand-500
               prose-table:border prose-table:border-gray-200 
               prose-th:bg-gray-50 prose-th:px-4 prose-th:py-2 prose-th:border prose-th:border-gray-200
               prose-td:px-4 prose-td:py-2 prose-td:border prose-td:border-gray-200
               markdown-body transition-all" 
        v-html="block.content"
      ></div>
      
      <!-- Vue 原生的交互组件 -->
      <ClientOnly v-else-if="block.type === 'code'">
        <CodeBlock 
          :code="block.code" 
          :lang="block.lang" 
        />
      </ClientOnly>
    </template>
  </div>
</template>
