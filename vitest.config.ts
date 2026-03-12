import vitarx from '@vitarx/plugin-vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vitarx()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.tsx']
  }
})
