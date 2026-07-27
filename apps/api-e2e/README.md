# api-e2e

Black-box e2e для REST/GraphQL API. Тесты запускают `api` и проверяют внешний контракт,
не импортируя внутреннюю реализацию модулей.

Сейчас проверяется базовый health endpoint.

```bash
pnpm nx e2e api-e2e
```
