#!/usr/bin/env sh

set -eu

if [ "$#" -ne 1 ]; then
  echo "Usage: deploy-edge.sh <edge-root>" >&2
  exit 2
fi

edge_root=$1
script_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
deployment_root=$(dirname "$script_dir")
compose_dir="$edge_root/compose"
nginx_dir="$edge_root/nginx"
compose_file="$compose_dir/compose.edge.yml"
nginx_template="$nginx_dir/default.conf.template"
previous_compose_file="$compose_dir/compose.edge.previous.yml"
previous_nginx_template="$nginx_dir/default.conf.previous.template"

if [ ! -f "$edge_root/.env" ]; then
  echo "Missing shared edge environment file: $edge_root/.env" >&2
  exit 1
fi

if [ ! -f "$edge_root/auth/stage.htpasswd" ] ||
  [ ! -f "$edge_root/auth/operations.htpasswd" ]; then
  echo "Missing edge Basic Auth files" >&2
  exit 1
fi

install -d -m 700 "$compose_dir" "$nginx_dir"

if [ -f "$compose_file" ] && [ -f "$nginx_template" ]; then
  cp "$compose_file" "$previous_compose_file"
  cp "$nginx_template" "$previous_nginx_template"
fi

install -m 600 \
  "$deployment_root/compose/compose.edge.yml" \
  "$compose_file"
install -m 600 \
  "$deployment_root/nginx/default.conf.template" \
  "$nginx_template"

if ! docker compose \
  --env-file "$edge_root/.env" \
  -f "$compose_file" \
  config --quiet ||
  ! docker compose \
    --env-file "$edge_root/.env" \
    -f "$compose_file" \
    up -d --remove-orphans --wait; then
  if [ -f "$previous_compose_file" ] &&
    [ -f "$previous_nginx_template" ]; then
    "$script_dir/rollback-edge.sh" "$edge_root" || true
  fi

  exit 1
fi
