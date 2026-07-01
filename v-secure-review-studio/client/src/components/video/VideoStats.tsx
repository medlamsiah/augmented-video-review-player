import { Clock3, MessageSquareText, PenLine } from "lucide-react";
import { formatTime } from "../../lib/utils";

type VideoStatsProps = {
  duration: number;
  annotationsCount: number;
  commentsCount: number;
};

export function VideoStats({ duration, annotationsCount, commentsCount }: VideoStatsProps) {
  return (
    <div className="stats-grid">
      <div className="stat-tile">
        <Clock3 size={18} />
        <span>Duree</span>
        <strong>{formatTime(duration)}</strong>
      </div>
      <div className="stat-tile">
        <PenLine size={18} />
        <span>Annotations</span>
        <strong>{annotationsCount}</strong>
      </div>
      <div className="stat-tile">
        <MessageSquareText size={18} />
        <span>Commentaires</span>
        <strong>{commentsCount}</strong>
      </div>
    </div>
  );
}
