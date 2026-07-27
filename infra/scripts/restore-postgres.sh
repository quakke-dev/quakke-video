#!/usr/bin/env sh

set -eu

if [ "$#" -ne 1 ]; then
  echo "Usage: CONFIRM_RESTORE=yes restore-postgres.sh <backup.sql.gz>" >&2
  exit 2
fi

if [ "${CONFIRM_RESTORE:-no}" != "yes" ]; then
  echo "Set CONFIRM_RESTORE=yes to acknowledge destructive database restore" >&2
  exit 2
fi

backup_file=$1
script_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
deploy_root=$(dirname "$script_dir")
compose_file="$deploy_root/compose/compose.deploy.yml"
environment_file="$deploy_root/.env"
release_file="$deploy_root/.release.env"

if [ ! -f "$backup_file" ]; then
  echo "Backup file does not exist: $backup_file" >&2
  exit 1
fi

gzip -cd "$backup_file" |
  docker compose \
    --env-file "$environment_file" \
    --env-file "$release_file" \
    -f "$compose_file" \
    exec -T postgres sh -c \
      'dropdb --if-exists --force -U "$POSTGRES_USER" "$POSTGRES_DB" &&
       createdb -U "$POSTGRES_USER" "$POSTGRES_DB" &&
       psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
