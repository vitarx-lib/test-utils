/**
 * @file Vitest 配置：使用 jsdom 环境
 */
import vitarxBundler from '@vitarx/vite-bundler'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vitarxBundler()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.ts']
  },
  optimizeDeps: {
    exclude: ['vitarx']
  }
})
