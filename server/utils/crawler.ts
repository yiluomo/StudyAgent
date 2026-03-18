import * as cheerio from 'cheerio'

/**
 * 获取任意网页并提取核心正文文本内容
 * @param url 目标 URL
 * @param maxLength 最大保留字符数（避免超大页面导致 token 浪费）
 */
export async function crawlWebPage(url: string, maxLength: number = 8000): Promise<string> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 StudyAgent/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()
    
    // 使用 cheerio 提取内容
    const $ = cheerio.load(html)

    // 移除无用标签（脚本、样式、导航、页脚、SVG等）
    $('script, style, noscript, nav, footer, header, svg, img, iframe').remove()

    // 优先从语义化标签获取内容，如果没有则获取整个 body
    let mainContent = $('main').text() || $('article').text() || $('.content').text() || $('.document').text()
    
    if (!mainContent || mainContent.trim().length < 500) {
      mainContent = $('body').text()
    }

    // 清理文本：移除多余空行、多余空格
    const cleanText = mainContent
      .replace(/\n\s*\n/g, '\n') // 将连续的多个空行替换为一个换行
      .replace(/[ \t]{2,}/g, ' ') // 多个空格替换为一个空格
      .trim()

    // 截断到最大长度
    if (cleanText.length > maxLength) {
      return cleanText.substring(0, maxLength) + '\n\n...[Content Truncated]'
    }

    return cleanText

  } catch (error) {
    console.error(`Failed to crawl url ${url}:`, error)
    throw error
  }
}
