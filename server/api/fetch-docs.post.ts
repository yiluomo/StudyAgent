import type { FetchDocsRequest, FetchDocsResponse } from '../../types'
import { tavilySearch } from '../utils/search'
import { crawlWebPage } from '../utils/crawler'
import { cacheUtils } from '../utils/cache'

export default defineEventHandler(async (event): Promise<FetchDocsResponse> => {
  const body = await readBody<FetchDocsRequest>(event)
  
  if (!body.techName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Technology name is required',
    })
  }

  // Phase 1 : 未配置 Key 时拦截返回
  if (!body.tavilyKey) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tavily API Key is missing. Please configure it in settings.',
    })
  }

  const cacheKey = `doc_${body.techName}`
  const cachedData = cacheUtils.get(cacheKey)
  if (cachedData) {
    return {
      ...cachedData,
      cached: true,
    }
  }

  let finalContent = ''
  let finalUrl = ''
  let fallback = false

  try {
    // 并发派发两路检索：官方基准文档与 GitHub 极客开源样例
    const officialQuery = `${body.techName} official documentation guide tutorial`
    const githubQuery = `${body.techName} awesome list OR best practice boilerplate site:github.com`
    
    // 我们并发请求以节约耗时
    const [officialResult, githubResult] = await Promise.allSettled([
      tavilySearch(officialQuery, body.tavilyKey),
      tavilySearch(githubQuery, body.tavilyKey)
    ])

    const offData = officialResult.status === 'fulfilled' ? officialResult.value : null
    const gitData = githubResult.status === 'fulfilled' ? githubResult.value : null
    
    if (!offData && !gitData) {
      fallback = true
      finalContent = '无法通过搜索引擎获取最新文档与周边开源案例，请依赖大模型现有知识。'
      finalUrl = ''
    } else {
      // 能抓多少抓多少
      let offContent = ''
      let gitContent = ''

      if (offData) {
        finalUrl = offData.url // 官网优先级更高，定为追踪来源
        try {
          offContent = await crawlWebPage(offData.url)
        } catch {
          console.warn(`[Crawl Failed] Official: ${offData.url}`)
          offContent = `Tavily Official Snippet: ${offData.content || offData.title}`
        }
      }

      if (gitData) {
        if (!finalUrl) finalUrl = gitData.url
        try {
          gitContent = await crawlWebPage(gitData.url, 4000) // Github readme 短一点即可
        } catch {
          console.warn(`[Crawl Failed] Github: ${gitData.url}`)
          gitContent = `Tavily Github Snippet: ${gitData.content || gitData.title}`
        }
      }
      
      // 合并两路武功秘籍作为 LLM 的绝密资料！
      finalContent = `================官方基础规范================\n${offContent}\n\n================优质GitHub参考样例================\n${gitContent}`
    }
  } catch (err: any) {
    console.error('Fetch docs error globally:', err)
    fallback = true
    finalContent = '检索服务或抓取服务异常，已启动降级模式直接问答。'
    finalUrl = ''
  }

  const result: FetchDocsResponse = {
    docContent: finalContent,
    sourceUrl: finalUrl,
    fallback: fallback,
    cached: false,
  }

  // 成功获取或即使是部分成功也保存缓存1小时（避免因为失败持续重新请求耗竭 API 额度）
  cacheUtils.set(cacheKey, result)

  return result
})
