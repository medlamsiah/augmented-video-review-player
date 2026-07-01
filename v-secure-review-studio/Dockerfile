FROM node:20-alpine AS build

WORKDIR /app
ARG VITE_BASE_PATH=/vsecure/
ARG VITE_API_URL=/vsecure-api
ARG VITE_SOCKET_URL=
ARG VITE_SOCKET_PATH=/vsecure-socket/socket.io
ARG VITE_HLS_URL=/vsecure-hls/master.m3u8
ENV VITE_BASE_PATH=$VITE_BASE_PATH
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
ENV VITE_SOCKET_PATH=$VITE_SOCKET_PATH
ENV VITE_HLS_URL=$VITE_HLS_URL
ENV DATABASE_URL=file:../storage/vsecure.db

COPY package.json package-lock.json ./
COPY client/package.json client/package-lock.json ./client/
COPY server/package.json server/package-lock.json ./server/

RUN npm ci
RUN npm --prefix client ci
RUN npm --prefix server ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4500
ENV CLIENT_DIST_DIR=/app/client/dist
ENV APP_BASE_PATH=/vsecure
ENV SOCKET_PATH=/vsecure-socket/socket.io
ENV DATABASE_URL=file:../storage/vsecure.db

COPY --from=build /app/server/package.json ./server/package.json
COPY --from=build /app/server/node_modules ./server/node_modules
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/prisma ./server/prisma
COPY --from=build /app/client/dist ./client/dist

RUN mkdir -p /app/server/storage /app/server/uploads/videos /app/server/uploads/thumbnails
WORKDIR /app/server

EXPOSE 4500
CMD ["npm", "run", "start"]
