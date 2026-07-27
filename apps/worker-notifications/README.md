# worker-notifications

Standalone NestJS worker для email и внутренних уведомлений. Worker не открывает
HTTP-порт.

Здесь размещаются provider adapters, templates, retry/DLQ, идемпотентность и учёт
результата доставки. Решение о необходимости уведомления остаётся в бизнес-модуле API.

Сейчас приложение только создаёт NestJS application context. Consumer ещё не
реализован, поэтому worker не включён в remote Compose profile по умолчанию.

```bash
pnpm nx serve worker-notifications
pnpm nx lint worker-notifications
pnpm nx typecheck worker-notifications
pnpm nx test worker-notifications
pnpm nx build worker-notifications
```
