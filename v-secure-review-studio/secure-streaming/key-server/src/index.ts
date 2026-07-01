import cors from "cors";
import express from "express";
import { existsSync, readFileSync } from "node:fs";

const PORT = Number(process.env.PORT ?? 7001);
const KEY_TOKEN = process.env.KEY_TOKEN ?? "demo-secure-token";
const KEY_FILE = process.env.KEY_FILE ?? "/app/secrets/demo.key";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"]
  })
);

function extractBearerToken(header?: string) {
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" ? token : null;
}

function hasValidToken(req: express.Request) {
  const queryToken = typeof req.query.token === "string" ? req.query.token : null;
  const bearerToken = extractBearerToken(req.header("authorization"));
  return queryToken === KEY_TOKEN || bearerToken === KEY_TOKEN;
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "v-secure-hls-key-server",
    keyAvailable: existsSync(KEY_FILE)
  });
});

app.get("/keys/:keyName", (req, res) => {
  if (!hasValidToken(req)) {
    res.status(401).json({
      error: "missing_or_invalid_token",
      message: "A valid temporary token is required to retrieve the HLS key."
    });
    return;
  }

  if (req.params.keyName !== "demo.key") {
    res.status(404).json({ error: "key_not_found" });
    return;
  }

  if (!existsSync(KEY_FILE)) {
    res.status(404).json({
      error: "key_file_missing",
      message: "Run scripts/generate-hls.sh before requesting the key."
    });
    return;
  }

  const key = readFileSync(KEY_FILE);
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.send(key);
});

app.listen(PORT, () => {
  console.log(`V-Secure HLS key server listening on http://localhost:${PORT}`);
});
