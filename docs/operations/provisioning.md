# Provisioning VPS

Этот runbook подготавливает новый Ubuntu VPS для `quakke-video`. Он настраивает host,
но не запускает stage или production и не размещает application secrets.

## Предварительные условия

- создан snapshot VPS;
- есть Ed25519 key администратора;
- известны IP и SSH port сервера;
- DNS и TLS на этом этапе не обязательны.

В примерах используются:

```bash
SERVER_IP=<server-ip>
ADMIN_USER=test
DEPLOY_USER=deploy
```

`test` - интерактивный администратор. `deploy` - отдельный пользователь GitHub
Actions без `sudo`, но с доступом к Docker. Членство в группе `docker` фактически
даёт root-доступ, поэтому у пользователей должны быть разные ключи.

## 1. Первичный аудит

До изменений проверяются ОС, ресурсы, открытые порты и действующие настройки:

```bash
hostnamectl
cat /etc/os-release
free -h
df -hT /
lsblk
ss -lntup
ufw status verbose
sshd -T
```

На новом VPS наружу должны быть нужны только SSH и предустановленный Timeweb
Zabbix Agent. Application ports до deploy не открываются.

## 2. Администратор

Пользователь создаётся до отключения root login:

```bash
useradd --create-home --shell /bin/bash test
usermod --append --groups sudo test
install -d -m 700 -o test -g test /home/test/.ssh
install -m 600 -o test -g test admin-key.pub /home/test/.ssh/authorized_keys
printf '%s\n' 'test ALL=(ALL:ALL) NOPASSWD: ALL' \
  >/etc/sudoers.d/90-test
chmod 440 /etc/sudoers.d/90-test
visudo --check --file=/etc/sudoers.d/90-test
```

Перед hardening обязательно проверяются отдельный SSH-сеанс и `sudo -n true`.

## 3. SSH hardening

Файл `/etc/ssh/sshd_config.d/00-quakke-hardening.conf`:

```text
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
X11Forwarding no
MaxAuthTries 3
AllowUsers test deploy
```

Префикс `00-` важен: cloud-init может содержать
`50-cloud-init.conf` с `PasswordAuthentication yes`, а OpenSSH использует первое
найденное значение.

```bash
sshd -t
systemctl reload ssh
sshd -T | grep -E \
  '^(permitrootlogin|passwordauthentication|allowusers|maxauthtries) '
```

После reload проверяется новый вход администратора и отказ входа для `root`.

## 4. Firewall

UFW разрешает только SSH, HTTP, HTTPS и Zabbix от серверов Timeweb:

```bash
ufw default deny incoming
ufw default allow outgoing
ufw limit OpenSSH comment 'SSH key access'
ufw allow 80/tcp comment 'HTTP and ACME'
ufw allow 443/tcp comment 'HTTPS'
ufw allow from 92.53.116.12 to any port 10050 proto tcp
ufw allow from 92.53.116.111 to any port 10050 proto tcp
ufw allow from 92.53.116.119 to any port 10050 proto tcp
ufw --force enable
ufw status verbose
```

Docker published ports могут обходить UFW. Поэтому deployment Compose публикует
только `80/443` общего Nginx; PostgreSQL, Redis, RabbitMQ и приложения остаются
во внутренних Docker networks.

## 5. Обновления и fail2ban

```bash
apt-get update
apt-get -y dist-upgrade
apt-get install -y ca-certificates curl fail2ban
```

Файл `/etc/fail2ban/jail.d/sshd.local`:

```ini
[sshd]
enabled = true
backend = systemd
maxretry = 5
findtime = 10m
bantime = 1h
```

Проверка:

```bash
fail2ban-client -t
systemctl enable --now fail2ban
fail2ban-client status sshd
```

## 6. Docker Engine

Docker устанавливается из официального APT repository, а не через convenience
script:

```bash
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
```

Файл `/etc/apt/sources.list.d/docker.sources`:

```text
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: resolute
Components: stable
Architectures: amd64
Signed-By: /etc/apt/keyrings/docker.asc
```

