# Secure Streaming - Zero-Trust HLS

Pole 2 Sujet A for V-Secure Review Studio: local secure HLS delivery with AES-128 encryption, Nginx segment delivery, a token-gated key server, and a small React integration.

## Architecture

```txt
React player
  -> http://localhost:8080/hls/master.m3u8
  -> Nginx serves encrypted HLS playlists and .ts segments
  -> Playlist asks for /keys/demo.key?token=demo-secure-token
  -> Nginx proxies key request to key-server
  -> key-server validates token before returning AES key
```

## Prerequisites

- Docker and Docker Compose
- ffmpeg available locally for HLS generation
- A source MP4 at `input/sample.mp4`

The helper script can copy the existing React demo file from `../client/public/sample.mp4`.

## Quick Start

```bash
cd secure-streaming
bash scripts/prepare-demo.sh
docker compose up
```

On Windows PowerShell:

```powershell
cd secure-streaming
powershell -ExecutionPolicy Bypass -File scripts/prepare-demo.ps1
docker compose up
```

Open:

- HLS playlist: http://localhost:8080/hls/master.m3u8
- Key health: http://localhost:8080/key-health
- Key without token: http://localhost:8080/keys/demo.key
- Key with token: http://localhost:8080/keys/demo.key?token=demo-secure-token

In React, click `Secure HLS` in the player. If Docker is running and the HLS output exists, the app loads the protected stream.

## Generate HLS Manually

```bash
cd secure-streaming
cp ../client/public/sample.mp4 input/sample.mp4
bash scripts/generate-hls.sh input/sample.mp4
```

On Windows PowerShell:

```powershell
cd secure-streaming
Copy-Item ../client/public/sample.mp4 input/sample.mp4 -Force
powershell -ExecutionPolicy Bypass -File scripts/generate-hls.ps1 -InputFile input/sample.mp4
```

Generated files:

- `output/master.m3u8`
- `output/segment_000.ts`, `segment_001.ts`, ...
- `secrets/demo.key`

## Security Model

This is a local demo of a zero-trust pattern, not a production DRM system.

Assets to protect:

- AES-128 key in `secrets/demo.key`
- HLS media segments in `output/`
- Internal video source in `input/`
- Temporary access token

Threats:

- Anonymous user downloads encryption key
- User reuses a playlist without authorization
- Browser cache stores sensitive media/key material
- Direct access to local secret files
- Token leakage through logs or URLs

Countermeasures:

- Nginx never serves `secrets/` directly
- Key requests are proxied to a separate key server
- Key server requires `token=demo-secure-token` or `Authorization: Bearer demo-secure-token`
- Key responses use `Cache-Control: no-store`
- HLS output and secrets are ignored by git except `.gitkeep`
- CORS headers are explicit for local demo interoperability

Limits:

- The demo token is static by design for the hackathon.
- AES-128 HLS protects key delivery, but it is not equivalent to studio-grade DRM.
- Anyone with a valid token can request the key until the token policy is improved.
- Production should use short-lived signed JWTs, HTTPS, per-user claims, rotation, audit logs, and rate limiting.

## Demo Script

1. Show `output/master.m3u8` with encrypted HLS segments.
2. Show that `/keys/demo.key` returns `401`.
3. Show that `/keys/demo.key?token=demo-secure-token` returns the key.
4. Open React and click `Secure HLS`.
5. Explain that the player only receives the key through token validation.
