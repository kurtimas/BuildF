#!/bin/bash
export RAYON_NUM_THREADS=1
export UV_THREADPOOL_SIZE=1
export NODE_OPTIONS="--max-old-space-size=512"
cd "$(dirname "$0")"
exec npm run dev
