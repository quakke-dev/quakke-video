# @quakke/ui

Общий React UI kit: primitives, accessibility, themes, tokens и визуальные состояния.
Пакет не содержит продуктовые маршруты, API requests и бизнес-логику.

Публичный API экспортируется через `src/index.ts`. Новый компонент получает tests и
Storybook story, если это применимо.

Сейчас настроены Rollup, Vitest и typecheck, но компонентов ещё нет. Storybook
запланирован, однако project target и stories пока не созданы.

```bash
pnpm nx lint ui
pnpm nx typecheck ui
pnpm nx test ui
pnpm nx build ui
```
