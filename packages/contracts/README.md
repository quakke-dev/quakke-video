# @quakke/contracts

Переносимые контракты на границах приложений: DTO, runtime schemas, API responses,
RabbitMQ commands и events.

В пакете нет NestJS, React, доступа к БД и provider-specific инфраструктуры. Данные,
приходящие извне, должны иметь runtime validation. Breaking queue/event contracts
получают новую версию.

Сейчас пакет является пустым foundation skeleton.

```bash
pnpm nx lint contracts
pnpm nx typecheck contracts
pnpm nx test contracts
pnpm nx build contracts
```
