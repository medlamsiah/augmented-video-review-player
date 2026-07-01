import type { VideoSummary } from "../types/video";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/vsecure-api" : "http://localhost:4500");

export function resolveVideoUrl(url: string) {
  if (/^https?:\/\//i.test(url) || url.startsWith("blob:")) {
    return url;
  }

  if (url.startsWith("/uploads/")) {
    return `${API_URL}${url}`;
  }

  return url;
}

export async function fetchVideos() {
  const response = await fetch(`${API_URL}/videos`);
  if (!response.ok) {
    throw new Error("videos_fetch_failed");
  }

  const payload = (await response.json()) as { videos: VideoSummary[] };
  return payload.videos;
}

export async function uploadVideo(file: File) {
  const formData = new FormData();
  formData.append("video", file);
  formData.append("title", file.name.replace(/\.[^.]+$/, ""));

  const response = await fetch(`${API_URL}/videos`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error("video_upload_failed");
  }

  const payload = (await response.json()) as { video: VideoSummary };
  return payload.video;
}
