import { defineStore } from 'pinia'
import type { AppStatus, PlanState, StudyFormInput } from '../../types'

/**
 * 学习计划核心 Store
 * 管理：表单数据、文档抓取状态、学习计划流式输出
 */
export const usePlanStore = defineStore('plan', {
  state: (): PlanState => ({
    status: 'idle',
    error: null,

    form: {
      techName: '',
      oldVersion: '',
      level: 'elementary',
      goal: 'quickstart',
      withRelated: false,
    },

    docContent: '',
    sourceUrl: '',
    isFallback: false,
    isCached: false,

    planMarkdown: '',
  }),

  getters: {
    isLoading: (state) =>
      state.status === 'fetching-docs' || state.status === 'generating',

    hasResult: (state) => state.status === 'done' && state.planMarkdown.length > 0,

    hasFallbackWarning: (state) => state.isFallback && state.status === 'done',
  },

  actions: {
    setStatus(status: AppStatus) {
      this.status = status
    },

    setError(error: string) {
      this.status = 'error'
      this.error = error
    },

    updateForm(partial: Partial<StudyFormInput>) {
      this.form = { ...this.form, ...partial }
    },

    setDocResult(result: {
      docContent: string
      sourceUrl: string
      fallback: boolean
      cached: boolean
    }) {
      this.docContent = result.docContent
      this.sourceUrl = result.sourceUrl
      this.isFallback = result.fallback
      this.isCached = result.cached
    },

    // 流式追加 token
    appendToken(token: string) {
      this.planMarkdown += token
    },

    // 重置为初始状态
    reset() {
      this.status = 'idle'
      this.error = null
      this.docContent = ''
      this.sourceUrl = ''
      this.isFallback = false
      this.isCached = false
      this.planMarkdown = ''
    },
  },
})
