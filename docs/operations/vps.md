# VPS: ресурсы и безопасность

Подробные Compose-файлы, домены и команды эксплуатации находятся в
[infra/README.md](../../infra/README.md). Здесь зафиксированы capacity и security
требования к host.

## Текущая конфигурация

Планируемая начальная конфигурация Timeweb:

```text
2 vCPU × 3.3 GHz
2 GB RAM
15 GB NVMe
Ubuntu 26.04
```

Этой конфигурации недостаточно для постоянной работы двух полных окружений. Даже без
workers два PostgreSQL, два Redis, два RabbitMQ, шесть Next.js processes, два API,
Nginx, Docker и ОС требуют больше 2 GB. FFmpeg создаёт дополнительную нагрузку на CPU,
RAM и временный диск.

15 GB также недостаточно для ОС, Docker layers, двух PostgreSQL volumes, RabbitMQ,
logs и rollback images. Cleanup снижает рост, но не создаёт необходимый запас.

Эту конфигурацию можно использовать только для bootstrap-проверки одного окружения
с выключенными workers. Для заявленного always-on stage + production upgrade нужно
сделать до первого реального deploy.

## Рекомендуемая конфигурация

Минимум для ранней разработки:

```text
4 vCPU
8 GB RAM
80 GB NVMe
2-4 GB swap как аварийный запас
```

Оптимальный старт для двух always-on окружений и одного FFmpeg job:

```text
8 vCPU
16 GB RAM
120-160 GB NVMe
```

Builds выполняются на GitHub-hosted runners, поэтому VPS хранит только runtime images.
`worker-media` начинает с `MEDIA_CONCURRENCY=1`. Увеличивать concurrency можно только
после наблюдения за CPU, load average, memory, disk IO и временем обработки очереди.

## Ограничения одного VPS

Один host остаётся общей точкой отказа. При reboot, заполнении диска или отказе VPS
одновременно недоступны stage и production. Compose isolation защищает от случайного
пересечения credentials и volumes, но не от отказа host и исчерпания общих ресурсов.

При росте проекта выносить компоненты следует в таком порядке:

1. media objects уже находятся во внешнем Timeweb S3;
2. production PostgreSQL переносится в managed database или отдельный VPS;
3. worker-media переносится на compute node;
4. stage переносится на отдельный небольшой VPS;
5. Redis/RabbitMQ выносятся только при подтверждённой нагрузке или требованиях HA.

## Сетевая политика

Timeweb Cloud Firewall и host firewall разрешают входящие:

```text
22/tcp   только с доверенных IP, когда это возможно
80/tcp   HTTP redirect и ACME challenge
443/tcp  HTTPS
```

Порты `5432`, `6379`, `5672`, `15672` и `9000` не публикуются на host. Доступ
администратора к PostgreSQL выполняется через SSH tunnel.

RabbitMQ Management доступен через Nginx:

- Basic Auth на edge;
- отдельный RabbitMQ account;
- в будущем IP allowlist или VPN.

## SSH и операционная система

- отдельный пользователь `deploy`;
- SSH только по Ed25519 key;
- `PermitRootLogin no`;
- `PasswordAuthentication no`;
- deploy key не используется для интерактивной работы;
- unattended security updates;
- fail2ban;
- Docker log rotation;
- синхронизация времени;
- alerts на disk usage, memory pressure и container health.

Доступ пользователя `deploy` к Docker эквивалентен root-доступу. Ключ хранится только
в GitHub Environment secrets и регулярно ротируется.

## Стратегия резервного копирования

Используются три разных уровня:

1. ежедневный logical PostgreSQL dump в private Timeweb S3 bucket;
2. Timeweb backup/snapshot VPS перед инфраструктурными изменениями;
3. проверка restore на stage.

Snapshot не заменяет off-host database backup. Следует включить versioning/Object Lock
или lifecycle policy для backup buckets, если выбранный тариф это поддерживает.

Документация Timeweb:

- <https://timeweb.cloud/docs/cloud-servers/manage-servers/backup>
- <https://timeweb.cloud/docs/firewall>
- <https://timeweb.cloud/docs/s3-storage/supported-features>
