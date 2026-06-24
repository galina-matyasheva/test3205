# URL Checker

Асинхронная проверка доступности URL-адресов. REST API + фронтенд-приложение.

## О проекте

Пользователь создаёт задание со списком URL, бэкенд асинхронно проверяет каждый URL (HEAD-запрос) и сохраняет результат (HTTP-статус, время, ошибки). Фронтенд в реальном времени показывает прогресс, статусы и детали по каждому URL.

**Основные возможности:**

- Создание задания со списком URL (через textarea)
- Асинхронная обработка: до 5 одновременных HEAD-запросов на одно задание
- Отмена всего задания или отдельных URL
- Периодический опрос статуса (каждые 2 секунды) до конечного состояния
- Прогресс-бар с разбивкой по статусам (success/error/cancelled)
- In-memory хранение данных (БД не требуется)

**Статусы заданий:** `pending` → `in_progress` → `success | failed | cancelled`

## Технологии

### Бэкенд

| Технология | Назначение |
|---|---|
| **Node.js 22** | Среда выполнения |
| **Express 5** | HTTP-сервер и маршрутизация |
| **TypeScript 6** | Типизация |
| **tsx** | Запуск TypeScript (watch-режим для разработки) |
| **Vitest** | Тестирование |
| **Supertest** | Интеграционное тестирование API |

### Фронтенд

| Технология | Назначение |
|---|---|
| **React 19** | UI-компоненты |
| **Vite 8** | Сборка и dev-сервер |
| **TypeScript 6** | Типизация |
| **Redux Toolkit 2** | Управление состоянием |
| **React Redux** | Связка React с Redux |
| **Zod** | Валидация URL-форм |
| **SCSS** | Стилизация |
| **Vitest** | Тестирование |
| **Testing Library** | Тестирование React-компонентов |
| **jsdom** | Окружение браузера для тестов |

### Инфраструктура

| Технология | Назначение |
|---|---|
| **Docker** | Контейнеризация |
| **Docker Compose** | Оркестрация сервисов |
| **nginx** | Раздача статики в production (прокси `/api` → бэкенд) |

## Тесты

### Бэкенд (45 тестов)

```bash
cd backend
npm test
```

- **store.test.ts** — 27 тестов: создание, обновление статусов, валидация переходов, отмена, получение подсчётов
- **routes.jobs.test.ts** — 15 тестов: интеграционные тесты всех API-эндпоинтов через Supertest
- **urlChecker.test.ts** — 3 теста: фейковые таймеры, мок fetch, пошаговая проверка очереди

### Фронтенд (64 теста)

```bash
cd frontend
npm test
```

- **validation.test.ts** — 12 тестов: валидация URL через Zod-схемы
- **activeJobSlice.test.ts** — 15 тестов: Redux-редьюсер активного задания
- **jobsSlice.test.ts** — 9 тестов: Redux-редьюсер списка заданий
- **api/jobs.test.ts** — 8 тестов: HTTP-клиент с моком fetch
- **JobDetails.test.tsx** — 10 тестов: отображение деталей, кнопки отмены, ошибки
- **JobsList.test.tsx** — 6 тестов: список заданий, выбор активного, удаление
- **CreateJobForm.test.tsx** — 4 теста: форма создания, валидация, отправка

### Проверка TypeScript

```bash
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit
```

Ошибок быть не должно.

## Запуск локально

### Требования

- Node.js 22+
- npm 10+

### Бэкенд

```bash
cd backend
npm install
npm run dev
```

Сервер запустится на `http://localhost:3000`.

### Фронтенд

```bash
cd frontend
npm install
npm run dev
```

Dev-сервер запустится на `http://localhost:5173`. Прокси на бэкенд настроен через Vite (файл `vite.config.ts`).

### Переменные окружения

Создайте `.env` на основе `.env.example`:

**`backend/.env`**

```
PORT=3000
```

**`frontend/.env`**

```
VITE_API_BASE=/api
VITE_API_PORT=3000
VITE_API_PROXY_TARGET=http://localhost:3000
```

## Запуск через Docker

### Требования

- Docker 29+
- Docker Compose v5+

### Сборка и запуск

```bash
# Из корня проекта
DOCKER_BUILDKIT=0 docker compose up -d
```

Первый запуск: сборка образов + установка зависимостей (может занять 1–2 минуты).

```bash
# Проверить, что контейнеры запущены
docker ps

# Посмотреть логи
docker compose logs backend
docker compose logs frontend
```

### Результат

- **Frontend**: `http://localhost:5173` — Vite dev server с HMR
- **Backend**: `http://localhost:3000` — Express API под tsx watch

### Пересборка после изменения зависимостей

```bash
DOCKER_BUILDKIT=0 docker compose up --build -d
```

### Остановка

```bash
docker compose down
```

### Если порты заняты

```bash
lsof -i :5173
kill <PID>
```

## API Endpoints

| Метод | Путь | Описание |
|---|---|---|
| `POST` | `/api/jobs` | Создать задание |
| `GET` | `/api/jobs` | Список заданий |
| `GET` | `/api/jobs/:id` | Детали задания |
| `POST` | `/api/jobs/:id/cancel` | Отменить задание |
| `DELETE` | `/api/jobs/:id` | Удалить задание |
| `PATCH` | `/api/jobs/:id/cancel-url` | Отменить конкретный URL |

## Структура проекта

```
test3205/
├── backend/
│   ├── src/
│   │   ├── __tests__/        # Тесты
│   │   ├── routes/           # Маршруты Express
│   │   ├── services/         # Бизнес-логика (urlChecker)
│   │   ├── index.ts          # Точка входа
│   │   ├── store.ts          # In-memory хранилище
│   │   └── types.ts          # Типы
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── __tests__/        # Тесты
│   │   ├── api/              # HTTP-клиент
│   │   ├── components/       # React-компоненты
│   │   ├── schema/           # Zod-валидация
│   │   ├── store/            # Redux store + slices
│   │   ├── strings/          # Тексты
│   │   ├── styles/           # SCSS
│   │   ├── types/            # Типы
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── package.json
├── docker-compose.yml
└── README.md
```
