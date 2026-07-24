# ADR 0003: Asynchronous processing through RabbitMQ

- Статус: принято
- Дата: 2026-07-24

## Решение

API публикует команды на тяжелые операции в RabbitMQ. `worker-media` и
`worker-notifications` запускаются как standalone Nest contexts без HTTP-сервера и
получают сообщения через transport adapter.

## Последствия

Доставка считается at-least-once, поэтому обработчики обязаны быть идемпотентными.
Контракты сообщений версионируются, retry ограничен, неисправимые сообщения попадают
в DLQ. HTTP health endpoint воркерам не добавляется; их состояние проверяется по
соединению с broker, метрикам и heartbeat.
