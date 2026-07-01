import { Prisma, PrismaClient } from "@prisma/client";
import { existsSync, mkdirSync } from "node:fs";
import { extname } from "node:path";
import type { ReviewAnnotation, ReviewComment, ReviewSessionState } from "./types.js";

export const DEFAULT_VIDEO_ID = "default-review-session";
export const UPLOAD_ROOT = process.env.UPLOAD_ROOT ?? "uploads";
export const VIDEO_UPLOAD_DIR = `${UPLOAD_ROOT}/videos`;
export const THUMBNAIL_UPLOAD_DIR = `${UPLOAD_ROOT}/thumbnails`;

export const prisma = new PrismaClient();

type CreateVideoInput = {
  title: string;
  originalFilename: string;
  storedFilename: string;
  url: string;
  mimeType: string;
  size: number;
  duration?: number | null;
  thumbnail?: string | null;
};

function ensureUploadDirs() {
  for (const directory of [VIDEO_UPLOAD_DIR, THUMBNAIL_UPLOAD_DIR]) {
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true });
    }
  }
}

function normalizeDate(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

function toVideoSummary(video: {
  id: string;
  title: string;
  originalFilename: string;
  storedFilename: string;
  url: string;
  mimeType: string;
  size: number;
  duration: number | null;
  thumbnail: string | null;
  aiStatus: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: { comments: number; annotations: number };
  aiAnalysis?: unknown;
} | null) {
  if (!video) {
    return null;
  }

  return {
    id: video.id,
    title: video.title,
    originalFilename: video.originalFilename,
    storedFilename: video.storedFilename,
    url: video.url,
    mimeType: video.mimeType,
    size: video.size,
    duration: video.duration,
    thumbnail: video.thumbnail,
    aiAvailable: Boolean(video.aiAnalysis),
    aiStatus: video.aiStatus,
    commentsCount: video._count?.comments ?? 0,
    annotationsCount: video._count?.annotations ?? 0,
    createdAt: normalizeDate(video.createdAt),
    updatedAt: normalizeDate(video.updatedAt)
  };
}

function toComment(comment: {
  id: string;
  timestamp: number;
  body: string;
  author: string;
  createdAt: Date;
}): ReviewComment {
  return {
    id: comment.id,
    timestamp: comment.timestamp,
    body: comment.body,
    author: comment.author,
    createdAt: normalizeDate(comment.createdAt)
  };
}

function toAnnotation(annotation: {
  id: string;
  type: string;
  color: string;
  thickness: number;
  timestamp: number;
  author: string;
  points: unknown;
  createdAt: Date;
}): ReviewAnnotation {
  return {
    id: annotation.id,
    type: annotation.type as ReviewAnnotation["type"],
    color: annotation.color,
    thickness: annotation.thickness,
    timestamp: annotation.timestamp,
    author: annotation.author,
    points: Array.isArray(annotation.points) ? (annotation.points as ReviewAnnotation["points"]) : [],
    createdAt: normalizeDate(annotation.createdAt)
  };
}

export async function initializeMediaStore(appBasePath: string) {
  ensureUploadDirs();
  await prisma.video.upsert({
    where: { id: DEFAULT_VIDEO_ID },
    update: {},
    create: {
      id: DEFAULT_VIDEO_ID,
      title: "Sample review video",
      originalFilename: "sample.mp4",
      storedFilename: "sample.mp4",
      url: `${appBasePath.replace(/\/$/, "")}/sample.mp4`,
      mimeType: "video/mp4",
      size: 0,
      aiStatus: "demo"
    }
  });
}

export async function listVideos() {
  const videos = await prisma.video.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      aiAnalysis: true,
      _count: {
        select: {
          comments: true,
          annotations: true
        }
      }
    }
  });

  return videos.map(toVideoSummary);
}

export async function getVideo(videoId = DEFAULT_VIDEO_ID) {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      aiAnalysis: true,
      _count: {
        select: {
          comments: true,
          annotations: true
        }
      }
    }
  });

  return toVideoSummary(video);
}

export async function createVideo(input: CreateVideoInput) {
  const video = await prisma.video.create({
    data: input,
    include: {
      aiAnalysis: true,
      _count: {
        select: {
          comments: true,
          annotations: true
        }
      }
    }
  });

  return toVideoSummary(video);
}

