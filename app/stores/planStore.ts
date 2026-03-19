import { defineStore } from 'pinia'
import type { AppStatus, PlanState, StudyFormInput } from '../../types'
import { parsePlanStructure } from '../composables/useMarkdownParser'

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
    notes: {},

    savedPlans: [],
    currentPlanId: null,
    activeStepIndex: 0,
    expandedContent: {},

    // UI 状态
    leftSidebarOpen: true,
    rightSidebarOpen: true,
  }),

  getters: {
    isLoading: (state) =>
      state.status === 'fetching-docs' || state.status === 'generating',

    hasResult: (state) => (state.status === 'done' || !!state.currentPlanId) && state.planMarkdown.length > 0,

    hasFallbackWarning: (state) => state.isFallback && state.status === 'done',
    
    // 获取特定步骤的笔记
    getNote: (state) => (stepTitle: string) => state.notes[stepTitle] || '',

    // 格式化后的所有笔记内容（用于导出）
    allNotesMarkdown: (state) => {
      let content = `# ${state.form.techName} 学习笔记\n\n`
      content += `> 生成时间: ${new Date().toLocaleString()}\n\n---\n\n`
      
      const titles = Object.keys(state.notes).sort()
      if (titles.length === 0) return content + "*快去记录你的第一条笔记吧*"
      
      titles.forEach(title => {
        const noteText = state.notes[title]
        if (noteText && noteText.trim()) {
          content += `## 📝 ${title}\n${noteText}\n\n`
        }
      })
      return content
    },

    // 核心解析器：将 Markdown 转化为结构化对象
    parsedPlan: (state) => {
      return parsePlanStructure(state.planMarkdown)
    }
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

    toggleLeftSidebar() {
      this.leftSidebarOpen = !this.leftSidebarOpen
    },

    toggleRightSidebar() {
      this.rightSidebarOpen = !this.rightSidebarOpen
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

    // 完成后自动存档
    archiveCurrentPlan() {
      if (!this.planMarkdown) return
      
      const id = Date.now().toString()
      const newPlan = {
        id,
        form: { ...this.form },
        planMarkdown: this.planMarkdown,
        notes: { ...this.notes },
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      
      this.savedPlans.unshift(newPlan)
      this.currentPlanId = id
      this.saveAllToStorage()
    },

    // 切换当前激活的步骤
    setActiveStep(index: number) {
      this.activeStepIndex = index
    },

    // 切换到历史计划
    switchPlan(id: string) {
      const plan = this.savedPlans.find(p => p.id === id)
      if (plan) {
        this.currentPlanId = id
        this.form = { ...plan.form }
        this.planMarkdown = plan.planMarkdown
        this.notes = { ...plan.notes }
        this.status = 'done'
        this.activeStepIndex = 0 // 切换计划时重置进度
      }
    },
    
    // 缓存扩充后的详细课件
    setExpandedContent(title: string, content: string) {
      this.expandedContent[title] = content
      this.saveAllToStorage()
    },

    async expandStepAction(stepTitle: string, context: string, techName: string, deepseekKey: string) {
      if (!deepseekKey) {
        this.error = '请先点击右上角「设置」配置 DeepSeek API Key 再尝试扩充内容。'
        return
      }

      try {
        const response = await $fetch<{ content?: string; error?: string }>('/api/expand-step', {
          method: 'POST',
          body: {
            stepTitle,
            context,
            techName,
            deepseekKey
          },
          timeout: 120000 // 深度生成通常需要 1~2 分钟，给予更多预留
        })
        if (response && response.content) {
          this.setExpandedContent(stepTitle, response.content)
          this.error = null
        } else if (response && response.error) {
          this.error = `生成课件失败: ${response.error}`
        }
      } catch (e: any) {
        console.error('Failed to expand step:', e)
        this.error = '网络请求超时或 API 调用失败，请稍后刷新重试。'
      }
    },

    // 更新笔记并持久化
    updateNote(stepTitle: string, content: string) {
      this.notes[stepTitle] = content
      if (this.currentPlanId) {
        const plan = this.savedPlans.find(p => p.id === this.currentPlanId)
        if (plan) {
          plan.notes = { ...this.notes }
          plan.updatedAt = Date.now()
        }
      }
      this.saveAllToStorage()
    },

    // 笔记整理功能：去除空行、统一标题格式
    organizeNotes() {
      const organized: Record<string, string> = {}
      Object.keys(this.notes).forEach(title => {
        const noteText = this.notes[title]
        if (noteText) {
          const content = noteText.trim()
          if (content) {
            organized[title] = content.split('\n').map(line => line.trim()).filter(line => line).join('\n')
          }
        }
      })
      this.notes = organized
      this.saveAllToStorage()
    },

    saveAllToStorage() {
      if (typeof window !== 'undefined') {
        localStorage.setItem('study_agent_saved_plans', JSON.stringify(this.savedPlans))
      }
    },

    loadAllPlans() {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('study_agent_saved_plans')
        if (saved) {
          try {
            this.savedPlans = JSON.parse(saved)
          } catch (e) {
            console.error('Failed to parse saved plans', e)
          }
        }
      }
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
      this.notes = {}
      this.currentPlanId = null
    },
  },
})
