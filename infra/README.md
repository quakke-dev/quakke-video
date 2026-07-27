# Инфраструктура

Быстрый старт разработчика находится в [корневом README](../README.md), требования
к VPS — в [docs/operations/vps.md](../docs/operations/vps.md), устройство pipeline —
в [docs/operations/ci-cd.md](../docs/operations/ci-cd.md).

Инфраструктура рассчитана на три окружения:

| Окружение  | Где работает          | Данные                                     |
| ---------- | --------------------- | ------------------------------------------ |
| Local      | машина разработчика   | Docker volumes и MinIO                     |
| Stage      | VPS, постоянно        | отдельные PostgreSQL, Redis, RabbitMQ и S3 |
| Production | тот же VPS, постоянно | отдельные PostgreSQL, Redis, RabbitMQ и S3 |

Один VPS является осознанным ограничением учебного проекта. Окружения изолированы
на уровне Compose projects, networks, volumes, credentials и S3 buckets, но не имеют
отказоустойчивости на уровне host.

## Состав

- `docker-compose.yml` - локальные PostgreSQL, Redis, RabbitMQ и MinIO.
- `compose/compose.deploy.yml` - один runtime environment, используется отдельно
  для `stage` и `production`.
- `compose/compose.edge.yml` - общий Nginx, единственный владелец портов `80/443`.
- `docker/` - production images приложений и workers.
- `env/` - безопасные примеры конфигурации без секретов.
- `nginx/` - маршрутизация production, stage и RabbitMQ Management.
- `scripts/` - deploy, rollback, cleanup, backup и restore.

## Локальная инфраструктура

```bash
cp .env.local.example .env.local
pnpm infra:up
pnpm infra:logs
pnpm infra:down
```

Все локальные порты привязаны к `127.0.0.1`. MinIO нужен только для разработки:
stage и production используют Timeweb Cloud S3.

## Топология удалённых окружений

На VPS создаются три независимых Compose project:

```text
quakke-video-edge
quakke-video-stage
quakke-video-production
```

Runtime-контейнеры не публикуют host ports. Nginx подключён к stage и production
edge networks. PostgreSQL и Redis доступны только в internal data network.
Изменение shared edge валидируется в PR, но применяется только production pipeline
после merge и ручного approval: stage job не может менять proxy перед production.

Рекомендуемая структура:

```text
/opt/quakke-video/
├── edge/
│   ├── .env
│   ├── compose/
│   ├── nginx/
│   └── auth/
│       ├── operations.htpasswd
│       └── stage.htpasswd
├── stage/
│   ├── .env
│   ├── .release.env
│   ├── compose/
│   ├── scripts/
│   └── backups/
└── production/
    ├── .env
    ├── .release.env
    ├── compose/
    ├── scripts/
    └── backups/
```

## Домены

| Назначение | Production               | Stage                            |
| ---------- | ------------------------ | -------------------------------- |
| Web        | `quakke-video.ru`        | `quakke-video-stage.tech`        |
| Studio     | `studio.quakke-video.ru` | `studio.quakke-video-stage.tech` |
| Admin      | `admin.quakke-video.ru`  | `admin.quakke-video-stage.tech`  |
| API        | `api.quakke-video.ru`    | `api.quakke-video-stage.tech`    |
| Rabbit UI  | `rabbit.quakke-video.ru` | `rabbit.quakke-video-stage.tech` |

Весь stage защищён Nginx Basic Auth и заголовком `X-Robots-Tag`. RabbitMQ Management
дополнительно требует собственный RabbitMQ login. Для production Rabbit UI используется
отдельный `operations.htpasswd`.

PostgreSQL и Redis нельзя публиковать через DNS/HTTPS: доступ к ним выполняется через
SSH tunnel. `logs.*`, `ui.*` и `status.*` зарезервированы до появления Grafana/Loki,
Storybook deployment и отдельной status page. Пустые публичные панели не создаются.
Timeweb S3 использует endpoint `https://s3.twcstorage.ru`; отдельный `s3.*` для приватных
media objects не нужен.

