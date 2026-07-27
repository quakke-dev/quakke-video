#!/usr/bin/env sh

set -eu

script_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
deploy_root=$(dirname "$script_dir")
compose_file="$deploy_root/compose/compose.deploy.yml"
environment_file="$deploy_root/.env"
release_file="$deploy_root/.release.env"
backup_dir=${BACKUP_DIR:-"$deploy_root/backups/postgres"}
retention_days=${BACKUP_RETENTION_DAYS:-14}
timestamp=$(date -u '+%Y%m%dT%H%M%SZ')
backup_name="postgres-$timestamp.sql.gz"
backup_file="$backup_dir/$backup_name"
temporary_file="$backup_dir/.postgres-$timestamp.sql"

if [ ! -f "$environment_file" ] || [ ! -f "$release_file" ]; then
  echo "Deployment environment or release manifest is missing" >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
. "$environment_file"
set +a

mkdir -p "$backup_dir"
umask 077

cleanup() {
  rm -f "$temporary_file"
}

trap cleanup EXIT HUP INT TERM

docker compose \
  --env-file "$environment_file" \
  --env-file "$release_file" \
  -f "$compose_file" \
  exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
  >"$temporary_file"

gzip -c "$temporary_file" >"$backup_file"
sha256sum "$backup_file" >"$backup_file.sha256"

if command -v aws >/dev/null 2>&1; then
  AWS_ACCESS_KEY_ID=$S3_ACCESS_KEY \
    AWS_SECRET_ACCESS_KEY=$S3_SECRET_KEY \
    AWS_DEFAULT_REGION=$S3_REGION \
    aws s3 cp \
      "$backup_file" \
      "s3://$S3_BUCKET_BACKUPS/postgres/$APP_ENV/$backup_name" \
      --endpoint-url "$S3_ENDPOINT" \
      --only-show-errors
else
  echo "AWS CLI is unavailable; backup remains local only" >&2
fi

find "$backup_dir" -type f -name 'postgres-*.sql.gz' -mtime "+$retention_days" -delete
find "$backup_dir" -type f -name 'postgres-*.sql.gz.sha256' -mtime "+$retention_days" -delete

echo "$backup_file"
