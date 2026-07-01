import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { Server } from "socket.io";
import { getUserFromToken, loginUser, logout, registerUser } from "./authStore.js";
import { DEFAULT_SESSION_ID, addAnnotation, addComment, clearSession, getSessionState } from "./sessionStore.js";
import type { AddAnnotationPayload, AddCommentPayload, ClearSessionPayload, JoinSessionPayload } from "./types.js";

const PORT = Number(process.env.PORT ?? 4500);
const APP_BASE_PATH = process.env.APP_BASE_PATH ?? "/";
const SOCKET_PATH = process.env.SOCKET_PATH ?? "/socket.io";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "v-secure-review-studio-server", session: DEFAULT_SESSION_ID });
});

app.get("/session", (_req, res) => {
  res.json(getSessionState(DEFAULT_SESSION_ID));
});

function bearerToken(req: express.Request) {
  const header = req.header("authorization");
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" ? token : null;
}

app.post("/auth/register", (req, res) => {
  try {
    const result = registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "registration_failed";
    res.status(message === "email_already_registered" ? 409 : 400).json({ error: message });
  }
});

app.post("/auth/login", (req, res) => {
  try {
    res.json(loginUser(req.body));
  } catch {
    res.status(401).json({ error: "invalid_credentials" });
  }
});

app.get("/auth/me", (req, res) => {
  const user = getUserFromToken(bearerToken(req));
  if (!user) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  res.json({ user });
});

app.post("/auth/logout", (req, res) => {
  logout(bearerToken(req));
  res.status(204).send();
});

const clientDist = resolve(process.env.CLIENT_DIST_DIR ?? "../client/dist");
if (existsSync(clientDist)) {
  app.use(APP_BASE_PATH, express.static(clientDist));
  app.get(`${APP_BASE_PATH.replace(/\/$/, "")}/*`, (_req, res) => {
    res.sendFile(resolve(clientDist, "index.html"));
  });
}

const httpServer = createServer(app);
const io = new Server(httpServer, {
  path: SOCKET_PATH,
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

function resolveSessionId(sessionId?: string) {
  return sessionId?.trim() || DEFAULT_SESSION_ID;
}

function emitUsersCount(sessionId: string) {
  const count = io.sockets.adapter.rooms.get(sessionId)?.size ?? 0;
  io.to(sessionId).emit("users-count", count);
}

io.on("connection", (socket) => {
  socket.on("join-session", (payload: JoinSessionPayload = {}) => {
    const previousSessionId = socket.data.sessionId as string | undefined;
    const sessionId = resolveSessionId(payload.sessionId);

    if (previousSessionId && previousSessionId !== sessionId) {
      socket.leave(previousSessionId);
      emitUsersCount(previousSessionId);
    }

    socket.data.sessionId = sessionId;
    socket.data.user = payload.user;
    socket.join(sessionId);
    socket.emit("session-state", getSessionState(sessionId));
    emitUsersCount(sessionId);
  });

  socket.on("add-annotation", (payload: AddAnnotationPayload) => {
    const sessionId = resolveSessionId(payload?.sessionId ?? socket.data.sessionId);
    if (!payload?.annotation) {
      return;
    }

    const saved = addAnnotation(sessionId, payload.annotation);
    io.to(sessionId).emit("annotation-added", saved);
  });

  socket.on("add-comment", (payload: AddCommentPayload) => {
    const sessionId = resolveSessionId(payload?.sessionId ?? socket.data.sessionId);
    if (!payload?.comment) {
      return;
    }

    const saved = addComment(sessionId, payload.comment);
    io.to(sessionId).emit("comment-added", saved);
  });

  socket.on("clear-session", (payload: ClearSessionPayload = {}) => {
    const sessionId = resolveSessionId(payload.sessionId ?? socket.data.sessionId);
    clearSession(sessionId);
    io.to(sessionId).emit("session-cleared");
  });

  socket.on("disconnect", () => {
    const sessionId = socket.data.sessionId as string | undefined;
    if (sessionId) {
      emitUsersCount(sessionId);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`V-Secure Review Studio server listening on http://localhost:${PORT}`);
});
