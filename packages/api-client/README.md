# @quakke/api-client

Типизированный transport-клиент для GraphQL и технических REST endpoint, включая
upload. Пакет отвечает за сериализацию, transport errors, cancellation и передачу
auth context.

React state, UI и бизнес-решения сюда не входят. Контракты должны браться из
`@quakke/contracts`, публичный API экспортируется через `src/index.ts`.

Сейчас пакет является пустым foundation skeleton.

```bash
pnpm nx lint api-client
pnpm nx typecheck api-client
pnpm nx test api-client
pnpm nx build api-client
```
