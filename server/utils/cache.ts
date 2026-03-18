// 简单的内存缓存实现，用于缓存文档抓取结果
import type { FetchDocsResponse } from '../../types'

interface CacheEntry {
  data: FetchDocsResponse
  expiresAt: number
}

// 全局在内存中保存，Nuxt 启动后生命周期内有效
const memoryCache = new Map<string, CacheEntry>()

// 默认缓存 1 小时
const DEFAULT_TTL = 1000 * 60 * 60

export const cacheUtils = {
  get(key: string): FetchDocsResponse | null {
    const entry = memoryCache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      memoryCache.delete(key)
      return null
    }
    return entry.data
  },

  set(key: string, data: FetchDocsResponse, ttlMs: number = DEFAULT_TTL) {
    memoryCache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    })
  },

  clear() {
    memoryCache.clear()
  }
}
