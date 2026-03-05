import vitarx from '@vitarx/plugin-vite'
import { defineConfig, Plugin } from 'vitest/config'

export default defineConfig({
  plugins: [vitarx() as Plugin],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.tsx']
  }
})
