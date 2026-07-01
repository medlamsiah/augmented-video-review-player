export type AnnotationTool = "freehand" | "arrow" | "rectangle" | "circle";

export type Point = {
  x: number;
  y: number;
};

export type ReviewAnnotation = {
  id: string;
  type: AnnotationTool;
  color: string;
  thickness: number;
  timestamp: number;
  author: string;
  createdAt: string;
  points: Point[];
};

export type ReviewComment = {
  id: string;
  timestamp: number;
  body: string;
  author: string;
  createdAt: string;
};

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

export type ReviewSessionState = {
  videoId: string;
  video?: VideoSummary | null;
  annotations: ReviewAnnotation[];
  comments: ReviewComment[];
  aiAnalysis?: unknown;
};

export type ReviewPresenceUser = {
  id?: string;
  name: string;
  email?: string;
  role?: string;
};

export type JoinSessionPayload = {
  sessionId?: string;
  user?: ReviewPresenceUser;
};

export type AddAnnotationPayload = {
  sessionId?: string;
  annotation: ReviewAnnotation;
};

export type AddCommentPayload = {
  sessionId?: string;
  comment: ReviewComment;
};

export type ClearSessionPayload = {
  sessionId?: string;
};
