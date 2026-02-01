import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig, configDefaults } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@/test-utils': path.resolve(__dirname, '.test'),
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    testTimeout: 30000,
    environment: 'jsdom',
    globalSetup: '.test/vitest.globals.ts',
    setupFiles: ['.test/vitest.setup.tsx'],
    globals: true,
    clearMocks: true,
    coverage: {
      reporter: ['cobertura', 'html', 'lcovonly', 'text'],
      enabled: true,
      provider: 'v8',
      exclude: [
        ...(configDefaults.coverage.exclude ?? []),
        '*.*',
        '**/index.*',
        'app/**',
        'src/entities/**'
      ]
    }
  }
})
