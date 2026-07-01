# Deploy V-Secure Review Studio under `/vsecure/`

This deployment keeps the existing root project untouched:

```txt
/                         -> existing production project
/vsecure/                 -> V-Secure React frontend
/vsecure-api/             -> V-Secure API
/vsecure-socket/socket.io -> Socket.IO collaboration server
/vsecure-hls/             -> encrypted HLS playlist and segments
/vsecure-key/             -> temporary-token HLS key server
```

Generate the encrypted HLS files with the production key route:

```bash
cp client/public/sample.mp4 secure-streaming/input/sample.mp4
HLS_KEY_URI="/vsecure-key/demo.key?token=demo-secure-token" bash secure-streaming/scripts/generate-hls.sh secure-streaming/input/sample.mp4
```

Production image:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

The containers listen locally only:

```txt
127.0.0.1:4500 -> React frontend, API and Socket.IO
127.0.0.1:7001 -> HLS key server
```

Auth API:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`

The user database is persisted in the Docker volume `review-studio-users`.

Add these `location` blocks inside the existing Nginx `server { ... }` block that already serves `/`:

```nginx
location /vsecure/ {
  proxy_pass http://127.0.0.1:4500/vsecure/;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}

location /vsecure-api/ {
  rewrite ^/vsecure-api/(.*)$ /$1 break;
  proxy_pass http://127.0.0.1:4500;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}

location /vsecure-socket/socket.io/ {
  proxy_pass http://127.0.0.1:4500/vsecure-socket/socket.io/;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
}

location /vsecure-hls/ {
  alias /opt/augmented-video-review-player/v-secure-review-studio/secure-streaming/output/;
  add_header Cache-Control "no-store";
  add_header Access-Control-Allow-Origin "*";
  types {
    application/vnd.apple.mpegurl m3u8;
    video/mp2t ts;
  }
}

location /vsecure-key/ {
  rewrite ^/vsecure-key/(.*)$ /keys/$1 break;
  proxy_pass http://127.0.0.1:7001;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
}
```
