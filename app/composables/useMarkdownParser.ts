import { marked } from 'marked'

export interface ParsedStep {
  title: string
  content: string
  stage?: string
}

export interface ParsedPlan {
  intro: string
  steps: ParsedStep[]
  outro: string
}

export type RenderBlock = 
  | { type: 'html'; content: string }
  | { type: 'code'; lang: string; code: string }

/**
 * 将整篇 Markdown 切割为：前奏导语区、分步执行区、大轴（可运行代码）区
 */
export function parsePlanStructure(markdown: string): ParsedPlan {
  const result: ParsedPlan = { intro: '', steps: [], outro: '' }
  const lines = markdown.split('\n')
  
  let currentRegion: 'intro' | 'step' | 'outro' = 'intro'
  let currentStepIndex = -1
  let currentStage = ''
  
  for (const line of lines) {
    // 探测阶段 (##) 也包含带表情符号的情况
    const stageMatch = line.match(/^##\s*.*(第.+阶段|第.+部分|模块|Section).*/i) || line.match(/^##\s*第.+阶段/i)
    if (stageMatch) {
      currentStage = line.replace(/^##\s*/, '').trim()
      if (currentRegion === 'intro') {
        result.intro += `\n${line}\n`
      }
      continue
    }

    // 探测课时/步骤
    if (line.match(/^###\s*(Step\s*\d+|第.+步|课时\s*\d+)[:：]?/i) || line.match(/^###\s+/)) {
      currentRegion = 'step'
      currentStepIndex++
      result.steps.push({
        title: line.replace(/^###\s*/, '').trim(),
        content: '',
        stage: currentStage
      })
      continue
    }
    
    // 探测结语/项目区
    if (line.match(/^##\s*💻/i) || line.match(/^##\s*(终极|实战)?(项目|总结|Conclusion)/) || line.match(/^##\s*总结/)) {
      currentRegion = 'outro'
      result.outro += line + '\n'
      continue
    }
    
    // 按区内累加
    if (currentRegion === 'intro') {
      result.intro += line + '\n'
    } else if (currentRegion === 'step') {
      const activeStep = result.steps[currentStepIndex]
      if (activeStep) {
        activeStep.content += line + '\n'
      }
    } else if (currentRegion === 'outro') {
      result.outro += line + '\n'
    }
  }

  // 需求：将实战项目和总结单独新增一个课时
  if (result.outro) {
    result.steps.push({
      title: '🏗️ 实战演练与课程总结',
      content: result.outro,
      stage: '总成阶段'
    })
    result.outro = '' 
  }

  // 清除 intro 中可能残留的第一个阶段标题，因为 LearningStep 顶部已经有 Badge 了
  result.intro = result.intro.replace(/^##\s*.*阶段.*\n?/m, '').trim()

  // 对每个 step 的 content 做换行修复：
  // 将 "**xxx**：内容" 的内联模式拆成独立段落，确保正确渲染
  result.steps.forEach(step => {
    step.content = step.content
      // 在每个 **bold**： 前插入双换行，确保成为独立段落
      .replace(/(?<!\n\n)(\*\*[^*]+\*\*[：:])/g, '\n\n$1')
      .trim()
  })
  
  return result
}

/**
 * 将一段标准的 Markdown 中的 HTML 文本区与 Code 块严格分离
 * 方便交由 Vue 实现高度自定义的可复制组件
 */
export function parseToBlocks(markdown: string): RenderBlock[] {
  if (!markdown) return []
  const tokens = marked.lexer(markdown)
  const blocks: RenderBlock[] = []
  
  let currentHtmlTokensRaw = ''
  
  for (const token of tokens) {
    if (token.type === 'code') {
      // 在遇到代码快前，先把累积下来的普通文本拿去 parse 成 html html
      if (currentHtmlTokensRaw.trim()) {
        blocks.push({ 
          type: 'html', 
          // 加上 gfm 兼容
          content: marked.parse(currentHtmlTokensRaw, { async: false }) as string 
        })
        currentHtmlTokensRaw = ''
      }
      // 再单独抛出纯代码数据块（携带语言）
      blocks.push({ type: 'code', lang: token.lang || 'text', code: token.text })
    } else {
      currentHtmlTokensRaw += token.raw
    }
  }
  
  // 底部兜底抛出
  if (currentHtmlTokensRaw.trim()) {
    blocks.push({ 
      type: 'html', 
      content: marked.parse(currentHtmlTokensRaw, { async: false }) as string 
    })
  }
  
  return blocks
}
