import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useProgressStore = defineStore('progress', () => {
  // key 是 techName，value 是一组标明已经学完的【大章节标题】。
  // 注意，由于每次生成的规划可能不一样，我们暂且采用 title 的绝对精准比对来做锚点。
  const completedMap = ref<Record<string, string[]>>({})

  // 初始化从浏览器加载
  function initFromLocal() {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('study_agent_progress')
      if (stored) {
        try {
          completedMap.value = JSON.parse(stored)
        } catch (e) {
          console.warn('Failed to parse progress from localstorage')
        }
      }
    }
  }

  // 记录并下发保存
  function toggleStep(techName: string, stepTitle: string) {
    if (!techName || !stepTitle) return

    if (!completedMap.value[techName]) {
      completedMap.value[techName] = []
    }

    const arr = completedMap.value[techName]
    const idx = arr.indexOf(stepTitle)
    
    if (idx === -1) {
       arr.push(stepTitle)
    } else {
       arr.splice(idx, 1) // 取消打卡
    }
    
    // 写盘
    if (typeof localStorage !== 'undefined') {
       localStorage.setItem('study_agent_progress', JSON.stringify(completedMap.value))
    }
  }

  function isStepCompleted(techName: string, stepTitle: string): boolean {
    if (!completedMap.value[techName]) return false
    return completedMap.value[techName].includes(stepTitle)
  }

  // 计算当前这门技术的学习总体进度
  function getTechProgress(techName: string, totalSteps: number): number {
    if (totalSteps === 0) return 0
    if (!completedMap.value[techName]) return 0
    // 防止缓存超出当前的新卡片数量
    const validCount = Math.min(completedMap.value[techName].length, totalSteps)
    return Math.round((validCount / totalSteps) * 100)
  }

  return {
    completedMap,
    initFromLocal,
    toggleStep,
    isStepCompleted,
    getTechProgress
  }
})
