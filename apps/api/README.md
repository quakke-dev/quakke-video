# api

Основное NestJS приложение и владелец бизнес-логики. Планируемые входы: GraphQL для
бизнес-данных, REST для resumable upload, healthcheck и технических endpoint.

Модули должны иметь явные границы и не обращаться к worker-приложениям напрямую.
Тяжелая работа публикуется в RabbitMQ.

```bash
pnpm nx serve api
pnpm nx test api
pnpm nx build api
```
