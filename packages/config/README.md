# @quakke/config

Общие utilities для чтения и строгой runtime-валидации конфигурации. Здесь будут
Zod-схемы и небольшие factories, которые можно использовать в API и workers.

Пакет не хранит секреты, не читает env при импорте модуля и не содержит
environment-specific значений.

```bash
pnpm nx test config
pnpm nx build config
```
