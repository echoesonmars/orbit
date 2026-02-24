orbit/
├── apps/
│   └── web/                # Next.js
├── services/
│   ├── gateway/            # Node.js + Zod (Validation)
│   ├── ml-api/             # Python + FastAPI + Pydantic
│   └── worker/             # Отдельный сервис для тяжелых задач (Python)
├── shared/
│   └── contracts/          # Общие JSON-схемы и типы TypeScript
├── infra/
│   ├── redis/              # Конфиг для очереди задач
│   └── docker-compose.yml
└── .cursorrules            # Правила для Cursor, чтобы он не косячил в архитектуре