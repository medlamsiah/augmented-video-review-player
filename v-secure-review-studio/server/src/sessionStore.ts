import type { ReviewAnnotation, ReviewComment, ReviewSessionState } from "./types.js";

export const DEFAULT_SESSION_ID = "default-review-session";

function createInitialState(sessionId: string): ReviewSessionState {
  return {
    videoId: sessionId,
    annotations: [],
    comments: []
  };
}

const sessions = new Map<string, ReviewSessionState>();

function normalizeSessionId(sessionId?: string) {
  return sessionId?.trim() || DEFAULT_SESSION_ID;
}

function getOrCreateSession(sessionId?: string) {
  const normalized = normalizeSessionId(sessionId);
  const existing = sessions.get(normalized);
  if (existing) {
    return existing;
  }

  const created = createInitialState(normalized);
  sessions.set(normalized, created);
  return created;
}

const initialState: ReviewSessionState = {
  videoId: DEFAULT_SESSION_ID,
  annotations: [],
  comments: []
};

export function getSessionState(sessionId = DEFAULT_SESSION_ID) {
  return getOrCreateSession(sessionId);
}

export function addAnnotation(sessionId: string, annotation: ReviewAnnotation) {
  const state = getOrCreateSession(sessionId);
  state.annotations = [annotation, ...state.annotations.filter((item) => item.id !== annotation.id)].slice(0, 250);
  return annotation;
}

export function addComment(sessionId: string, comment: ReviewComment) {
  const state = getOrCreateSession(sessionId);
  state.comments = [comment, ...state.comments.filter((item) => item.id !== comment.id)].slice(0, 250);
  return comment;
}

export function clearSession(sessionId = DEFAULT_SESSION_ID) {
  const normalized = normalizeSessionId(sessionId);
  const state = normalized === DEFAULT_SESSION_ID ? structuredClone(initialState) : createInitialState(normalized);
  sessions.set(normalized, state);
  return state;
}
