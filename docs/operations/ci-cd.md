# CI/CD

Этот документ описывает реализацию pipeline. Ежедневный developer flow и правила PR
находятся в [CONTRIBUTING.md](../../CONTRIBUTING.md).

Workflow уже находится в `.github/workflows/ci.yml`. Фактический удалённый deploy
начнёт работать после создания GitHub Environments, secrets, variables и подготовки
VPS.

## Ветки и окружения

В репозитории используются `main` и task branches.

1. Push в task branch без PR не запускает workflow.
2. PR в `main` запускает проверки и сборку stage candidate.
3. Stage deploy выполняется только после ручного approval GitHub Environment `stage`.
4. После deploy выполняются smoke checks и affected Playwright e2e.
5. Merge в `main` запускает новый pipeline для merge commit.
6. Production deploy выполняется только после ручного approval Environment
   `production`.
7. После production deploy выполняются smoke checks и cleanup.

Stage и production также можно запустить вручную из GitHub Actions. Ручной запуск
выполняет тот же pipeline с quality, integration, images, environment approval и
deploy, а не обходит проверки.

Revert не является CI job. Для отката приложения используется release manifest,
а для отмены изменения в истории - обычный Conventional Commit `revert:`.

## Расчёт affected-проектов

Nx сравнивает base и head commits и использует project graph:

```bash
pnpm nx affected -t lint,typecheck,test,build --base=<base> --head=<head>
```

Правила:

- изменение project запускает его targets;
- изменение library также затрагивает приложения и библиотеки, которые от неё зависят;
- изменение frontend/API затрагивает соответствующие e2e projects через
  `implicitDependencies`;
- любой root-level файл принудительно затрагивает весь workspace;
- `infra/docker/**` пересобирает все application images;
- runtime-файлы `compose.deploy.yml`, `infra/env/**` и `infra/scripts/**` запускают
  deploy конфигурации, но сами не пересобирают application images;
- shared edge из `infra/nginx/**` и `compose.edge.yml` валидируется в PR, но обновляется
  только production job после merge и manual approval;
- изменение только документации внутри `docs/**` не собирает приложения.

Root globals также перечислены в `nx.json.sharedGlobals`, поэтому они входят в hashes
всех cacheable tasks.

## Полный release candidate

Affected вычисления определяют, какие приложения действительно нужно пересобрать.
При наличии хотя бы одного affected application pipeline при этом создаёт полный набор
из шести image tags для release SHA:

- affected applications собираются из исходного кода;
- unchanged applications проходят повторный Trivy scan и получают новый SHA tag через
  OCI manifest promotion из base commit;
- если base image ещё не опубликован, конкретное приложение собирается как fallback;
- deploy обновляет все шесть tags одним полным release manifest.

Таким образом, последний production pipeline включает изменения из предыдущих merge,
даже если промежуточные production deploy были пропущены. Stage candidate также не
смешивается с ранее развёрнутым PR.

## Кеширование

Nx local cache используется внутри job и локально у разработчика. `nx affected`
исключает незатронутые проекты полностью. Docker images используют GitHub Actions
BuildKit cache с отдельным scope для каждого приложения.

Без remote cache выполненный в старом CI run Nx task не переносится безопасно в новый
runner. Когда длительность pipeline станет заметной, подключается Nx Cloud. Не следует
архивировать `.nx/cache` через обычный `actions/cache`: Nx remote cache обеспечивает
проверку task hash и корректную передачу artifacts между machines.

## Этапы pipeline

`changes`
: Проверяет workflow через pinned Actionlint, затем вычисляет base/head, affected
projects, image matrix и affected e2e projects.

`quality`
: Выполняет `sync:check`, проверяет Compose и POSIX scripts через pinned ShellCheck,
затем запускает affected formatting, lint, typecheck, tests и builds.

`dependency-review`
: Блокирует PR при добавлении dependency с известной уязвимостью severity `high`.

`integration`
: Запускает только affected backend и frontend e2e до сборки images. Frontend e2e
выполняются в Chromium; после stage deploy они повторяются уже против stage URLs.

`images`
: Собирает только affected deployable applications, сканирует images до публикации,
продвигает unchanged images, публикует полный release candidate в GHCR и добавляет
provenance/SBOM.

`deploy`
: Ожидает manual environment approval, проверяет, что candidate не устарел, доставляет
manifest на VPS, проверяет health endpoints и запускает stage e2e. Ошибка smoke test
автоматически возвращает предыдущий application release и, если менялся shared edge,
предыдущую Nginx-конфигурацию, после чего завершает pipeline с ошибкой. Ошибка stage
e2e сохраняет запущенный candidate для диагностики и не вызывает автоматический
rollback.

Отдельный workflow `CodeQL` выполняет SAST для JavaScript/TypeScript на PR, push в
`main`, вручную и по еженедельному расписанию. Все сторонние GitHub Actions закреплены
на полных commit SHA; комментарий рядом сохраняет читаемую версию, а Dependabot
обновляет ссылки.

## Ручной deploy из GitHub UI

