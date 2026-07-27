#!/usr/bin/env sh

set -eu

if [ "$#" -ne 1 ]; then
  echo "Usage: rollback-edge.sh <edge-root>" >&2
  exit 2
fi

edge_root=$1
compose_dir="$edge_root/compose"
nginx_dir="$edge_root/nginx"
compose_file="$compose_dir/compose.edge.yml"
nginx_template="$nginx_dir/default.conf.template"
previous_compose_file="$compose_dir/compose.edge.previous.yml"
previous_nginx_template="$nginx_dir/default.conf.previous.template"
temporary_compose_file="$compose_dir/compose.edge.swap.yml"
temporary_nginx_template="$nginx_dir/default.conf.swap.template"

if [ ! -f "$edge_root/.env" ] ||
  [ ! -f "$compose_file" ] ||
  [ ! -f "$nginx_template" ] ||
  [ ! -f "$previous_compose_file" ] ||
  [ ! -f "$previous_nginx_template" ]; then
  echo "Current or previous edge configuration is missing" >&2
  exit 1
fi

cp "$compose_file" "$temporary_compose_file"
cp "$nginx_template" "$temporary_nginx_template"
cp "$previous_compose_file" "$compose_file"
cp "$previous_nginx_template" "$nginx_template"

restore_current() {
  cp "$temporary_compose_file" "$compose_file"
  cp "$temporary_nginx_template" "$nginx_template"

  docker compose \
    --env-file "$edge_root/.env" \
    -f "$compose_file" \
    up -d --remove-orphans --wait || true

  rm -f "$temporary_compose_file" "$temporary_nginx_template"
}

if ! docker compose \
  --env-file "$edge_root/.env" \
  -f "$compose_file" \
  config --quiet ||
  ! docker compose \
    --env-file "$edge_root/.env" \
    -f "$compose_file" \
    up -d --remove-orphans --wait; then
  echo "Edge rollback failed; restoring the current configuration" >&2
  restore_current
  exit 1
fi

mv "$temporary_compose_file" "$previous_compose_file"
mv "$temporary_nginx_template" "$previous_nginx_template"
