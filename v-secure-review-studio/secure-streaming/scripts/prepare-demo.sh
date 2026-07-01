#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_DIR="$(cd "$ROOT_DIR/.." && pwd)"
SOURCE_VIDEO="$PROJECT_DIR/client/public/sample.mp4"
TARGET_VIDEO="$ROOT_DIR/input/sample.mp4"

if [ ! -f "$SOURCE_VIDEO" ]; then
  echo "React sample video not found: $SOURCE_VIDEO" >&2
  echo "Add client/public/sample.mp4 or copy a video to secure-streaming/input/sample.mp4." >&2
  exit 1
fi

cp "$SOURCE_VIDEO" "$TARGET_VIDEO"
bash "$ROOT_DIR/scripts/generate-hls.sh" "$TARGET_VIDEO"

echo "Demo HLS is ready. Start the stack with:"
echo "  cd secure-streaming && docker compose up"
