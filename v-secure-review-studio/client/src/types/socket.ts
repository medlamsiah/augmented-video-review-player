import type { ReviewAnnotation } from "./annotation";
import type { ReviewComment } from "./comment";

export type ReviewSessionState = {
  videoId: string;
  annotations: ReviewAnnotation[];
  comments: ReviewComment[];
};

export type ServerToClientEvents = {
  "session-state": (state: ReviewSessionState) => void;
  "annotation-added": (annotation: ReviewAnnotation) => void;
  "comment-added": (comment: ReviewComment) => void;
  "session-cleared": () => void;
  "users-count": (count: number) => void;
};

export type ClientToServerEvents = {
  "join-session": () => void;
  "add-annotation": (annotation: ReviewAnnotation) => void;
  "add-comment": (comment: ReviewComment) => void;
  "clear-session": () => void;
};
