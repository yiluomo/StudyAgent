/**
 * StudyAgent 全局 TypeScript 类型定义
 * 所有核心接口、枚举、状态类型均在此文件集中管理
 */

// ==================== 枚举：学习基础水平 ====================
export type LevelType = 'beginner' | 'elementary' | 'intermediate' | 'advanced'
export const LEVEL_OPTIONS: { value: LevelType; label: string }[] = [
  { value: 'beginner', label: '零基础' },
  { value: 'elementary', label: '入门' },
  { value: 'intermediate', label: '进阶' },
  { value: 'advanced', label: '精通' },
]

// ==================== 枚举：学习目标 ====================
export type GoalType = 'quickstart' | 'project' | 'interview'
export const GOAL_OPTIONS: { value: GoalType; label: string }[] = [
  { value: 'quickstart', label: '快速入门' },
  { value: 'project', label: '项目实战' },
  { value: 'interview', label: '面试备考' },
]

// ==================== 枚举：应用方向 ====================
export const DOMAIN_PRESETS = ['Web 应用', '数据分析', '移动端', '游戏开发', '嵌入式 / IoT', '自动化运维']

// ==================== 表单输入结构 ====================
export interface StudyFormInput {
  techName: string
  oldVersion?: string
  level: LevelType
  goal: GoalType
  domain?: string    // （选填）应用方向，如 "电商平台"、"数据分析"
  withRelated: boolean
}

// ==================== 文档抓取接口 ====================
// POST /api/fetch-docs 请求体
export interface FetchDocsRequest {
  techName: string
  version?: string
  tavilyKey: string   // 由前端传入的用户 Tavily Key
}

// POST /api/fetch-docs 响应体
export interface FetchDocsResponse {
  docContent: string   // 抓取的文档文本（≤8000字符）
  sourceUrl: string    // 文档来源 URL
  fallback: boolean    // true = 抓取失败，使用 LLM 知识降级
  cached: boolean      // 是否来自缓存
}

// ==================== 学习计划生成接口 ====================
// POST /api/generate-plan 请求体
export interface GeneratePlanRequest extends StudyFormInput {
  docContent: string   // 来自 fetch-docs 的文档内容
  deepseekKey: string  // 由前端传入的用户 DeepSeek Key
}

// SSE 流式数据块
export interface StreamChunk {
  token?: string   // 文本 token
  done?: boolean   // 是否完成
  error?: string   // 错误信息
}

// ==================== 答疑接口（Phase 2）====================
export interface QaMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: number
}

export interface QaRequest {
  question: string
  techName: string
  docContent: string
  planMarkdown: string
  history: QaMessage[]
  deepseekKey: string  // 由前端传入的用户 DeepSeek Key
}

// ==================== Pinia Store 状态 ====================
// 应用全局状态机
export type AppStatus =
  | 'idle'           // 初始状态
  | 'fetching-docs'  // 正在抓取文档
  | 'generating'     // 正在生成计划（流式）
  | 'done'           // 生成完成
  | 'error'          // 发生错误

export interface PlanState {
  status: AppStatus
  error: string | null

  // 表单数据
  form: StudyFormInput

  // 文档抓取结果
  docContent: string
  sourceUrl: string
  isFallback: boolean
  isCached: boolean

  // 学习计划（流式追加）
  planMarkdown: string

  // 用户随堂笔记：{ [stepTitle]: noteContent }
  notes: Record<string, string>

  // 历史保存的计划列表
  savedPlans: SavedPlan[]
  // 当前正在加载/查看的计划 ID
  currentPlanId: string | null

  // UI 状态
  leftSidebarOpen: boolean
  rightSidebarOpen: boolean
  activeStepIndex: number
  expandedContent: Record<string, string>
  quizzes: Record<string, QuizQuestion[]>
}

// ==================== 已保存的计划条目 ====================
export interface SavedPlan {
  id: string
  form: StudyFormInput
  planMarkdown: string
  notes: Record<string, string>
  expandedContent: Record<string, string>
  createdAt: number
  updatedAt: number
  quizzes: Record<string, QuizQuestion[]>
}

// ==================== 学习进度（Phase 2）====================
export interface StepProgress {
  techName: string     // 技术名称（作为 key）
  completedSteps: string[]  // 已完成步骤的 index list
  createdAt: number
  updatedAt: number
}

// ==================== 练习题 ==================== 
export interface QuizQuestion {
  question: string
  options: string[]
  answer: number
  explanation: string
}