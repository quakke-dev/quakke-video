# worker-media

Standalone NestJS worker для FFmpeg, HLS, thumbnails и другой обработки media
artifacts. Worker не открывает HTTP-порт и не владеет пользовательскими API.

Целевой вход — versioned RabbitMQ command. Обработчики обязаны быть идемпотентными,
а временные файлы — очищаться после завершения или ошибки.

Сейчас приложение только создаёт NestJS application context. Consumer ещё не
реализован, поэтому worker не включён в remote Compose profile по умолчанию.

```bash
pnpm nx serve worker-media
pnpm nx lint worker-media
pnpm nx typecheck worker-media
pnpm nx test worker-media
pnpm nx build worker-media
```
