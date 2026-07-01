import type { ReviewAnnotation, ReviewComment, ReviewSessionState } from "./types.js";

const initialState: ReviewSessionState = {
  videoId: "secure-demo-video",
  annotations: [],
  comments: []
};

let state: ReviewSessionState = structuredClone(initialState);

export function getSessionState() {
  return state;
}

export function addAnnotation(annotation: ReviewAnnotation) {
  state.annotations = [annotation, ...state.annotations].slice(0, 250);
  return annotation;
}

export function addComment(comment: ReviewComment) {
  state.comments = [comment, ...state.comments].slice(0, 250);
  return comment;
}

export function clearSession() {
  state = structuredClone(initialState);
  return state;
}
