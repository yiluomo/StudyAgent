/**
 * 调用 Tavily API 执行检索，寻找官方文档
 */

export interface TavilySearchResult {
  title: string
  url: string
  content: string
}

export async function tavilySearch(
  query: string,
  apiKey: string
): Promise<TavilySearchResult | null> {
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: 'basic',
        include_answer: false,
        max_results: 3,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Tavily API Error:', errText)
      throw new Error(`Tavily API responded with status ${response.status}`)
    }

    const data = await response.json()
    
    if (data && data.results && data.results.length > 0) {
      // 优先选择官方或者 github 的结果，排在前面的就行
      // 我们直接返回第一条有效的数据
      return {
        title: data.results[0].title,
        url: data.results[0].url,
        content: data.results[0].content, // 摘要信息
      }
    }

    return null
  } catch (error) {
    console.error('Error during Tavily search:', error)
    throw error
  }
}
