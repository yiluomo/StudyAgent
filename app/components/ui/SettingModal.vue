<script setup lang="ts">
import { useSettingStore } from '../../stores/settingStore'

const isOpen = ref(false)
const settingStore = useSettingStore()

const localDeepseekKey = ref('')
const localTavilyKey = ref('')

// 组件挂载时从 localStorage 初始化
onMounted(() => {
  settingStore.loadFromLocal()
  localDeepseekKey.value = settingStore.deepseekKey
  localTavilyKey.value = settingStore.tavilyKey
})

const openModal = () => {
  localDeepseekKey.value = settingStore.deepseekKey
  localTavilyKey.value = settingStore.tavilyKey
  isOpen.value = true
}

const saveSettings = () => {
  settingStore.setKeys(localDeepseekKey.value.trim(), localTavilyKey.value.trim())
  settingStore.saveToLocal()
  isOpen.value = false
}
</script>

<template>
  <div>
    <!-- 触发按钮 -->
    <button
      @click="openModal"
      class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      API 配置
      <!-- 提示小红点 -->
      <span v-if="!settingStore.isConfigured" class="relative flex h-2 w-2">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
      </span>
    </button>

    <!-- 弹窗蒙层 -->
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
      <div class="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-slide-up">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 class="text-lg font-semibold text-gray-900">系统环境与鉴权设置</h3>
          <button @click="isOpen = false" class="text-gray-400 hover:text-gray-500 focus:outline-none">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="px-6 py-5 space-y-5">
          <div class="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
            您的 API Key 仅保存在本地浏览器中，绝不会上传至服务器，请放心使用。
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">DeepSeek API Key</label>
            <input 
              v-model="localDeepseekKey"
              type="password"
              placeholder="sk-..."
              class="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-shadow"
            />
            <p class="mt-1 text-xs text-gray-500">
              用于驱动核心智脑输出交互式代码与教程。前往 <a href="https://platform.deepseek.com/" target="_blank" class="text-brand-600 hover:underline">DeepSeek 平台</a> 获取。
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tavily Search API Key</label>
            <input 
              v-model="localTavilyKey"
              type="password"
              placeholder="tvly-..."
              class="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-shadow"
            />
            <p class="mt-1 text-xs text-gray-500">
              专为 AI 设计极速爬虫。前往 <a href="https://tavily.com/" target="_blank" class="text-brand-600 hover:underline">Tavily</a> 免费注册获取。
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button 
            @click="isOpen = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            取消
          </button>
          <button 
            @click="saveSettings"
            class="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            保存并应用
          </button>
        </div>
        
      </div>
    </div>
  </div>
</template>
