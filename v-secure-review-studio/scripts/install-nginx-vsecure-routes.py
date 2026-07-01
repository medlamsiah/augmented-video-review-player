from __future__ import annotations

from datetime import datetime
from pathlib import Path


NGINX_SITE = Path("/etc/nginx/sites-available/vivounionvtc")
MARKER = "# BEGIN V-Secure Review Studio routes"

ROUTES = r'''
    # BEGIN V-Secure Review Studio routes
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
    # END V-Secure Review Studio routes

'''


def main() -> None:
    text = NGINX_SITE.read_text()
    if MARKER in text:
        print("vsecure routes already present")
        return

    needle = "    location / {"
    if needle not in text:
        raise SystemExit("Could not find root location block")

    backup = NGINX_SITE.with_suffix(
        NGINX_SITE.suffix + ".bak-" + datetime.now().strftime("%Y%m%d%H%M%S")
    )
    backup.write_text(text)
    NGINX_SITE.write_text(text.replace(needle, ROUTES + needle, 1))
    print(f"updated {NGINX_SITE}; backup {backup}")


if __name__ == "__main__":
    main()