Сначала изменения workflow должны попасть в default branch `main`: GitHub показывает
`Run workflow` и его inputs из версии workflow, находящейся в default branch.

1. Откройте `GitHub -> Actions -> Pipeline`.
2. Нажмите `Run workflow`.
3. Выберите Git branch или tag.
4. Выберите `deploy_environment`: `stage` или `production`.
5. Нажмите `Run workflow`.
6. После успешных проверок откройте ожидающий job `deploy`, нажмите
   `Review deployments` и подтвердите выбранное Environment.

Для `production` workflow принимает только ветку `main`. Stage можно развернуть из
выбранной task branch, чтобы проверить её до merge. Ручной pipeline всегда собирает
все шесть application images: вычисление только по последнему commit выбранной ветки
не гарантирует полный candidate после нескольких локальных commits.

`dependency-review` в ручном workflow пропускается, поскольку эта проверка работает
только с dependency diff pull request. Quality, integration, image scanning, smoke
checks и stage e2e сохраняются.

Для обоих GitHub Environments можно оставить required reviewer, но при работе одним
разработчиком опция `Prevent self-review` должна быть выключена.

## Независимые версии images

Общий image tag для monorepo не используется. Если изменён только `api`, создаётся
только:

```text
ghcr.io/quakke/quakke-video-api:<git-sha>
```

Release manifest меняет `API_IMAGE_TAG`, остальные service tags остаются прежними.
Rollback меняет manifest целиком, поэтому окружение возвращается в согласованное
предыдущее состояние.

## Настройка GitHub

Создаются Environments `stage` и `production`. Для обоих включается required reviewer.
Так как проект ведёт один разработчик, `Prevent self-review` должен быть выключен.
Для production разрешается только branch `main`.

Environment variables:

| Variable           | Stage                                    | Production                       |
| ------------------ | ---------------------------------------- | -------------------------------- |
| `PUBLIC_URL`       | `https://quakke-video-stage.tech`        | `https://quakke-video.ru`        |
| `STUDIO_URL`       | `https://studio.quakke-video-stage.tech` | `https://studio.quakke-video.ru` |
| `ADMIN_URL`        | `https://admin.quakke-video-stage.tech`  | `https://admin.quakke-video.ru`  |
| `API_URL`          | `https://api.quakke-video-stage.tech`    | `https://api.quakke-video.ru`    |
| `DEPLOY_HOST`      | один IP/DNS VPS                          | тот же IP/DNS                    |
| `DEPLOY_PORT`      | `22`                                     | `22`                             |
| `DEPLOY_USER`      | `deploy`                                 | `deploy`                         |
| `DEPLOY_PATH`      | `/opt/quakke-video/stage`                | `/opt/quakke-video/production`   |
| `DEPLOY_EDGE_PATH` | не используется                          | `/opt/quakke-video/edge`         |

Environment secrets:

| Secret                    | Назначение                             |
| ------------------------- | -------------------------------------- |
| `DEPLOY_ENV_FILE`         | полный environment file без image tags |
| `DEPLOY_SSH_PRIVATE_KEY`  | Ed25519 key пользователя `deploy`      |
| `DEPLOY_KNOWN_HOSTS`      | заранее проверенный SSH host key       |
| `E2E_BASIC_AUTH_USERNAME` | stage/operations Basic Auth login      |
| `E2E_BASIC_AUTH_PASSWORD` | stage/operations Basic Auth password   |

GHCR images должны быть переключены в public после первой публикации. Server не хранит
GitHub PAT и скачивает public images анонимно.

В `Settings -> Code security and analysis` включаются:

- Dependency graph и Dependabot alerts;
- Dependabot security updates;
- secret scanning;
- push protection для найденных secrets;
- code scanning через добавленный CodeQL workflow.

В `Settings -> Actions -> General` workflow permissions можно оставить
`Read repository contents and packages permissions`: повышение до `packages: write` и
`security-events: write` задано только конкретным jobs. Все application и
infrastructure base images закреплены digest; Docker Dependabot обновляет tag и digest
через отдельный PR.

Первый deploy окружения должен содержать все шесть application images. Stage получает
их из первого инфраструктурного PR, затрагивающего root/Docker context. Для первичного
production deploy используется `workflow_dispatch`.

Branch protection для `main` должна запрещать прямой push и требовать успешный
`Pipeline / quality`, `Pipeline / dependency-review` и, когда job запущен,
`Pipeline / integration`. После первого успешного CodeQL run можно также сделать
обязательным `CodeQL / analyze`.

## Rollback из GitHub UI

Workflow `.github/workflows/rollback.yml` запускается только вручную из ветки `main`.

1. Откройте `GitHub -> Actions -> Rollback`.
2. Нажмите `Run workflow` и оставьте branch `main`.
3. Выберите `stage` или `production`.
4. Подтвердите соответствующий GitHub Environment.

Rollback сериализован с обычным deploy через общий concurrency group, переключает
окружение на предыдущий полный manifest и выполняет smoke test. Повторный rollback
переключает два последних manifest обратно.
