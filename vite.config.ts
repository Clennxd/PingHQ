import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'SyncHQ',
        short_name: 'SyncHQ',
        description: 'Realtime Team Broadcast & Memo Hub',
        theme_color: '#090D16',
        background_color: '#F8FAFC',
        display: 'standalone'
      }
    })
  ],
})
