# V-Secure Review Studio

Premium React App - Lecteur de Revue Augmente pour le hackathon ESTIAM x 42C, Pole 1 Sujet A.

V-Secure Review Studio est une plateforme B2B locale de revue video collaborative. Une equipe peut lire une video interne, dessiner des annotations au timestamp exact, ajouter des commentaires horodates, synchroniser les actions en temps reel entre plusieurs onglets, puis exporter un JSON propre pour archivage ou traitement.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React, Canvas API, Socket.IO Client
- Backend: Node.js, Express, Socket.IO, TypeScript
- Secure Streaming: Docker Compose, Nginx, HLS AES-128, token-gated Node.js key server
- Etat: React state simple cote client, stockage memoire cote serveur
- Auth: utilisateur connecte simule

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
2. Charger une video MP4 locale ou utiliser la video demo.
3. Dessiner une annotation sur la video.
4. Ajouter un commentaire horodate dans le panneau de droite.
5. Ouvrir un second onglet sur la meme URL.
6. Verifier que les annotations et commentaires arrivent en temps reel.
7. Cliquer sur un commentaire ou un marqueur de timeline pour naviguer.
8. Exporter le JSON via le bouton dedie.

## Test multi-onglets

Le serveur emet et recoit les evenements suivants:

- Client -> Server: `join-session`, `add-annotation`, `add-comment`, `clear-session`
- Server -> Client: `session-state`, `annotation-added`, `comment-added`, `session-cleared`, `users-count`

Toutes les donnees sont stockees en memoire. Redemarrer le serveur remet la session a zero.

## Export JSON

Le fichier telecharge s'appelle `v-secure-review-export.json` et contient:

```json
{
  "project": "V-Secure Review Studio",
  "videoId": "secure-demo-video",
  "exportedAt": "ISO_DATE",
  "annotations": [],
  "comments": []
}
```

## Limites connues

- Pas d'authentification reelle, l'utilisateur est simule cote client.
- Pas de base de donnees, stockage memoire uniquement.
- La demo locale utilise `client/public/sample.mp4`; le bouton `Load MP4` permet de charger un autre MP4 local.
- Le flux HLS securise necessite `secure-streaming/scripts/prepare-demo.sh` puis `docker compose up`.
- Le canvas affiche les annotations proches du timestamp courant pour garder la revue lisible.

## Ameliorations futures

- Persistance PostgreSQL ou Redis.
- Presence utilisateur detaillee avec curseurs et roles.
- Versioning des exports.
- Permissions par equipe et partage securise.
- Jetons courts JWT, rotation de cles HLS et filigrane dynamique.
