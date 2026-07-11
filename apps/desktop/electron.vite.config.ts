import { resolve } from 'path'
import { builtinModules } from 'module'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

const nodeExternals = [
  'electron',
  'sharp',
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
]

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        external: nodeExternals,
      },
    },
    resolve: {
      alias: {
        '@private-pdf/pdf-core': resolve('../../packages/pdf-core/src/index.ts'),
        '@private-pdf/image-core': resolve('../../packages/image-core/src/index.ts'),
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