export async function upsertAiAnalysis(
  videoId: string,
  input: {
    summary?: string | null;
    transcription?: unknown;
    chapters?: unknown;
    keywords?: unknown;
  }
) {
  const jsonOrNull = (value: unknown) => (value === undefined || value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue));
  const analysis = await prisma.videoAiAnalysis.upsert({
    where: { videoId },
    update: {
      summary: input.summary ?? null,
      transcription: input.transcription === undefined ? undefined : jsonOrNull(input.transcription),
      chapters: input.chapters === undefined ? undefined : jsonOrNull(input.chapters),
      keywords: input.keywords === undefined ? undefined : jsonOrNull(input.keywords)
    },
    create: {
      videoId,
      summary: input.summary ?? null,
      transcription: jsonOrNull(input.transcription),
      chapters: jsonOrNull(input.chapters),
      keywords: jsonOrNull(input.keywords)
    }
  });

  await prisma.video.update({
    where: { id: videoId },
    data: { aiStatus: "ready" }
  });

  return {
    summary: analysis.summary,
    transcription: analysis.transcription,
    chapters: analysis.chapters,
    keywords: analysis.keywords,
    createdAt: normalizeDate(analysis.createdAt),
    updatedAt: normalizeDate(analysis.updatedAt)
  };
}

export async function getSessionState(videoId = DEFAULT_VIDEO_ID): Promise<ReviewSessionState> {
  const [video, comments, annotations, aiAnalysis] = await Promise.all([
    getVideo(videoId),
    prisma.reviewComment.findMany({
      where: { videoId },
      orderBy: { createdAt: "desc" },
      take: 250
    }),
    prisma.reviewAnnotation.findMany({
      where: { videoId },
      orderBy: { createdAt: "desc" },
      take: 250
    }),
    prisma.videoAiAnalysis.findUnique({ where: { videoId } })
  ]);

  return {
    videoId,
    video,
    comments: comments.map(toComment),
    annotations: annotations.map(toAnnotation),
    aiAnalysis: aiAnalysis
      ? {
          summary: aiAnalysis.summary,
          transcription: aiAnalysis.transcription,
          chapters: aiAnalysis.chapters,
          keywords: aiAnalysis.keywords,
          createdAt: normalizeDate(aiAnalysis.createdAt),
          updatedAt: normalizeDate(aiAnalysis.updatedAt)
        }
      : null
  };
}

export async function addAnnotation(videoId: string, annotation: ReviewAnnotation) {
  const saved = await prisma.reviewAnnotation.upsert({
    where: { id: annotation.id },
    update: {
      videoId,
      type: annotation.type,
      color: annotation.color,
      thickness: annotation.thickness,
      timestamp: annotation.timestamp,
      author: annotation.author,
      points: annotation.points,
      createdAt: new Date(annotation.createdAt)
    },
    create: {
      id: annotation.id,
      videoId,
      type: annotation.type,
      color: annotation.color,
      thickness: annotation.thickness,
      timestamp: annotation.timestamp,
      author: annotation.author,
      points: annotation.points,
      createdAt: new Date(annotation.createdAt)
    }
  });

  return toAnnotation(saved);
}

export async function addComment(videoId: string, comment: ReviewComment) {
  const saved = await prisma.reviewComment.upsert({
    where: { id: comment.id },
    update: {
      videoId,
      timestamp: comment.timestamp,
      body: comment.body,
      author: comment.author,
      createdAt: new Date(comment.createdAt)
    },
    create: {
      id: comment.id,
      videoId,
      timestamp: comment.timestamp,
      body: comment.body,
      author: comment.author,
      createdAt: new Date(comment.createdAt)
    }
  });

  return toComment(saved);
}

export async function clearSession(videoId = DEFAULT_VIDEO_ID) {
  await prisma.$transaction([
    prisma.reviewAnnotation.deleteMany({ where: { videoId } }),
    prisma.reviewComment.deleteMany({ where: { videoId } })
  ]);

  return getSessionState(videoId);
}

export function safeVideoFilename(originalFilename: string) {
  const extension = extname(originalFilename).toLowerCase() || ".mp4";
  return `video-${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`;
}
