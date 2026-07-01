# Deploy V-Secure Review Studio

Production image:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

The app is served on:

```txt
http://SERVER_IP:4500
```

Auth API:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`

The user database is persisted in the Docker volume `review-studio-users`.
