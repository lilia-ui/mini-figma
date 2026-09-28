import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/mini-figma/',
  // Редактор собирается в dist/mini-figma/, чтобы в корне dist осталось
  // место для лендинга index.html.
  build: {
    outDir: 'dist/mini-figma',
  },
  plugins: [react(), tailwindcss()],
})
