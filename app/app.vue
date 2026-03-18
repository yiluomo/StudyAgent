<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-brand-200 selection:text-brand-900">
    <!-- 将头部设置全局留出一个安全区，让页面路由挂载在下方 -->
    <header class="sticky top-0 z-40 w-full backdrop-blur flex-none border-b border-gray-150 bg-white/70">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-xl shadow-inner shadow-brand-500/50">
            S
          </div>
          <span class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">StudyAgent</span>
        </div>
        <!-- API 配置悬浮弹窗引用口 -->
        <SettingModal />
      </div>
    </header>

    <!-- 路由主页面 -->
    <main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <NuxtPage />
    </main>

    <footer class="mt-20 py-8 text-center text-sm text-gray-400">
      <p>Powered by Nuxt 4 & DeepSeek AI / Created for Next-Gen Learning</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import SettingModal from './components/ui/SettingModal.vue'
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
