import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// base = sottocartella di GitHub Pages (https://kizu96.github.io/dieta-mediterranea-cangiante/)
export default defineConfig({
  base: '/dieta-mediterranea-cangiante/',
  // Data di build mostrata in Impostazioni: serve a verificare quale versione gira
  // (il service worker della PWA può servire una build vecchia).
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg', 'apple-touch-icon.png'],
      // Permette il funzionamento offline e l'installazione su Android/Windows.
      workbox: {
        // La PDF della guida potrebbe non esistere ancora: non bloccare il build.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallbackDenylist: [/\.pdf$/],
      },
      manifest: {
        name: 'Dieta Mediterranea Cangiante',
        short_name: 'Dieta',
        description:
          'Piano pasti stagionale, dispensa, lista spesa, peso e allenamenti. Dati solo locali, offline.',
        lang: 'it',
        dir: 'ltr',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/dieta-mediterranea-cangiante/',
        scope: '/dieta-mediterranea-cangiante/',
        theme_color: '#2f9389',
        background_color: '#eef6f4',
        categories: ['health', 'lifestyle', 'food'],
        // Tieni premuta l'icona dell'app su Android → azioni rapide.
        shortcuts: [
          {
            name: 'Lista spesa',
            short_name: 'Spesa',
            url: '/dieta-mediterranea-cangiante/?view=spesa',
            icons: [{ src: 'pwa-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Segna i pasti di oggi',
            short_name: 'Oggi',
            url: '/dieta-mediterranea-cangiante/?view=oggi',
            icons: [{ src: 'pwa-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Pesata',
            short_name: 'Peso',
            url: '/dieta-mediterranea-cangiante/?view=peso',
            icons: [{ src: 'pwa-192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
    }),
  ],
})
