<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePlanStore } from '../../stores/planStore'
import { useSettingStore } from '../../stores/settingStore'
import { useProgressStore } from '../../stores/progressStore'
import type { QuizQuestion } from '../../../types'

const props = defineProps<{
  stepIndex: number
  title: string
  context: string
}>()

const emit = defineEmits<{ passed: [] }>()

const planStore = usePlanStore()
const settingStore = useSettingStore()
const progressStore = useProgressStore()

const isGenerating = ref(false)
const submitted = ref(false)
const selected = ref<(number | null)[]>([])

const questions = computed<QuizQuestion[]>(() => planStore.quizzes[props.title] || [])
const hasQuiz = computed(() => questions.value.length > 0)

// 全部答对才算通过
const isPassed = computed(() =>
  submitted.value &&
  questions.value.every((q, i) => selected.value[i] === q.answer)
)

const wrongIndexes = computed(() =>
  questions.value.reduce<number[]>((acc, q, i) => {
    if (submitted.value && selected.value[i] !== q.answer) acc.push(i)
    return acc
  }, [])
)

const canSubmit = computed(() =>
  !submitted.value && selected.value.length === questions.value.length &&
  selected.value.every(v => v !== null)
)

const handleGenerate = async () => {
  isGenerating.value = true
  submitted.value = false
  selected.value = []
  await planStore.generateQuizAction(props.title, props.context, planStore.form.techName, settingStore.deepseekKey)
  selected.value = new Array(questions.value.length).fill(null)
  isGenerating.value = false
}

const handleSubmit = () => {
  submitted.value = true
  if (isPassed.value) {
    // 通关：如果还没标记则标记完成
    if (!progressStore.isStepCompleted(planStore.form.techName, props.title)) {
      progressStore.toggleStep(planStore.form.techName, props.title)
    }
    emit('passed')
  }
}

const handleRetry = () => {
  submitted.value = false
  selected.value = new Array(questions.value.length).fill(null)
}

// 初始化 selected 数组
const initSelected = () => {
  if (hasQuiz.value && selected.value.length !== questions.value.length) {
    selected.value = new Array(questions.value.length).fill(null)
  }
}
initSelected()
</script>

<template>
  <div class="mt-8 pt-8 border-t border-gray-100">
    <h4 class="text-xs font-black text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2">
      <span class="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
      课时测验
    </h4>

    <!-- 未生成题目 -->
    <div v-if="!hasQuiz" class="flex items-center gap-4">
      <button
        @click="handleGenerate"
        :disabled="isGenerating"
        class="flex items-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl font-bold hover:bg-amber-100 transition-all disabled:opacity-50 text-sm"
      >
        <template v-if="isGenerating">
          <div class="w-4 h-4 border-2 border-amber-500 border-t-transparent animate-spin rounded-full"></div>
          <span>正在出题...</span>
        </template>
        <template v-else>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span>生成课时测验</span>
        </template>
      </button>
      <span class="text-xs text-gray-400">全部答对才能打卡通关</span>
    </div>

    <!-- 题目列表 -->
    <div v-else class="space-y-6">
      <!-- 通过提示 -->
      <div v-if="isPassed" class="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl animate-fade-in">
        <svg class="w-6 h-6 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p class="font-bold text-green-700 text-sm">全部答对，课时通关！</p>
          <p class="text-xs text-green-600 mt-0.5">已自动记录学习进度</p>
        </div>
      </div>

      <!-- 未通过提示 -->
      <div v-else-if="submitted && wrongIndexes.length > 0" class="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
        <svg class="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-sm text-red-600 font-medium">有 {{ wrongIndexes.length }} 道题答错了，查看解析后重新作答</p>
      </div>

      <!-- 每道题 -->
      <div
        v-for="(q, qi) in questions"
        :key="qi"
        class="rounded-2xl border p-5 transition-all"
        :class="[
          !submitted ? 'border-gray-100 bg-white' :
          selected[qi] === q.answer ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'
        ]"
      >
        <p class="font-bold text-gray-800 text-sm mb-4">
          <span class="text-amber-500 mr-1">Q{{ qi + 1 }}.</span>{{ q.question }}
        </p>

        <div class="space-y-2">
          <label
            v-for="(opt, oi) in q.options"
            :key="oi"
            class="flex items-center gap-3 px-4 py-2.5 rounded-xl border cursor-pointer transition-all text-sm"
            :class="[
              !submitted
                ? selected[qi] === oi
                  ? 'border-brand-400 bg-brand-50 text-brand-700'
                  : 'border-gray-100 bg-gray-50 hover:border-gray-300'
                : oi === q.answer
                  ? 'border-green-400 bg-green-50 text-green-700 font-bold'
                  : selected[qi] === oi
                    ? 'border-red-300 bg-red-50 text-red-600 line-through'
                    : 'border-gray-100 bg-gray-50 text-gray-400'
            ]"
          >
            <input
              type="radio"
              :name="`q-${stepIndex}-${qi}`"
              :value="oi"
              v-model="selected[qi]"
              :disabled="submitted"
              class="sr-only"
            />
            <span class="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs font-black"
              :class="[
                !submitted
                  ? selected[qi] === oi ? 'border-brand-500 bg-brand-500 text-white' : 'border-gray-300'
                  : oi === q.answer ? 'border-green-500 bg-green-500 text-white' : selected[qi] === oi ? 'border-red-400 bg-red-400 text-white' : 'border-gray-200'
              ]"
            >{{ ['A','B','C','D'][oi] }}</span>
            <span>{{ opt }}</span>
          </label>
        </div>

        <!-- 错题解析 -->
        <div v-if="submitted && selected[qi] !== q.answer" class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
          <span class="font-black">💡 解析：</span>{{ q.explanation }}
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex items-center gap-3 pt-2">
        <button
          v-if="!submitted"
          @click="handleSubmit"
          :disabled="!canSubmit"
          class="px-6 py-2.5 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm shadow-sm"
        >
          提交答案
        </button>
        <button
          v-if="submitted && !isPassed"
          @click="handleRetry"
          class="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all text-sm"
        >
          重新作答
        </button>
        <button
          v-if="submitted"
          @click="handleGenerate"
          :disabled="isGenerating"
          class="px-4 py-2.5 text-gray-400 hover:text-gray-600 text-xs font-medium transition-colors disabled:opacity-40"
        >
          换一组题
        </button>
      </div>
    </div>
  </div>
</template>
