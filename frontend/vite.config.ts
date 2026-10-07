import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // FullCalendar paketleri (react + core + eklentiler) Vite tarafından
  // ayrı ayrı önceden paketlenirse "Class constructor cannot be invoked
  // without 'new'" hatası çıkıyor. Bunları tek, tutarlı bir kopya olarak
  // paketlemesini söylüyoruz.
  optimizeDeps: {
    include: [
      '@fullcalendar/core',
      '@fullcalendar/react',
      '@fullcalendar/daygrid',
      '@fullcalendar/timegrid',
      '@fullcalendar/interaction',
    ],
  },
})