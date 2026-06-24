#!/bin/bash
set -a
[ -f .env ] && source .env
set +a
exec node --max-old-space-size=512 api-server/dist/index.mjs
