#!/usr/bin/env sh

set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
deploy_root=$(dirname "$script_dir")
compose_file="$deploy_root/compose/compose.deploy.yml"
environment_file="$deploy_root/.env"
release_file="$deploy_root/.release.env"
previous_release_file="$deploy_root/.release.previous.env"
temporary_release_file="$deploy_root/.release.swap.env"

if [ ! -f "$previous_release_file" ]; then
  echo "No previous release is available" >&2
  exit 1
fi

set -a
. "$environment_file"
set +a

cp "$release_file" "$temporary_release_file"
cp "$previous_release_file" "$release_file"
cp "$temporary_release_file" "$previous_release_file"
rm "$temporary_release_file"

if [ "${ENABLE_WORKERS:-false}" = "true" ]; then
  profiles="--profile workers"
else
  profiles=
fi

# shellcheck disable=SC2086
docker compose \
  --env-file "$environment_file" \
  --env-file "$release_file" \
  -f "$compose_file" \
  $profiles \
  pull

# shellcheck disable=SC2086
docker compose \
  --env-file "$environment_file" \
  --env-file "$release_file" \
  -f "$compose_file" \
  $profiles \
  up -d --remove-orphans --wait