```bash
apt-get update
apt-get install -y \
  docker-ce \
  docker-ce-cli \
  containerd.io \
  docker-buildx-plugin \
  docker-compose-plugin
systemctl enable --now docker
```

Файл `/etc/docker/daemon.json` ограничивает логи и сохраняет работающие
контейнеры при restart daemon:

```json
{
  "log-driver": "local",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "live-restore": true
}
```

Перед restart конфигурация проверяется:

```bash
dockerd --validate --config-file=/etc/docker/daemon.json
systemctl restart docker
docker info
docker compose version
```

## 7. Swap и journal

Swap является аварийным запасом, а не дополнительной RAM:

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
printf '%s\n' '/swapfile none swap sw 0 0' >>/etc/fstab
printf '%s\n' 'vm.swappiness=10' >/etc/sysctl.d/99-quakke.conf
sysctl --system
```

Файл `/etc/systemd/journald.conf.d/00-quakke-limits.conf`:

```ini
[Journal]
SystemMaxUse=200M
RuntimeMaxUse=100M
MaxRetentionSec=7day
```

## 8. CI deploy user

Ключ создаётся отдельно от административного:

```bash
ssh-keygen -t ed25519 \
  -f ~/.ssh/quakke-video-deploy \
  -C 'github-actions@quakke-video'
```

На сервере:

```bash
useradd --create-home --shell /bin/bash deploy
usermod --append --groups docker deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
```

В `authorized_keys` перед публичным ключом добавляется `restrict`:

```text
restrict ssh-ed25519 <public-key> github-actions@quakke-video
```

`deploy` не получает `sudo`. Ему принадлежат deployment directories:

```bash
install -d -m 750 -o deploy -g deploy /opt/quakke-video
install -d -m 700 -o deploy -g deploy \
  /opt/quakke-video/edge \
  /opt/quakke-video/stage \
  /opt/quakke-video/production \
  /opt/quakke-video/edge/auth
```

Проверяются SSH command, Docker без `sudo`, отсутствие `sudo` и SCP upload.

## 9. GitHub Environments

Оба Environment используют один host и разные deployment paths:

| Variable           | Stage                     | Production                     |
| ------------------ | ------------------------- | ------------------------------ |
| `DEPLOY_HOST`      | IP VPS                    | IP VPS                         |
| `DEPLOY_PORT`      | `22`                      | `22`                           |
| `DEPLOY_USER`      | `deploy`                  | `deploy`                       |
| `DEPLOY_PATH`      | `/opt/quakke-video/stage` | `/opt/quakke-video/production` |
| `DEPLOY_EDGE_PATH` | `/opt/quakke-video/edge`  | `/opt/quakke-video/edge`       |

Environment secrets:

- `DEPLOY_SSH_PRIVATE_KEY` - private CI key;
- `DEPLOY_KNOWN_HOSTS` - результат проверенного `ssh-keyscan`;
- `DEPLOY_ENV_FILE` - отдельный environment file;
- Basic Auth credentials для stage и operations.

Fingerprint `ssh-keyscan` сверяется с host key непосредственно на VPS:

```bash
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
ssh-keyscan -p 22 -t ed25519 "$SERVER_IP" | ssh-keygen -lf -
```

Private deploy key не коммитится. После добавления в GitHub Secret его резервная
копия хранится только в password manager либо удаляется с рабочей машины.

## 10. Финальная проверка

```bash
systemctl is-active \
  ssh docker containerd fail2ban unattended-upgrades zabbix-agent
ufw status verbose
fail2ban-client status sshd
docker info
free -h
df -hT /
swapon --show
ss -lntup
test ! -f /var/run/reboot-required
```

До первого deploy дополнительно должны быть готовы:

1. VPS не меньше `4 vCPU / 8 GB RAM / 80 GB NVMe`.
2. Все production и stage DNS records указывают на VPS.
3. Шесть GHCR packages имеют public visibility.
4. Выпущен TLS certificate и проверено автоматическое renewal.
5. Созданы отдельные private S3 buckets и GitHub Environment secrets.
