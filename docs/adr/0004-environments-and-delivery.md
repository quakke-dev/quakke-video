# ADR 0004: Environments and delivery

- Статус: принято
- Дата: 2026-07-24

## Контекст

Проекту нужны воспроизводимые local, stage и production, ручное продвижение release
и низкая стоимость инфраструктуры. Stage и production должны быть постоянно доступны,
но отдельные VPS на текущем этапе экономически нецелесообразны.

## Решение

- Local использует Docker Compose и MinIO.
- Stage и production постоянно работают на одном Timeweb VPS.
- Общий edge Nginx единолично занимает `80/443`.
- Окружения имеют отдельные Compose projects, networks, volumes, databases,
  Redis, RabbitMQ, credentials и Timeweb S3 buckets.
- Весь stage и операционные панели защищены Basic Auth.
- PR в `main` запускает affected checks; stage deploy выполняется вручную.
- Merge commit в `main` повторно проверяется; production deploy выполняется вручную.
- Images хранятся публично в GHCR с immutable Git SHA.
- Каждый сервис имеет независимый image tag в release manifest.
- Root changes затрагивают весь workspace; project changes затрагивают project и
  его dependents по Nx graph.
- Rollback восстанавливает предыдущий полный manifest.

## Последствия

Стоимость ниже, а окружения не делят application state. При этом VPS является общей
точкой отказа и общим resource pool. S3 keys Timeweb дают доступ ко всем buckets
аккаунта, поэтому bucket isolation не является security boundary.

Переход к нескольким hosts не требует менять application images и environment
contracts. Первыми кандидатами на вынос являются PostgreSQL, worker-media и stage.
