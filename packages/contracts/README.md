# @quakke/contracts

Переносимые контракты на границах приложений: схемы запросов, ответы, события и
сообщения RabbitMQ. В пакете нет NestJS, React, доступа к БД и runtime-инфраструктуры.

Контракт должен иметь runtime validation там, где данные приходят извне. Breaking
changes сообщений оформляются новой версией.

```bash
pnpm nx test contracts
pnpm nx build contracts
```
