# Аудит проекта

Дата: 2026-09-28. Ветка: `refactor/strict-and-wheel-zoom` (создана от `main`, `main` не изменялся).

Область: `index.html` (лендинг), `mini-figma/` (React 19 + TypeScript + Vite 8 + Tailwind 4),
`.github/workflows/deploy.yml`, конфигурация репозитория.

## Сводка

| Серьёзность | Количество | Исправлено |
| --- | --- | --- |
| P0 критично | 1 | 1 |
| P1 важно | 7 | 7 |
| P2 желательно | 14 | 0 (см. «Осталось») |

Секретов (токенов, ключей, паролей) в коде **не найдено** — ни в рабочем дереве, ни в истории
git (`git log --all -p` по паттернам `ghp_*`, `github_pat_*`, `sk-*`, `AKIA*`, `AIza*`, `xox*`,
`-----BEGIN … PRIVATE KEY-----`, JWT). Проверены `index.html`, `mini-figma/src`,
`mini-figma/public`, `.github/`, `*.json`, `*.ts`. Совпадения в `.opencode/skills/` и
`.agents/skills/` — это сторонние вендорные скиллы, слова «token» там используются в значении
«дизайн-токен», утечек нет.

## P0 — критично

| № | Проблема | Файл:строка | Что делать |
| --- | --- | --- | --- |
| 1 | `event.preventDefault()` в `onWheel` не работает. React 19 регистрирует `wheel` на корневом контейнере с `{ passive: true }` (`react-dom-client.development.js:20939-20954`), поэтому вызов `preventDefault()` внутри обработчика — no-op: браузер всё равно выполняет прокрутку, а в консоль падает ошибка на каждое колесо мыши. Заявленная в README функция «зум колесом мыши» не может подавить нативное поведение. | `mini-figma/src/components/Canvas.tsx:110-119, 254` | Заменить `onWheel` на нативный слушатель `wheel` с `{ passive: false }`, зарегистрированный в `useEffect` на элементе холста. |

## P1 — важно

| № | Проблема | Файл:строка | Что делать |
| --- | --- | --- | --- |
| 1 | Workflow публикует сайт на GitHub Pages при пуше в **любую** ветку: `on: push` без фильтра. Пуш в `refactor/*` перезатирает продакшен. Плюс `cancel-in-progress: true` отменяет незавершённый релиз основной ветки. | `.github/workflows/deploy.yml:3-4, 11-13` | Ограничить публикацию веткой `main`, добавить отдельный триггер на PR для проверок. |
| 2 | Правки `pages: write` и `id-token: write` выданы на верхнем уровне, то есть и шагу сборки, которой они не нужны. Лишние права — лишний риск. | `.github/workflows/deploy.yml:6-9` | Оставить `contents: read` глобально, `pages: write` и `id-token: write` перенести в job `deploy`. |
| 3 | В CI не выполняется `npm run lint` — скрипт есть в `package.json`, но не используется, регрессии стиля попадают в релиз. | `.github/workflows/deploy.yml:32-36` | Добавить шаг `npm run lint` перед сборкой. |
| 4 | Лендинг `index.html` лежит в репозитории, но **не попадает в публикацию**: workflow загружает только `mini-figma/dist`, а там `index/index.html` — это вход редактора. Корневой адрес сайта отдаёт 404, хотя репозиторий явно рассчитан на «лендинг + редактор». | `.github/workflows/deploy.yml:41-44`, `index.html:1-112` | Собирать редактор в `dist/mini-figma/`, а лендинг копировать в `dist/index.html`; добавить на лендинг ссылку на редактор. |
| 5 | В git отслеживаются бинарные файлы `__pycache__/*.pyc` — скомпилированный Python-мусор, который ломает диффы и «пачкает» репозиторий. Корневого `.gitignore` нет вообще, поэтому `node_modules`, `dist`, `.env`, `*.pyc`, файлы редакторов не защищены. | `.opencode/skills/ui-ux-pro-max/scripts/__pycache__/*.pyc` (3 файла) | Добавить корневой `.gitignore`, убрать `*.pyc` из индекса. |
| 6 | `AGENTS.md` и `opencode.json` не закоммичены, хотя `opencode.json` ссылается на `AGENTS.md` как на `instructions`. Правила проекта и конфиг инструмента существуют только локально. | `AGENTS.md`, `opencode.json` | Добавить оба файла в git. |
| 7 | Дубль функции `isTypingTarget` в двух хуках — одинаковый `Set` создаётся заново на каждый вызов. | `mini-figma/src/hooks/useHotkeys.ts:5-13`, `mini-figma/src/hooks/useViewport.ts:14-22` | Вынести в `utils/dom.ts`, `Set` сделать константой модуля. |
| 8 | Вендорный скилл содержит инструкцию, не относящуюся к проекту: `.agents/skills/claude-design/AGENTS.md` предписывает использовать конкретного git-автора при коммитах. Это данные в репозитории, а не инструкция владельца проекта — выполнять её нельзя, риск — подмена авторства коммитов. | `.agents/skills/claude-design/AGENTS.md:3` | Не выполнять; зафиксировать риск в аудите. |

