import { marked } from 'marked'

export interface ParsedStep {
  title: string
  content: string
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
  
  for (const line of lines) {
    // 探测 Step 分割线
    if (line.match(/^###\s*Step\s*\d+[:：]/i) || line.match(/^###\s*第.+步/)) {
      currentRegion = 'step'
      currentStepIndex++
      // 提取核心标题
      let cleanTitle = line.replace(/^###\s*/, '')
      result.steps.push({
        title: cleanTitle,
        content: ''
      })
      continue
    }
    
    // 探测结语/代码区分割线（兼容中英文与图标）
    if (line.match(/^##\s*💻/i) || line.match(/^##\s*(最小)?可运行/)) {
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
