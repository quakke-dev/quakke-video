# Разработка quakke-video

Этот документ описывает единый flow разработки. Общая информация и быстрый старт
находятся в [README.md](README.md), архитектура — в
[docs/architecture/overview.md](docs/architecture/overview.md).

## Подготовка окружения

Выполните [быстрый старт из README](README.md#быстрый-старт).

`pnpm prepare` устанавливает корневые Husky hooks. Отдельные hooks внутри apps и
packages не создаются.

Не коммитьте `.env`, credentials, production data, `.next`, `dist`, coverage,
`tsconfig.tsbuildinfo` и другие generated artifacts.

## Ветки

Постоянная ветка одна — `main`. Каждая задача выполняется в отдельной короткоживущей
ветке:

```text
feat/auth-registration
fix/upload-resume
docs/onboarding
chore/update-nx
```

Push в task branch без PR не запускает CI. Проверки запускаются после открытия PR
в `main`. Stage deploy доступен вручную после успешных проверок. После merge новый
pipeline проверяет merge commit и предлагает ручной production deploy.

Техническая схема jobs и GitHub Environments описана в
[docs/operations/ci-cd.md](docs/operations/ci-cd.md).

Не смешивайте независимые задачи в одной ветке и PR.

## Где размещать код

### Frontend

- `apps/web` — публичные пользовательские сценарии;
- `apps/studio` — сценарии автора;
- `apps/admin` — административные сценарии;
- `packages/ui` — переиспользуемые UI primitives без бизнес-логики;
- `packages/api-client` — transport и типизированные вызовы API.

Внутри frontend-приложений используется FSD-направление зависимостей:

```text
app -> pages/widgets -> features -> entities -> shared
```

Next.js App Router остаётся composition/root routing слоем. Не импортируйте код одного
frontend-приложения из другого. Не выносите компонент или hook в shared-пакет до
появления реального повторного использования.

### Backend

Бизнес-модули находятся в `apps/api`. Модуль владеет своей application/domain логикой
и предоставляет явный публичный интерфейс. GraphQL используется для бизнес-данных,
REST — для resumable upload, healthcheck и технических endpoint.

Тяжёлые операции отправляются в RabbitMQ:

- `worker-media` обрабатывает видео и S3 artifacts;
- `worker-notifications` доставляет email и внутренние уведомления.

Workers не поднимают HTTP-сервер и не импортируют внутренние реализации API.

### Shared packages

- `contracts` содержит переносимые DTO, schemas и queue/event contracts;
- `config` содержит runtime-валидацию env и config factories;
- `testing` содержит только реально переиспользуемые test helpers;
- `eslint-config` не должен зависеть от структуры конкретного приложения.

Shared packages не являются местом для продуктовой бизнес-логики.

## Зависимости

Добавляйте dependency в конкретный workspace package:

```bash
pnpm add zod --filter @quakke/config
pnpm add -D @testing-library/user-event --filter @quakke/ui
```

Связывайте workspace packages через pnpm, а не через ручные `tsconfig paths`:

```bash
pnpm add '@quakke/contracts@workspace:*' --filter @quakke/api
```

Runtime dependency приложения не должна без причины находиться только в корневом
`package.json`. После изменения dependencies коммитьте `pnpm-lock.yaml`.

## Проверки

Для одного проекта:

```bash
pnpm nx lint api
pnpm nx typecheck api
pnpm nx test api
pnpm nx build api
```

Для изменений относительно `main`:

```bash
pnpm nx format:check --base=origin/main --head=HEAD
pnpm affected:check --base=origin/main --head=HEAD
```

Полная проверка:

```bash
pnpm check
```

`pnpm check` не запускает e2e: они выполняются отдельными Nx targets и автоматически
добавляются CI для затронутых приложений.

Nx учитывает dependency graph. Изменение библиотеки проверяет саму библиотеку и
проекты-потребители. Изменение root-файла или Docker build-контекста может затронуть
весь workspace.

### Тесты

- unit-тесты размещаются рядом с кодом;
- integration-тесты проверяют adapters и границы модулей;
- frontend e2e находятся в `apps/*-e2e` и используют Playwright;
- API/worker e2e проверяют внешние контракты, очереди и хранилища;
- исправление бага должно содержать regression test, если это практически возможно.

Тест не должен зависеть от порядка запуска и обязан очищать созданные данные.

## Git hooks

Husky использует один набор hooks в корне:

- `pre-commit` запускает `lint-staged`;
- для staged JS/TS выполняются ESLint с autofix и Prettier;
- для staged JSON/Markdown/YAML/CSS/SCSS выполняется Prettier;
- `commit-msg` запускает commitlint.

Hooks проверяют только staged-файлы и не заменяют `pnpm check` или CI. Не используйте
`--no-verify` в обычном flow.

## Conventional Commits

Рекомендуемый способ:

```bash
pnpm cm
```

Ручной формат:

```text
<type>(<scope>): <subject>
```

Допустимые types:

| Type       | Когда использовать                           |
| ---------- | -------------------------------------------- |
| `feat`     | новая пользовательская или системная функция |
| `fix`      | исправление ошибки                           |
| `docs`     | только документация                          |
| `style`    | форматирование без изменения поведения       |
| `refactor` | изменение структуры без новой функции/bugfix |
| `perf`     | улучшение производительности                 |
| `test`     | тесты и test infrastructure                  |
| `build`    | build system и packaging                     |
| `ci`       | GitHub Actions и delivery flow               |
| `chore`    | служебное изменение                          |
| `revert`   | отмена предыдущего коммита                   |

Допустимые scopes:

```text
root, web, studio, admin, api, worker-media, worker-notifications,
ui, api-client, contracts, config, testing, infra, docs, deps, ci
```

Требования к subject:

- английский язык;
- lowercase;
- краткое повелительное описание;
- без точки в конце;
- вся строка заголовка не длиннее 100 символов.

Примеры:

```text
feat(api): add refresh token rotation
fix(worker-media): handle duplicate transcode jobs
docs(root): clarify local setup
ci(root): run affected projects in pull requests
chore(deps): update nx packages
```

Breaking change:

```text
feat(contracts)!: change video processing event
```

Описание миграции добавляется в body/footer `BREAKING CHANGE:`.

## Pull request

Перед открытием PR:

1. Проверьте, что ветка содержит одну логическую задачу.
2. Обновите tests и документацию, если изменился контракт или flow.
3. Выполните affected-проверки или `pnpm check`.
4. Убедитесь, что в diff нет secrets и generated artifacts.
5. Опишите причину изменения, реализацию, способ проверки и риски.

После открытия PR автоматически запускаются quality, dependency review, affected e2e,
Docker build и security scan только для затронутых проектов. Stage deployment остаётся
ручным.

## Definition of done

Изменение считается готовым, когда:

- соблюдены границы приложений и пакетов;
- TypeScript, lint и formatting проходят без предупреждений;
- добавлены необходимые tests;
- изменённые публичные контракты и runbooks документированы;
- нет secrets и случайных unrelated changes;
- PR pipeline завершён успешно.
