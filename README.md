# quakke-video

Учебный production-like видеохостинг в Nx monorepo. Проект создаётся для практики
fullstack-разработки, архитектуры, инфраструктуры, CI/CD, тестирования и эксплуатации
масштабируемых приложений.

Целевая архитектура: modular monolith на NestJS, три Next.js приложения и отдельные
фоновые workers. Проект не предназначен для коммерческого использования, но решения
и требования к качеству рассматриваются как в реальном продукте.

## Текущее состояние

Репозиторий находится на этапе foundation:

- настроены Nx, pnpm workspaces, strict TypeScript, ESLint и Prettier;
- работают unit/e2e skeleton-тесты и production builds;
- локально поднимаются PostgreSQL, Redis, RabbitMQ и MinIO;
- подготовлены Docker images и CI/CD для stage/production;
- API содержит только базовый healthcheck;
- workers создают standalone NestJS context, но RabbitMQ consumers ещё не реализованы;
- frontend-приложения пока содержат стартовые экраны.

Ближайший этап разработки — backend foundation: runtime-валидация env, adapters для
PostgreSQL, Redis, RabbitMQ и S3, затем первый вертикальный slice `auth`.

## Стек

| Область        | Технологии                                                       |
| -------------- | ---------------------------------------------------------------- |
| Monorepo       | Nx 23, pnpm workspaces                                           |
| Frontend       | Next.js 16, React 19, TypeScript, FSD                            |
| Backend        | NestJS 11, GraphQL для бизнес-данных, REST для upload/health     |
| Данные         | PostgreSQL, Redis, RabbitMQ, MinIO локально, Timeweb S3 удалённо |
| Тестирование   | Jest, Vitest, Playwright                                         |
| UI kit         | React, Rollup; Storybook запланирован                            |
| Инфраструктура | Docker Compose, Nginx, GHCR, GitHub Actions                      |

## Структура репозитория

```text
apps/
  web/                  пользовательский видеохостинг
  studio/               кабинет автора
  admin/                административная панель
  api/                  основной NestJS API
  worker-media/         обработка видео, FFmpeg, HLS и превью
  worker-notifications/ email и внутренние уведомления
  *-e2e/                e2e-проекты соответствующих приложений

packages/
  ui/                   общий React UI kit
  api-client/           типизированный клиент API
  contracts/            внешние DTO, схемы и event contracts
  config/               runtime-валидация конфигурации
  testing/              общие test helpers
  eslint-config/        локальный ESLint flat config
  tsconfig/             резерв под будущие публикуемые TS presets

infra/                  Docker, Compose, Nginx, env templates и runbooks
docs/                   архитектура, ADR и эксплуатационная документация
tools/                  будущие Nx generators и workspace tooling
```

Каждый app/package содержит собственный короткий `README.md` с локальной
ответственностью и командами.

## Требования

- Node.js `24.18.x`;
- pnpm `10.22.x`;
- Docker Engine/Desktop с Compose v2;
- Git.

Версии Node и pnpm зафиксированы в `.nvmrc`, `package.json` и `packageManager`.

## Быстрый старт

Если Node.js установлен через `nvm`, сначала активируйте версию из `.nvmrc`. При
другом version manager используйте его эквивалент.

```bash
nvm install
nvm use
```

Затем установите зависимости и Git hooks:

```bash
corepack enable
corepack prepare pnpm@10.22.0 --activate

pnpm install
pnpm prepare

cp .env.local.example .env.local
pnpm infra:up
```

Запустите все приложения в одном терминале:

```bash
pnpm dev
```

Команда параллельно запускает `web`, `studio`, `admin`, `api`, `worker-media` и
`worker-notifications`. Остановить все процессы можно через `Ctrl+C`.

Если нужны только отдельные приложения:

```bash
pnpm dev:web
pnpm dev:studio
pnpm dev:admin
pnpm dev:api
pnpm dev:worker-media
pnpm dev:worker-notifications
```

Несколько нужных приложений можно запустить в отдельных терминалах. Локальные порты
зафиксированы: `web` — `3000`, `studio` — `3001`, `admin` — `3002`, API — `3333`.

