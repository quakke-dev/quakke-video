# quakke-video

Учебный production-like видеохостинг в Nx monorepo. Архитектура: modular monolith
на NestJS, отдельные фоновые workers и три Next.js приложения.

## Требования

- Node.js `20.19.x`
- pnpm `10.22.x`
- Docker с Compose plugin

## Быстрый старт

```bash
pnpm install
cp .env.example .env
pnpm infra:up
pnpm nx serve api
pnpm nx dev web
```

## Структура

- `apps/web` - пользовательский сайт.
- `apps/studio` - студия автора.
- `apps/admin` - административная панель.
- `apps/api` - основной NestJS API.
- `apps/worker-media` - обработка видео.
- `apps/worker-notifications` - доставка уведомлений.
- `packages/*` - переиспользуемые пакеты без продуктовой бизнес-логики.
- `infra` - локальная и будущая deployment-инфраструктура.
- `docs/architecture` - актуальная схема системы.
- `docs/adr` - принятые архитектурные решения.

## Основные команды

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check
pnpm graph
```

Для одной цели используйте `pnpm nx <target> <project>`, например
`pnpm nx test api`. Перед pull request выполняйте `pnpm check`.

## Порядок разработки

1. Поднять локальную инфраструктуру и проверить `GET /api/health/live`.
2. Реализовать adapters конфигурации, PostgreSQL, Redis, RabbitMQ и S3.
3. Сделать первый вертикальный slice `auth` внутри API.
4. Подключить UI и API client только к готовому контракту.
5. Добавить queue consumers и e2e фоновых сценариев после появления команд.

Подробности находятся в [обзоре архитектуры](docs/architecture/overview.md).
