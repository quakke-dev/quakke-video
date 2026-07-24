# worker-notifications-e2e

Резерв под интеграционные сценарии доставки уведомлений через RabbitMQ и тестовый
provider. HTTP-проверок нет, поскольку worker не открывает порт.

После появления consumer тест проверяет команду, retry и итоговое событие. Пока
target проходит без тестов.

```bash
pnpm nx e2e worker-notifications-e2e
```
