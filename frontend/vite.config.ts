import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
const isTest = process.env.VITEST === 'true';

export default defineConfig({
  plugins: [react({ fastRefresh: !isTest })],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
  },
})
