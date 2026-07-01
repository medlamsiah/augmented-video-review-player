#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INPUT_FILE="${1:-"$ROOT_DIR/input/sample.mp4"}"
OUTPUT_DIR="$ROOT_DIR/output"
SECRETS_DIR="$ROOT_DIR/secrets"
KEY_FILE="$SECRETS_DIR/demo.key"
KEY_INFO_FILE="$SECRETS_DIR/demo.keyinfo"
TOKEN="${HLS_DEMO_TOKEN:-demo-secure-token}"
KEY_URI="${HLS_KEY_URI:-http://localhost:8080/keys/demo.key?token=$TOKEN}"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is required. Install ffmpeg and rerun this script." >&2
  exit 1
fi

if [ ! -f "$INPUT_FILE" ]; then
  echo "Input video not found: $INPUT_FILE" >&2
  echo "Put a video at secure-streaming/input/sample.mp4 or pass a path." >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR" "$SECRETS_DIR"
rm -f "$OUTPUT_DIR"/*.m3u8 "$OUTPUT_DIR"/*.ts "$KEY_INFO_FILE"

openssl rand 16 > "$KEY_FILE"
cat > "$KEY_INFO_FILE" <<EOF_KEYINFO
$KEY_URI
$KEY_FILE
$(openssl rand -hex 16)
EOF_KEYINFO

ffmpeg -y \
  -i "$INPUT_FILE" \
  -c:v libx264 \
  -preset veryfast \
  -profile:v main \
  -c:a aac \
  -b:a 128k \
  -hls_time 6 \
  -hls_playlist_type vod \
  -hls_key_info_file "$KEY_INFO_FILE" \
  -hls_segment_filename "$OUTPUT_DIR/segment_%03d.ts" \
  "$OUTPUT_DIR/master.m3u8"

echo "Encrypted HLS generated:"
echo "  Playlist: $OUTPUT_DIR/master.m3u8"
echo "  Key:      $KEY_FILE"
echo "  URI:      $KEY_URI"
