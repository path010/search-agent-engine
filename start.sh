#!/usr/bin/env bash
# Anti-Cocoon Engine · macOS / Linux 一键启动
set -e
if ! command -v node >/dev/null 2>&1; then
  echo "[x] 未检测到 Node.js，请先安装 Node 18+：https://nodejs.org/"
  exit 1
fi
echo "  Anti-Cocoon Engine 启动中……"
exec node server.mjs