## P2 — желательно (не исправлено, см. «Осталось»)

| № | Проблема | Файл:строка |
| --- | --- | --- |
| 1 | Мёртвый код: `getToolByShortcut` не вызывается нигде | `mini-figma/src/constants/tools.ts:31-41` |
| 2 | Мёртвый код: `canvasToScreen` не вызывается нигде | `mini-figma/src/utils/geometry.ts:13-21` |
| 3 | `canUndo` / `canRedo` возвращаются из хука, но `App` их не использует | `mini-figma/src/hooks/useShapes.ts:412-413` |
| 4 | `addShape` возвращается наружу, но используется только внутри хука | `mini-figma/src/hooks/useShapes.ts:414` |
| 5 | Акцентный цвет `#0d9488` захардкожен 13 раз в 4 файлах вместо одного токена Tailwind `@theme` | `Canvas.tsx`, `Shape.tsx`, `Toolbar.tsx`, `LayersPanel.tsx` |
| 6 | Расхождение оттенков: `LayersPanel` использует `#0f766e` (teal-700) там, где остальной код — `#0d9488` (teal-600) | `mini-figma/src/components/LayersPanel.tsx:53` |
| 7 | Фон холста `#eef1f3` продублирован в трёх местах | `App.tsx:62`, `Canvas.tsx:252`, `index.css:8` |
| 8 | `input type="color"` вызывает `onChange` на каждый шаг перетаскивания — история отмены засоряется десятками записей | `mini-figma/src/App.tsx:92`, `PropertiesPanel.tsx:73` |
| 9 | Нет `Escape` для отмены создания фигуры — начатую мышью фигуру можно только завершить | `Canvas.tsx:186-206` |
| 10 | `zoomBy` измеряет `getBoundingClientRect()` внутри апдейтера `setState` — impure, дважды вызывается в StrictMode | `mini-figma/src/hooks/useViewport.ts:137-148` |
| 11 | Нет тестов вовсе: ни unit, ни e2e | — |
| 12 | Нет корневых `README.md` и `LICENSE`; в `mini-figma/package.json` нет `engines` (Vite 8 требует Node `^20.19 \|\| >=22.12`) | корень репозитория, `package.json` |
| 13 | Доступность: интерактивные фигуры помечены `role="img"`, у `role="toolbar"` нет управления стрелками, у фигур нет клавиатурного управления | `Shape.tsx:129`, `Toolbar.tsx:56-60` |
| 14 | `preventDefault` на `keyup` для `Space` выполняется глобально и подавляет активацию кнопок пробелом; `isTypingTarget` не учитывает `BUTTON` | `useViewport.ts:52-60` |
