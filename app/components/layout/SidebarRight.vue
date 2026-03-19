<script setup lang="ts">
import { usePlanStore } from '../../stores/planStore'
import { computed } from 'vue'

const planStore = usePlanStore()

const handleExportNotes = () => {
  const blob = new Blob([planStore.allNotesMarkdown], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `StudyNotes_${planStore.form.techName.replace(/\s+/g, '_')}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const handleOrganize = () => {
  planStore.organizeNotes()
}

// 侧边栏所有笔记内容摘要
const notesCount = computed(() => Object.keys(planStore.notes).length)
</script>

<template>
  <aside 
    class="fixed inset-y-0 right-0 z-40 w-80 bg-white border-l border-gray-100 flex flex-col transition-transform duration-300 transform"
    :class="planStore.rightSidebarOpen ? 'translate-x-0' : 'translate-x-full'"
  >
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <h2 class="font-bold text-gray-900">随堂笔记</h2>
        <span class="px-2 py-0.5 bg-brand-50 text-brand-600 text-[10px] font-black rounded-full">{{ notesCount }} 条</span>
      </div>
      <button @click="planStore.toggleRightSidebar" class="p-2 hover:bg-gray-50 rounded-lg text-gray-400">
        <svg class="w-5 h-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>
    </div>

    <!-- Notes List -->
    <div class="flex-1 overflow-y-auto p-6 space-y-6">
      <div v-for="(note, title) in planStore.notes" :key="title" class="group">
        <div class="flex items-center justify-between mb-2">
           <h4 class="text-xs font-black text-gray-400 uppercase tracking-tighter">{{ title }}</h4>
        </div>
        <textarea 
          :value="note"
          @input="e => planStore.updateNote(title as string, (e.target as HTMLTextAreaElement).value)"
          class="w-full min-h-[100px] p-4 bg-gray-50/50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-100 focus:border-brand-300 outline-none transition-all resize-y placeholder:text-gray-300"
          placeholder="暂无感悟..."
        ></textarea>
      </div>

      <div v-if="notesCount === 0" class="flex flex-col items-center justify-center h-full opacity-30 select-none pointer-events-none">
        <svg class="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <p class="text-sm font-bold">笔记暂无归位</p>
      </div>
    </div>

    <!-- Actions -->
    <div class="p-6 border-t border-gray-50 space-y-3 bg-gray-50/30">
      <button 
        @click="handleOrganize" 
        class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
      >
        <svg class="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        一键整理笔记
      </button>
      <button 
        @click="handleExportNotes" 
        class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-shadow shadow-lg active:scale-[0.98]"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        导出纯净笔记 (.md)
      </button>
    </div>
  </aside>
</template>
