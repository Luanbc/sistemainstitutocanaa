import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['logo-pwa.png'],
      manifest: {
        name: 'Sistema Proativo Canaã',
        short_name: 'SPC Canaã',
        description: 'Software de Gestão do Instituto Social e Educacional Canaã',
        theme_color: '#132638',
        icons: [
          {
            src: 'logo-pwa.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo-pwa.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
})


