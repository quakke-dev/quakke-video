# studio

Next.js приложение автора. Целевые сценарии: resumable upload, управление видео,
аналитика, мониторинг канала и партнёрские заявки.

Приложение владеет только маршрутами и UI студии. Оно использует shared packages,
но не импортирует код из `web` или `admin`. Бизнес-правила остаются в API.

Сейчас приложение содержит только стартовый экран.

```bash
pnpm nx dev studio --port=3001
pnpm nx lint studio
pnpm nx build studio
```

TypeScript проверяется внутри `next build`; отдельного Nx target `typecheck` пока нет.
