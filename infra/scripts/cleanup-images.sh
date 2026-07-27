#!/usr/bin/env sh

set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
deploy_root=$(dirname "$script_dir")
environment_file="$deploy_root/.env"
previous_release_file="$deploy_root/.release.previous.env"

if [ ! -f "$environment_file" ]; then
  echo "Missing deployment environment file: $environment_file" >&2
  exit 1
fi

set -a
. "$environment_file"
set +a

protect_previous_images() {
  [ -f "$previous_release_file" ] || return 0

  . "$previous_release_file"

  for image_spec in \
    "web:$WEB_IMAGE_TAG" \
    "studio:$STUDIO_IMAGE_TAG" \
    "admin:$ADMIN_IMAGE_TAG" \
    "api:$API_IMAGE_TAG" \
    "worker-media:$WORKER_MEDIA_IMAGE_TAG" \
    "worker-notifications:$WORKER_NOTIFICATIONS_IMAGE_TAG"; do
    image_name=${image_spec%%:*}
    image_tag=${image_spec#*:}
    repository="$IMAGE_REGISTRY/$IMAGE_NAMESPACE/quakke-video-$image_name"

    if docker image inspect "$repository:$image_tag" >/dev/null 2>&1; then
      docker image tag "$repository:$image_tag" "$repository:rollback-$APP_ENV"
    fi
  done
}

protect_previous_images

# Current containers and rollback aliases are retained. Old unused images and
# build cache are removed only after a seven-day safety window.
docker image prune -a -f --filter "until=168h"
docker builder prune -f --filter "until=168h"
