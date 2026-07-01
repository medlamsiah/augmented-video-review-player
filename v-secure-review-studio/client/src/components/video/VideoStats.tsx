import { Clock3, MessageSquareText, PenLine } from "lucide-react";
import { formatTime } from "../../lib/utils";

type VideoStatsProps = {
  duration: number;
  annotationsCount: number;
  commentsCount: number;
  labels: {
    duration: string;
    annotations: string;
    comments: string;
  };
};

export function VideoStats({ duration, annotationsCount, commentsCount, labels }: VideoStatsProps) {
  return (
    <div className="stats-grid">
      <div className="stat-tile">
        <Clock3 size={18} />
        <span>{labels.duration}</span>
        <strong>{formatTime(duration)}</strong>
      </div>
      <div className="stat-tile">
        <PenLine size={18} />
        <span>{labels.annotations}</span>
        <strong>{annotationsCount}</strong>
      </div>
      <div className="stat-tile">
        <MessageSquareText size={18} />
        <span>{labels.comments}</span>
        <strong>{commentsCount}</strong>
      </div>
    </div>
  );
}
