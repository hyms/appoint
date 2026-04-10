import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    server: {
      host: '0.0.0.0',
      port: 5173,
    },
    plugins: [
      vue(),
      vueJsx(),
      vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
    },
    define: {
      'process.env.VITE_ONESIGNAL_APP_ID': JSON.stringify(env.VITE_ONESIGNAL_APP_ID || ''),
    },
  }
})
