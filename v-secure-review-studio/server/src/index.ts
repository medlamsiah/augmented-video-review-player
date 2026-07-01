import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import multer from "multer";
import { Server } from "socket.io";
import { getUserFromToken, loginUser, logout, registerUser } from "./authStore.js";
import { DEFAULT_VIDEO_ID, UPLOAD_ROOT, VIDEO_UPLOAD_DIR, addAnnotation, addComment, clearSession, createVideo, getSessionState, initializeMediaStore, listVideos, safeVideoFilename, upsertAiAnalysis } from "./mediaStore.js";
import type { AddAnnotationPayload, AddCommentPayload, ClearSessionPayload, JoinSessionPayload } from "./types.js";

const PORT = Number(process.env.PORT ?? 4500);
const APP_BASE_PATH = process.env.APP_BASE_PATH ?? "/";
const SOCKET_PATH = process.env.SOCKET_PATH ?? "/socket.io";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

mkdirSync(VIDEO_UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, VIDEO_UPLOAD_DIR),
    filename: (_req, file, callback) => callback(null, safeVideoFilename(file.originalname))
  }),
  limits: {
    fileSize: 1024 * 1024 * 700
  },
  fileFilter: (_req, file, callback) => {
    const allowedMimeTypes = new Set(["video/mp4", "video/quicktime", "video/webm", "video/x-matroska"]);
    const allowedExtensions = /\.(mp4|mov|webm|mkv)$/i;
    if (allowedMimeTypes.has(file.mimetype) || allowedExtensions.test(file.originalname)) {
      callback(null, true);
      return;
    }

    callback(new Error("unsupported_video_type"));
  }
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "v-secure-review-studio-server", session: DEFAULT_VIDEO_ID });
});

app.use("/uploads", express.static(resolve(UPLOAD_ROOT)));

app.get("/videos", async (_req, res) => {
  res.json({ videos: await listVideos() });
});

app.post("/videos", upload.single("video"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "missing_video_file" });
    return;
  }

  const title = typeof req.body.title === "string" && req.body.title.trim() ? req.body.title.trim() : req.file.originalname.replace(/\.[^.]+$/, "");
  const video = await createVideo({
    title,
    originalFilename: req.file.originalname,
    storedFilename: req.file.filename,
    url: `/uploads/videos/${req.file.filename}`,
    mimeType: req.file.mimetype || "application/octet-stream",
    size: req.file.size
  });

  res.status(201).json({ video });
});

app.get("/videos/:videoId/analysis", async (req, res) => {
  const state = await getSessionState(resolveSessionId(req.params.videoId));
  res.json({ analysis: state.aiAnalysis ?? null });
});

app.post("/videos/:videoId/analysis", async (req, res) => {
  const videoId = resolveSessionId(req.params.videoId);
  const analysis = await upsertAiAnalysis(videoId, req.body ?? {});
  res.status(201).json({ analysis });
});

app.get("/session", async (req, res) => {
  const sessionId = typeof req.query.sessionId === "string" ? req.query.sessionId : DEFAULT_VIDEO_ID;
  res.json(await getSessionState(sessionId));
});

app.post("/session/:sessionId/annotations", async (req, res) => {
  const sessionId = resolveSessionId(req.params.sessionId);
  const annotation = req.body as AddAnnotationPayload["annotation"] | undefined;
  if (!annotation?.points) {
    res.status(400).json({ error: "invalid_annotation" });
    return;
  }

  const saved = await addAnnotation(sessionId, annotation);
  io.to(sessionId).emit("annotation-added", saved);
  res.status(201).json(saved);
});

app.post("/session/:sessionId/comments", async (req, res) => {
  const sessionId = resolveSessionId(req.params.sessionId);
  const comment = req.body as AddCommentPayload["comment"] | undefined;
  if (!comment?.body) {
    res.status(400).json({ error: "invalid_comment" });
    return;
  }

  const saved = await addComment(sessionId, comment);
  io.to(sessionId).emit("comment-added", saved);
  res.status(201).json(saved);
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
  return sessionId?.trim() || DEFAULT_VIDEO_ID;
}

function emitUsersCount(sessionId: string) {
  const count = io.sockets.adapter.rooms.get(sessionId)?.size ?? 0;
  io.to(sessionId).emit("users-count", count);
}

function getAnnotationPayload(payload: AddAnnotationPayload | unknown, fallbackSessionId?: string) {
  const maybePayload = payload as Partial<AddAnnotationPayload>;
  const maybeLegacyAnnotation = payload as AddAnnotationPayload["annotation"];
  const annotation = maybePayload?.annotation ?? (maybeLegacyAnnotation?.points ? maybeLegacyAnnotation : undefined);

  return {
    sessionId: resolveSessionId(maybePayload?.sessionId ?? fallbackSessionId),
    annotation
  };
}

function getCommentPayload(payload: AddCommentPayload | unknown, fallbackSessionId?: string) {
  const maybePayload = payload as Partial<AddCommentPayload>;
  const maybeLegacyComment = payload as AddCommentPayload["comment"];
  const comment = maybePayload?.comment ?? (maybeLegacyComment?.body ? maybeLegacyComment : undefined);

  return {
    sessionId: resolveSessionId(maybePayload?.sessionId ?? fallbackSessionId),
    comment
  };
}

io.on("connection", (socket) => {
  socket.on("join-session", async (payload: JoinSessionPayload = {}) => {
    const previousSessionId = socket.data.sessionId as string | undefined;
    const sessionId = resolveSessionId(payload.sessionId);

    if (previousSessionId && previousSessionId !== sessionId) {
      socket.leave(previousSessionId);
      emitUsersCount(previousSessionId);
    }

    socket.data.sessionId = sessionId;
    socket.data.user = payload.user;
    socket.join(sessionId);
    socket.emit("session-state", await getSessionState(sessionId));
    emitUsersCount(sessionId);
  });

  socket.on("add-annotation", async (payload: AddAnnotationPayload | unknown) => {
    const { sessionId, annotation } = getAnnotationPayload(payload, socket.data.sessionId);
    if (!annotation) {
      return;
    }

    const saved = await addAnnotation(sessionId, annotation);
    io.to(sessionId).emit("annotation-added", saved);
  });

  socket.on("add-comment", async (payload: AddCommentPayload | unknown) => {
    const { sessionId, comment } = getCommentPayload(payload, socket.data.sessionId);
    if (!comment) {
      return;
    }

    const saved = await addComment(sessionId, comment);
    io.to(sessionId).emit("comment-added", saved);
  });

  socket.on("clear-session", async (payload: ClearSessionPayload = {}) => {
    const sessionId = resolveSessionId(payload.sessionId ?? socket.data.sessionId);
    await clearSession(sessionId);
    io.to(sessionId).emit("session-cleared");
  });

  socket.on("disconnect", () => {
    const sessionId = socket.data.sessionId as string | undefined;
    if (sessionId) {
      emitUsersCount(sessionId);
    }
  });
});

await initializeMediaStore(APP_BASE_PATH);

httpServer.listen(PORT, () => {
  console.log(`V-Secure Review Studio server listening on http://localhost:${PORT}`);
});
