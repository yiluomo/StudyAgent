<template>
  <div class="min-h-screen bg-white text-gray-900 font-sans selection:bg-brand-200 selection:text-brand-900 overflow-hidden">
    <main class="w-full h-screen">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useProgressStore } from './stores/progressStore'
import { onMounted } from 'vue'

const progressStore = useProgressStore()

// 在启动时设定下全局的 Title SEO
useSeoMeta({
  title: 'StudyAgent - 结构化技术学习计划生成器',
  description: '输入任何技术名称，Agent 自动抓取最新文档并结合 DeepSeek 帮你生成针对性、带测试题的互动式学习计划。',
})

// 统一载入本地的学习进度
onMounted(() => {
  progressStore.initFromLocal()
})
</script>

<style>
/* 隐藏进度条样式，如果有需求可以在 phase-3 加 nprogress */
</style>
