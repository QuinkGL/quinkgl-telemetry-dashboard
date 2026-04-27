import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cwd } from 'node:process'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, cwd(), '')
  // Varsayılan, quinkgl `DEFAULT_TELEMETRY_BASE_URL` ile aynı (127.0.0.1:8765).
  const telemetryTarget =
    env.QUINKGL_TELEMETRY_DEV_URL || 'http://127.0.0.1:8765'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: telemetryTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  }
})
