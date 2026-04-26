import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        injectRegister: 'auto',
        devOptions: {
          enabled: true,
          type: 'module',
          navigateFallback: 'index.html'
        },
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
        },
        manifest: {
          name: 'ConcertHub',
          short_name: 'ConcertHub',
          description: 'Your ultimate concert scheduling app',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          background_color: '#030712',
          theme_color: '#000000',
          icons: [
            {
              src: 'icon-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'icon-512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        }
      })
    ],
    optimizeDeps: {
      exclude: ['lucide-react']
    },
    envDir: './environments',
    define: {
      __APP_ENV__: JSON.stringify(env.NODE_ENV),
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    }
  }
})
