# api

Основное NestJS приложение и владелец продуктовой бизнес-логики.

Целевые входы:

- GraphQL для пользовательских и административных бизнес-данных;
- REST для resumable upload, healthcheck и технических endpoint.

Бизнес-модули должны иметь явные границы. API не вызывает workers напрямую, а
публикует versioned commands в RabbitMQ. Тяжёлая обработка и provider-specific код
сюда не помещаются.

Сейчас реализован только `GET /api/health/live`.

```bash
PORT=3333 pnpm nx serve api
pnpm nx lint api
pnpm nx typecheck api
pnpm nx test api
pnpm nx build api
```
