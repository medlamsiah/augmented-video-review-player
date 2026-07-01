import type { ReviewAnnotation } from "../../types/annotation";
import type { ReviewComment } from "../../types/comment";
import { clamp, formatTime } from "../../lib/utils";

type VideoTimelineProps = {
  currentTime: number;
  duration: number;
  annotations: ReviewAnnotation[];
  comments: ReviewComment[];
  onSeek: (time: number) => void;
};

export function VideoTimeline({ currentTime, duration, annotations, comments, onSeek }: VideoTimelineProps) {
  const progress = duration > 0 ? clamp((currentTime / duration) * 100, 0, 100) : 0;

  function handleSeek(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    onSeek(ratio * duration);
  }

  return (
    <div className="timeline-card">
      <div className="timeline-header">
        <strong>Timeline review</strong>
        <span>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
      <div className="timeline-track" onClick={handleSeek} role="slider" aria-valuemin={0} aria-valuemax={duration} aria-valuenow={currentTime}>
        <div className="timeline-progress" style={{ width: `${progress}%` }} />
        {annotations.map((annotation) => (
          <button
            key={annotation.id}
            className="timeline-marker annotation-marker"
            style={{ left: `${duration ? clamp((annotation.timestamp / duration) * 100, 0, 100) : 0}%` }}
            onClick={(event) => {
              event.stopPropagation();
              onSeek(annotation.timestamp);
            }}
            title={`Annotation ${formatTime(annotation.timestamp)}`}
          />
        ))}
        {comments.map((comment) => (
          <button
            key={comment.id}
            className="timeline-marker comment-marker"
            style={{ left: `${duration ? clamp((comment.timestamp / duration) * 100, 0, 100) : 0}%` }}
            onClick={(event) => {
              event.stopPropagation();
              onSeek(comment.timestamp);
            }}
            title={`Commentaire ${formatTime(comment.timestamp)}`}
          />
        ))}
      </div>
    </div>
  );
}
