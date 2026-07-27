# @quakke/config

Общие utilities для строгой runtime-валидации конфигурации API и workers. Здесь
размещаются Zod schemas и небольшие config factories.

Пакет не хранит secrets, не содержит environment-specific значений и не должен читать
`process.env` как побочный эффект импорта.

Сейчас пакет является пустым foundation skeleton.

```bash
pnpm nx lint config
pnpm nx typecheck config
pnpm nx test config
pnpm nx build config
```