Проверка:

```bash
curl http://localhost:3333/api/health/live
```

Локальные адреса:

| Сервис              | Адрес                       |
| ------------------- | --------------------------- |
| Web                 | `http://localhost:3000`     |
| Studio              | `http://localhost:3001`     |
| Admin               | `http://localhost:3002`     |
| API                 | `http://localhost:3333/api` |
| RabbitMQ Management | `http://localhost:15672`    |
| MinIO Console       | `http://localhost:9001`     |
| PostgreSQL          | `127.0.0.1:5432`            |
| Redis               | `127.0.0.1:6379`            |

Остановка инфраструктуры:

```bash
pnpm infra:down
```

## Основные команды

| Команда                                  | Назначение                                 |
| ---------------------------------------- | ------------------------------------------ |
| `pnpm dev`                               | запустить все приложения                   |
| `pnpm dev:web`                           | запустить пользовательский сайт            |
| `pnpm dev:studio`                        | запустить студию автора                    |
| `pnpm dev:admin`                         | запустить админку                          |
| `pnpm dev:api`                           | запустить API                              |
| `pnpm dev:worker-media`                  | запустить media worker                     |
| `pnpm dev:worker-notifications`          | запустить notifications worker             |
| `pnpm nx test api`                       | тесты одного проекта                       |
| `pnpm nx e2e web-e2e`                    | e2e одного приложения                      |
| `pnpm lint`                              | lint всех проектов                         |
| `pnpm typecheck`                         | проекты с Nx target `typecheck`            |
| `pnpm test`                              | unit/integration tests всех проектов       |
| `pnpm build`                             | production build всех проектов             |
| `pnpm check`                             | format/lint/types/unit/build всех проектов |
| `pnpm affected:check --base=origin/main` | проверки затронутых проектов               |
| `pnpm format`                            | исправить форматирование                   |
| `pnpm graph`                             | открыть Nx dependency graph                |
| `pnpm cm`                                | создать Conventional Commit интерактивно   |
| `pnpm infra:logs`                        | смотреть логи локальной инфраструктуры     |

Nx cache используется автоматически. В CI `nx affected` запускает задачи только для
изменённых проектов и их dependents; root-конфигурация затрагивает весь workspace.

## Частые проблемы

**`Unsupported engine`**

Проверьте `node --version` и `pnpm --version`, затем выполните `nvm use` и повторно
активируйте pnpm через Corepack.

**Git hooks не запускаются**

```bash
pnpm prepare
```

Проверьте, что Git-команда выполняется из этого репозитория и `HUSKY=0` не задан.

**Порт уже занят**

Перед `pnpm dev` остановите ранее запущенные приложения через `Ctrl+C`. Next.js не
запускает второй экземпляр приложения, пока первый процесс удерживает `.next/dev/lock`.

Проверить процессы, занявшие локальные порты:

```bash
lsof -nP -iTCP:3000 -iTCP:3001 -iTCP:3002 -iTCP:3333 -sTCP:LISTEN
```

Frontend-порт при ручном запуске можно изменить через `--port`, порт API — через `PORT`.
Порты PostgreSQL, Redis, RabbitMQ и MinIO меняются в `.env.local`.

**Контейнер локальной инфраструктуры unhealthy**

```bash
docker compose --env-file .env.local ps
pnpm infra:logs
```

**Nx показывает устаревший graph/cache**

```bash
pnpm nx reset
```

## Разработка и коммиты

Правила веток, архитектурных границ, тестирования, Conventional Commits и pull request
описаны в [CONTRIBUTING.md](CONTRIBUTING.md). Рекомендуемый способ создать коммит:

```bash
pnpm cm
```

Пример:

```text
feat(api): add user registration
```

## Документация

- [Карта документации](docs/README.md)
- [Архитектура системы](docs/architecture/overview.md)
- [Правила разработки](CONTRIBUTING.md)
- [Локальная и удалённая инфраструктура](infra/README.md)
- [CI/CD и affected builds](docs/operations/ci-cd.md)
- [VPS, ресурсы и безопасность](docs/operations/vps.md)
- [Архитектурные решения](docs/adr/README.md)
