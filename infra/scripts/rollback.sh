#!/usr/bin/env sh

set -eu

script_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
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

if [ ! -f "$environment_file" ] || [ ! -f "$release_file" ]; then
  echo "Deployment environment or current release manifest is missing" >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
. "$environment_file"
set +a

if [ "${ENABLE_WORKERS:-false}" = "true" ]; then
  profiles="--profile workers"
else
  profiles=
fi

compose() {
  manifest=$1
  shift

  # shellcheck disable=SC2086
  docker compose \
    --env-file "$environment_file" \
    --env-file "$manifest" \
    -f "$compose_file" \
    $profiles \
    "$@"
}

cp "$release_file" "$temporary_release_file"

if ! compose "$previous_release_file" pull ||
  ! compose "$previous_release_file" up -d --remove-orphans --wait; then
  echo "Rollback failed; restoring the current release" >&2
  compose "$release_file" pull || true
  compose "$release_file" up -d --remove-orphans --wait || true
  rm -f "$temporary_release_file"
  exit 1
fi

cp "$previous_release_file" "$release_file"
mv "$temporary_release_file" "$previous_release_file"
