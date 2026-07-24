# worker-notifications

Standalone NestJS worker для email и внутренних уведомлений. Он получает команды
через RabbitMQ и не открывает HTTP-порт.

Здесь будут provider adapters, шаблоны, retry/DLQ, идемпотентность и учет результата
доставки. Бизнес-решение о необходимости уведомления остается в API.

```bash
pnpm nx serve worker-notifications
pnpm nx test worker-notifications
pnpm nx build worker-notifications
```
