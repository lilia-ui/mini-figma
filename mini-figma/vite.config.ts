import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // Адрес, по которому отдаётся собранный редактор. По умолчанию /mini-figma/:
  // именно так его раскладывает деплой на GitHub Pages. Если редактор
  // публикуют по другому пути (свой домен, другой хостинг), переопределите:
  //   BASE_PATH=/editor/ npm run build
  // Значение должно совпадать с тем, по какому URL отдаётся каталог
  // dist/mini-figma: по умолчанию это корень сайта плюс /mini-figma/.
  base: process.env.BASE_PATH ?? '/mini-figma/',
  // Редактор собирается в dist/mini-figma/, чтобы в корне dist осталось
  // место для лендинга index.html и его картинок.
  build: {
    outDir: 'dist/mini-figma',
  },
  plugins: [react(), tailwindcss()],
})
