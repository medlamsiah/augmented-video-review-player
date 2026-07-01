import type { ReviewAnnotation } from "./annotation";
import type { ReviewComment } from "./comment";
import type { VideoAiAnalysis, VideoSummary } from "./video";

export type ReviewSessionState = {
  videoId: string;
  video?: VideoSummary | null;
  annotations: ReviewAnnotation[];
  comments: ReviewComment[];
  aiAnalysis?: VideoAiAnalysis | null;
};

export type ReviewPresenceUser = {
  id?: string;
  name: string;
  email?: string;
  role?: string;
};

export type JoinSessionPayload = {
  sessionId: string;
  user: ReviewPresenceUser;
};

export type AddAnnotationPayload = {
  sessionId: string;
  annotation: ReviewAnnotation;
};

export type AddCommentPayload = {
  sessionId: string;
  comment: ReviewComment;
};

export type ClearSessionPayload = {
  sessionId: string;
};

export type ServerToClientEvents = {
  "session-state": (state: ReviewSessionState) => void;
  "annotation-added": (annotation: ReviewAnnotation) => void;
  "comment-added": (comment: ReviewComment) => void;
  "session-cleared": () => void;
  "users-count": (count: number) => void;
};

export type ClientToServerEvents = {
  "join-session": (payload: JoinSessionPayload) => void;
  "add-annotation": (payload: AddAnnotationPayload) => void;
  "add-comment": (payload: AddCommentPayload) => void;
  "clear-session": (payload: ClearSessionPayload) => void;
};
