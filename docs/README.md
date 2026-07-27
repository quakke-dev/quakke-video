# Документация

## Начало работы

- [Корневой README](../README.md) — требования, быстрый старт, структура и команды.
- [CONTRIBUTING](../CONTRIBUTING.md) — ветки, код, зависимости, tests, коммиты и PR.

## Архитектура

- [Обзор системы](architecture/overview.md) — приложения, пакеты, данные, очереди и
  границы ответственности.
- [ADR](adr/README.md) — зафиксированные архитектурные решения и их последствия.

ADR описывают, почему решение было принято. Они не заменяют актуальные инструкции.
Если реализация меняется, сначала обновляется актуальный overview/runbook, затем
создаётся новый ADR, который отменяет или уточняет предыдущий.

## Эксплуатация

- [Infrastructure](../infra/README.md) — Compose topology, домены, S3, releases,
  rollback и backup.
- [CI/CD](operations/ci-cd.md) — branch flow, affected calculation, jobs и GitHub
  Environments.
- [VPS](operations/vps.md) — capacity, network policy, SSH, безопасность и backups.

## Локальная документация

Каждая директория в `apps/*` и `packages/*` содержит короткий README. Он отвечает
только на три вопроса:

1. За что отвечает проект.
2. Что в нём размещать нельзя.
3. Какими Nx-командами его запускать и проверять.
