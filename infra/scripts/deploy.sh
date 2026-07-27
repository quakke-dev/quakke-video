#!/usr/bin/env sh

set -eu

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  echo "Usage: deploy.sh <40-character-git-sha> [comma-separated-services]" >&2
  exit 2
fi

release_sha=$1
changed_services=${2:-}

validate_sha() {
  sha=$1

  if [ "${#sha}" -ne 40 ]; then
    return 1
  fi

  case "$sha" in
    *[!0-9a-f]*) return 1 ;;
  esac
}

if ! validate_sha "$release_sha"; then
  echo "Release SHA must be a 40-character lowercase Git SHA" >&2
  exit 2
fi

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
deploy_root=$(dirname "$script_dir")
compose_file="$deploy_root/compose/compose.deploy.yml"
environment_file="$deploy_root/.env"
release_file="$deploy_root/.release.env"
previous_release_file="$deploy_root/.release.previous.env"
temporary_release_file="$deploy_root/.release.next.env"
all_services="web studio admin api worker-media worker-notifications"

if [ ! -f "$environment_file" ]; then
  echo "Missing deployment environment file: $environment_file" >&2
  exit 1
fi

set -a
# The file is generated from a protected GitHub Environment secret.
. "$environment_file"
set +a

WEB_IMAGE_TAG=
STUDIO_IMAGE_TAG=
ADMIN_IMAGE_TAG=
API_IMAGE_TAG=
WORKER_MEDIA_IMAGE_TAG=
WORKER_NOTIFICATIONS_IMAGE_TAG=

if [ -f "$release_file" ]; then
  # This file is generated exclusively by this script.
  . "$release_file"
fi

normalized_services=$(printf '%s' "$changed_services" | tr ',' ' ')

for service in $normalized_services; do
  case "$service" in
    web) WEB_IMAGE_TAG=$release_sha ;;
    studio) STUDIO_IMAGE_TAG=$release_sha ;;
    admin) ADMIN_IMAGE_TAG=$release_sha ;;
    api) API_IMAGE_TAG=$release_sha ;;
    worker-media) WORKER_MEDIA_IMAGE_TAG=$release_sha ;;
    worker-notifications) WORKER_NOTIFICATIONS_IMAGE_TAG=$release_sha ;;
    *)
      echo "Unsupported deployment service: $service" >&2
      exit 2
      ;;
  esac
done

for service in $all_services; do
  case "$service" in
    web) service_tag=$WEB_IMAGE_TAG ;;
    studio) service_tag=$STUDIO_IMAGE_TAG ;;
    admin) service_tag=$ADMIN_IMAGE_TAG ;;
    api) service_tag=$API_IMAGE_TAG ;;
    worker-media) service_tag=$WORKER_MEDIA_IMAGE_TAG ;;
    worker-notifications) service_tag=$WORKER_NOTIFICATIONS_IMAGE_TAG ;;
  esac

  if ! validate_sha "$service_tag"; then
    echo "The first deployment must include all six application images" >&2
    exit 1
  fi
done

umask 077

if [ -f "$release_file" ]; then
  cp "$release_file" "$previous_release_file"
fi

{
  printf 'RELEASE_SHA=%s\n' "$release_sha"
  printf 'WEB_IMAGE_TAG=%s\n' "$WEB_IMAGE_TAG"
  printf 'STUDIO_IMAGE_TAG=%s\n' "$STUDIO_IMAGE_TAG"
  printf 'ADMIN_IMAGE_TAG=%s\n' "$ADMIN_IMAGE_TAG"
  printf 'API_IMAGE_TAG=%s\n' "$API_IMAGE_TAG"
  printf 'WORKER_MEDIA_IMAGE_TAG=%s\n' "$WORKER_MEDIA_IMAGE_TAG"
  printf 'WORKER_NOTIFICATIONS_IMAGE_TAG=%s\n' "$WORKER_NOTIFICATIONS_IMAGE_TAG"
} >"$temporary_release_file"

mv "$temporary_release_file" "$release_file"

compose() {
  if [ "${ENABLE_WORKERS:-false}" = "true" ]; then
    docker compose \
      --env-file "$environment_file" \
      --env-file "$release_file" \
      -f "$compose_file" \
      --profile workers \
      "$@"
  else
    docker compose \
      --env-file "$environment_file" \
      --env-file "$release_file" \
      -f "$compose_file" \
      "$@"
  fi
}

rollback() {
  if [ ! -f "$previous_release_file" ]; then
    echo "Deployment failed and no previous release is available" >&2
    return
  fi

  echo "Deployment failed; restoring previous release manifest" >&2
  cp "$previous_release_file" "$release_file"
  compose pull
  compose up -d --remove-orphans --wait
}

compose config --quiet

if [ -n "$normalized_services" ]; then
  if ! compose pull $normalized_services; then
    rollback
    exit 1
  fi
fi

if ! compose up -d --remove-orphans --wait; then
  rollback
  exit 1
fi

"$script_dir/cleanup-images.sh"
