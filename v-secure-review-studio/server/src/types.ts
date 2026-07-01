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

export type ReviewSessionState = {
  videoId: string;
  annotations: ReviewAnnotation[];
  comments: ReviewComment[];
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
