import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
const isTest = process.env.VITEST === 'true';

export default defineConfig({
  plugins: [tailwindcss(), react({ fastRefresh: !isTest })],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
  },
})
