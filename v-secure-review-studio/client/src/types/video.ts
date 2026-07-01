export type VideoSummary = {
  id: string;
  title: string;
  originalFilename: string;
  storedFilename: string;
  url: string;
  mimeType: string;
  size: number;
  duration?: number | null;
  thumbnail?: string | null;
  aiAvailable: boolean;
  aiStatus: string;
  commentsCount: number;
  annotationsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type VideoAiAnalysis = {
  summary?: string | null;
  transcription?: unknown;
  chapters?: unknown;
  keywords?: unknown;
  createdAt: string;
  updatedAt: string;
};