## Timeweb S3

Создаются четыре private bucket:

```text
quakke-video-stage-media
quakke-video-stage-backups
quakke-video-production-media
quakke-video-production-backups
```

Endpoint: `https://s3.twcstorage.ru`, region: `ru-1`. Timeweb использует одинаковые
Access/Secret keys для всех buckets одного пользователя. Поэтому разделение окружений
логическое: утечка этих ключей затронет оба окружения. Это принято как ограничение
проекта; имена buckets всегда передаются явно.

Для backup buckets задаётся lifecycle policy. Media buckets остаются private, доступ
к объектам выдаётся через presigned URLs. Полезные ссылки:

- <https://timeweb.cloud/docs/s3-storage>
- <https://timeweb.cloud/docs/s3-storage/manage-storage>
- <https://timeweb.cloud/docs/s3-storage/tools/aws-cli>

## Релизы и rollback

Каждый image получает immutable tag с полным Git SHA. Manifest `.release.env` хранит
отдельный tag каждого сервиса:

```text
WEB_IMAGE_TAG
STUDIO_IMAGE_TAG
ADMIN_IMAGE_TAG
API_IMAGE_TAG
WORKER_MEDIA_IMAGE_TAG
WORKER_NOTIFICATIONS_IMAGE_TAG
```

Поэтому изменение одного приложения не требует пересборки остальных. Перед обновлением
manifest копируется в `.release.previous.env`. При неуспешном healthcheck deploy script
автоматически возвращает предыдущий manifest.

Ручной rollback:

```bash
/opt/quakke-video/production/scripts/rollback.sh
```

Workers находятся в Compose profile `workers`, пока RabbitMQ consumers не реализованы.
После реализации в environment file добавляется `ENABLE_WORKERS=true`.

## Очистка

После успешного deploy:

- предыдущие images получают локальные aliases `rollback-stage` или
  `rollback-production`;
- удаляются неиспользуемые images старше семи дней;
- очищается BuildKit cache старше семи дней;
- текущие контейнеры и один предыдущий release сохраняются.

Требования к диску и RAM описаны в
[документе о VPS](../docs/operations/vps.md).

## PostgreSQL backup и restore

`backup-postgres.sh` создаёт compressed `pg_dump`, checksum и отправляет архив в
Timeweb S3, если на host установлен AWS CLI:

```cron
15 2 * * * BACKUP_RETENTION_DAYS=14 /opt/quakke-video/stage/scripts/backup-postgres.sh
45 2 * * * BACKUP_RETENTION_DAYS=14 /opt/quakke-video/production/scripts/backup-postgres.sh
```

AWS CLI для Timeweb настраивается с region `ru-1`. Реальные ключи берутся из `.env`,
а не из глобального AWS profile. Для удалённых объектов retention задаётся lifecycle
policy bucket.

Восстановление является разрушительной операцией:

```bash
CONFIRM_RESTORE=yes \
  /opt/quakke-video/production/scripts/restore-postgres.sh \
  /path/to/postgres-backup.sql.gz
```

Backup считается рабочим только после регулярного тестового восстановления на stage.

## Ограничения текущего состояния

- VPS, DNS, TLS и GitHub Environments ещё не настроены.
- Workers собираются, но отключены до реализации RabbitMQ consumers.
- Database migrations будут добавлены вместе с выбранным PostgreSQL adapter/ORM.
- Централизованные logs, metrics и alerts ещё не развёрнуты; домены `logs.*` и
  `status.*` только зарезервированы.
- Первый remote deploy выполняется только после отдельного provisioning runbook.

## Связанная документация

- [CI/CD и affected builds](../docs/operations/ci-cd.md)
- [VPS, безопасность и ресурсы](../docs/operations/vps.md)
- [Architecture decision](../docs/adr/0004-environments-and-delivery.md)
