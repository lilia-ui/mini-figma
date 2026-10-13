import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // Базовый путь — относительный. Сайт лежит не в корне домена, а под
  // путём репозитория: на GitHub Pages редактор открывается по адресу
  // /<репозиторий>/mini-figma/, и абсолютный base уводил бы ссылки на
  // файлы в корень сайта, где их нет. С './' браузер ищет файлы рядом
  // с самим index.html, поэтому сборка работает на любом хостинге.
  // Для нестандартного размещения можно задать путь явно:
  //   BASE_PATH=/editor/ npm run build
  base: process.env.BASE_PATH ?? './',
  // Редактор собирается в dist/mini-figma/, чтобы в корне dist осталось
  // место для лендинга index.html и его картинок.
  build: {
    outDir: 'dist/mini-figma',
  },
  plugins: [react(), tailwindcss()],
})
