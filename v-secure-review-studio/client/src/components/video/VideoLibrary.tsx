import { useRef } from "react";
import { BrainCircuit, Clapperboard, MessageSquareText, PenLine, UploadCloud } from "lucide-react";
import type { VideoSummary } from "../../types/video";
import { Button } from "../ui/Button";

type VideoLibraryLabels = {
  title: string;
  upload: string;
  empty: string;
  aiReady: string;
  comments: string;
  annotations: string;
};

type VideoLibraryProps = {
  videos: VideoSummary[];
  currentVideoId: string;
  labels: VideoLibraryLabels;
  uploading: boolean;
  onUpload: (file: File) => void;
  onSelect: (video: VideoSummary) => void;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function VideoLibrary({ videos, currentVideoId, labels, uploading, onUpload, onSelect }: VideoLibraryProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="video-library">
      <div className="video-library-header">
        <div>
          <span>Library</span>
          <strong>{labels.title}</strong>
        </div>
        <Button variant="secondary" icon={<UploadCloud size={15} />} onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? "..." : labels.upload}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,video/x-matroska,.mp4,.mov,.webm,.mkv"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) {
              onUpload(file);
            }
          }}
        />
      </div>

      <div className="video-library-list">
        {videos.length ? (
          videos.map((video) => (
            <button className={video.id === currentVideoId ? "video-library-item is-active" : "video-library-item"} key={video.id} type="button" onClick={() => onSelect(video)}>
              <Clapperboard size={16} />
              <div>
                <strong>{video.title}</strong>
                <small>{formatDate(video.createdAt)}</small>
                <span>
                  <MessageSquareText size={12} />
                  {video.commentsCount} {labels.comments}
                  <PenLine size={12} />
                  {video.annotationsCount} {labels.annotations}
                </span>
              </div>
              {video.aiAvailable ? (
                <em title={labels.aiReady}>
                  <BrainCircuit size={13} />
                </em>
              ) : null}
            </button>
          ))
        ) : (
          <p>{labels.empty}</p>
        )}
      </div>
    </div>
  );
}
