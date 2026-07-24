# @quakke/ui

Общий React UI kit: primitives, accessibility, темы, tokens и визуальные состояния.
Пакет не содержит продуктовых маршрутов, запросов к API и бизнес-логики.

Публичный API экспортируется только через `src/index.ts`. Для каждого компонента
нужны unit-тесты и Storybook story.

```bash
pnpm nx test ui
pnpm nx build ui
pnpm nx storybook ui
```
