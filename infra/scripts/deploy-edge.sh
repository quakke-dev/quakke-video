#!/usr/bin/env sh

set -eu

if [ "$#" -ne 1 ]; then
  echo "Usage: deploy-edge.sh <edge-root>" >&2
  exit 2
fi

edge_root=$1
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
deployment_root=$(dirname "$script_dir")

if [ ! -f "$edge_root/.env" ]; then
  echo "Missing shared edge environment file: $edge_root/.env" >&2
  exit 1
fi

if [ ! -f "$edge_root/auth/stage.htpasswd" ] ||
  [ ! -f "$edge_root/auth/operations.htpasswd" ]; then
  echo "Missing edge Basic Auth files" >&2
  exit 1
fi

install -d -m 700 "$edge_root/compose" "$edge_root/nginx"
install -m 600 \
  "$deployment_root/compose/compose.edge.yml" \
  "$edge_root/compose/compose.edge.yml"
install -m 600 \
  "$deployment_root/nginx/default.conf.template" \
  "$edge_root/nginx/default.conf.template"

docker compose \
  --env-file "$edge_root/.env" \
  -f "$edge_root/compose/compose.edge.yml" \
  config --quiet

docker compose \
  --env-file "$edge_root/.env" \
  -f "$edge_root/compose/compose.edge.yml" \
  up -d --remove-orphans --wait
