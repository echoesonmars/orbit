# 📂 Структура кодовой базы OrbitAI (Monorepo)

Ниже представлено детальное описание актуальной структуры монорепозитория.

```text
orbit/
├── apps/
│   └── orbit-front/        # Фронтенд-приложение на Next.js (App Router) + Tailwind CSS v3
│       ├── app/            # Маршрутизация и страницы (page.tsx, layout.tsx)
│       └── public/         # Статические файлы
│
├── services/
│   ├── gateway/            # Управляющий бэкенд (Шлюз) на Node.js + Express
│   │   └── src/
│   │       ├── controllers/ # Обработчики запросов
│   │       ├── middleware/  # Защита роутов, проверка JWT
│   │       ├── routes/      # Эндпоинты API
│   │       ├── services/    # HTTP-клиенты (связь с ml-api)
│   │       └── validators/  # Zod-схемы для валидации
│   │
│   ├── ml-api/             # ИИ-движок и математическое ядро на Python + FastAPI
│   │   ├── app/
│   │   │   ├── api/        # Роуты FastAPI
│   │   │   ├── core/       # Конфигурация
│   │   │   ├── models/     # Веса обученных моделей (.pkl, .joblib)
│   │   │   ├── modules/    # Изолированная логика AI модулей
│   │   │   ├── schemas/    # Pydantic модели
│   │   │   └── main.py     # Точка входа FastAPI
│   │   └── requirements.txt
│   │
│   └── worker/             # Отдельный сервис для тяжелых фоновых задач (Python)
│
├── shared/                 # Общие контракты между Frontend и Backend
│   ├── contracts/          # Общие JSON-схемы
│   └── types/              # Общие типы TypeScript
│
├── infra/                  # Инфраструктура и деплой
│   ├── db/                 # SQL-скрипты миграций Supabase (PostGIS)
│   ├── docker/             # Dockerfile для каждого сервиса
│   ├── redis/              # Конфиг очередей задач
│   └── docker-compose.yml  # Docker Compose для инфраструктуры
│
├── .cursorrules            # Правила для AI-редакторов (Cursor)
├── .env.example            # Шаблон секретных переменных среды
├── docker-compose.yml      # Локальный запуск всей системы (Gateway + ML-API + Infra)
├── package.json            # Корневой файл управления рабочими областями (Workspaces)
├── details.md              # Подробная архитектура платформы
└── README.md               # Главный файл документации проекта
```