#!/bin/sh
set -e

mkdir -p /app/dist
find /app/dist -mindepth 1 -delete 2>/dev/null || true
rm -f /app/tsconfig.build.tsbuildinfo /app/tsconfig.tsbuildinfo
chown -R node:node /app/dist
touch /app/tsconfig.build.tsbuildinfo
chown node:node /app/tsconfig.build.tsbuildinfo

exec su-exec node "$@"
