# V-Secure Review Studio

Premium React App - Lecteur de Revue Augmente pour le hackathon ESTIAM x 42C, Pole 1 Sujet A.

V-Secure Review Studio est une plateforme B2B locale de revue video collaborative. Une equipe peut lire une video interne, dessiner des annotations au timestamp exact, ajouter des commentaires horodates, synchroniser les actions en temps reel entre plusieurs onglets, puis exporter un JSON propre pour archivage ou traitement.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React, Canvas API, Socket.IO Client
- Backend: Node.js, Express, Socket.IO, TypeScript, Prisma, SQLite
- Secure Streaming: Docker Compose, Nginx, HLS AES-128, token-gated Node.js key server
- Etat: React state cote client, persistance SQLite cote serveur
- Auth: inscription/login demo avec actions collaboratives signees

## Installation

```bash
cd v-secure-review-studio
npm run install:all
```

## Lancement local

```bash
npm run dev
```

- Client: http://localhost:5173
- Serveur Socket.IO: http://localhost:4500
- Base demo: `server/storage/vsecure.db`
- Uploads videos: `server/uploads/videos/`

Copier `server/.env.example` vers `server/.env` si besoin:

```bash
cp server/.env.example server/.env
```

## Video Library et persistance

Le bouton `Upload` de la sidebar envoie les videos au backend Node.js. Les formats acceptes sont `mp4`, `mov`, `webm` et `mkv`.

Chaque video cree une session collaborative dediee. Les commentaires, annotations et metadonnees IA sont lies au `videoId`, ce qui evite tout melange entre deux videos.

Routes utiles:

- `GET /videos`
- `POST /videos`
- `GET /session?sessionId=<videoId>`
- `POST /session/:videoId/comments`
- `POST /session/:videoId/annotations`
- `GET /videos/:videoId/analysis`
- `POST /videos/:videoId/analysis`

## Secure Streaming HLS

La brique Pole 2 est dans `secure-streaming/`.

```bash
cd secure-streaming
bash scripts/prepare-demo.sh
docker compose up
```

Ensuite, dans le lecteur React, cliquer sur `Secure HLS`.

- Playlist HLS: http://localhost:8080/hls/master.m3u8
- Key server health: http://localhost:8080/key-health
- Cle refusee sans token: http://localhost:8080/keys/demo.key
- Cle autorisee avec token: http://localhost:8080/keys/demo.key?token=demo-secure-token

## Demo recommandee

1. Ouvrir http://localhost:5173.
2. Se connecter ou creer un compte demo.
3. Uploader une video ou utiliser la video demo.
4. Dessiner une annotation sur la video.
5. Ajouter un commentaire horodate dans le panneau de droite.
6. Ouvrir un second onglet sur la meme URL.
7. Recharger une ancienne video depuis `Video Library`.
8. Verifier que les annotations et commentaires reviennent pour cette video uniquement.
9. Exporter le JSON via le bouton dedie.

## Test multi-onglets

Le serveur emet et recoit les evenements suivants:

- Client -> Server: `join-session`, `add-annotation`, `add-comment`, `clear-session`
- Server -> Client: `session-state`, `annotation-added`, `comment-added`, `session-cleared`, `users-count`

Les donnees collaboratives sont diffusees en temps reel et persistees dans SQLite par video.

## Export JSON

Le fichier telecharge s'appelle `v-secure-review-export.json` et contient:

```json
{
  "project": "V-Secure Review Studio",
  "videoId": "VIDEO_ID",
  "exportedAt": "ISO_DATE",
  "video": {},
  "annotations": [],
  "comments": [],
  "aiAnalysis": null
}
```

## Limites connues

- SQLite est volontairement utilise pour garder la demo hackathon simple.
- La demo locale utilise `client/public/sample.mp4`; le bouton `Upload` persiste une nouvelle video, tandis que `Load MP4` reste un chargement local temporaire.
- Le flux HLS securise necessite `secure-streaming/scripts/prepare-demo.sh` puis `docker compose up`.
- Le canvas affiche les annotations proches du timestamp courant pour garder la revue lisible.

## Ameliorations futures

- Migration PostgreSQL ou Redis pour une production multi-instance.
- Presence utilisateur detaillee avec curseurs et roles.
- Versioning des exports.
- Permissions par equipe et partage securise.
- Jetons courts JWT, rotation de cles HLS et filigrane dynamique.
