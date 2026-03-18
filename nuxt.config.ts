// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,

  // 注册 Nuxt 模块
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
  ],

  // 服务端专用运行时配置（如果未来有不需要用户配置的固定密钥，可放在此处）
  runtimeConfig: {
    deepseekBaseUrl: 'https://api.deepseek.com',
    // 公开配置（客户端可访问）
    public: {
      appName: 'StudyAgent',
    },
  },

  // TypeScript 严格模式
  typescript: {
    strict: true,
  },

  // Nitro（Nuxt 服务端引擎）配置
  nitro: {
    experimental: {
      // 启用 WebSocket 支持（答疑模块备用）
      websocket: true,
    },
  },
})