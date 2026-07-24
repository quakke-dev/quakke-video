# @quakke/api-client

Типизированный клиент для GraphQL и технических REST endpoint, включая upload.
Пакет отвечает за transport, сериализацию, ошибки и отмену запросов, но не хранит
React state и не принимает бизнес-решения.

Контракты берутся из `@quakke/contracts`. Публичный API экспортируется через
`src/index.ts`.

```bash
pnpm nx test api-client
pnpm nx build api-client
```
