import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@private-pdf/pdf-core': resolve('../../packages/pdf-core/src/index.ts'),
        '@private-pdf/shared-types': resolve('../../packages/shared-types/src/index.ts'),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src'),
        '@private-pdf/shared-types': resolve('../../packages/shared-types/src/index.ts'),
      },
    },
    plugins: [react()],
  },
})
