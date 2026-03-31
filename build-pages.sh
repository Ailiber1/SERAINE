#!/bin/bash
set -e

# 1. OpenNextでビルド
npx @opennextjs/cloudflare build

# 2. wrangler でworkerをバンドル（Pages用の_worker.jsディレクトリを作成）
mkdir -p .open-next/assets/_worker.js

# esbuild で worker.js とその依存関係をバンドル
npx esbuild .open-next/worker.js \
  --bundle \
  --format=esm \
  --platform=neutral \
  --conditions=workerd,worker,import,production \
  --external:node:* \
  --external:cloudflare:* \
  --outfile=.open-next/assets/_worker.js/index.js \
  --minify

echo "Pages build complete. Output: .open-next/assets/"
