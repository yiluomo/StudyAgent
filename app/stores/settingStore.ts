import { defineStore } from 'pinia'

export const useSettingStore = defineStore('setting', {
  state: () => ({
    // 用户的 API Key，保存在客户端状态中
    deepseekKey: '',
    tavilyKey: '',
  }),

  // 如果 Key 已配置，则可使用
  getters: {
    isConfigured: (state) => !!state.deepseekKey && !!state.tavilyKey,
  },

  actions: {
    setKeys(deepseek: string, tavily: string) {
      this.deepseekKey = deepseek
      this.tavilyKey = tavily
    },
    
    // 初始化时从本地存储加载（Phase 1 暂不依赖持久化插件，手动处理即可）
    loadFromLocal() {
      if (typeof window !== 'undefined') {
        this.deepseekKey = localStorage.getItem('study_deepseek_key') || ''
        this.tavilyKey = localStorage.getItem('study_tavily_key') || ''
      }
    },

    saveToLocal() {
      if (typeof window !== 'undefined') {
        localStorage.setItem('study_deepseek_key', this.deepseekKey)
        localStorage.setItem('study_tavily_key', this.tavilyKey)
      }
    }
  },
})
