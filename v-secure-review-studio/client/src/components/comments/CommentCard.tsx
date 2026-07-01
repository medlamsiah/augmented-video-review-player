import { MessageCircle, Play } from "lucide-react";
import type { ReviewComment } from "../../types/comment";
import { formatTime } from "../../lib/utils";
import { Button } from "../ui/Button";

type CommentCardProps = {
  comment: ReviewComment;
  onSeek: (time: number) => void;
};

export function CommentCard({ comment, onSeek }: CommentCardProps) {
  return (
    <article className="comment-card">
      <div className="comment-meta">
        <span className="comment-avatar">{comment.author.slice(0, 1)}</span>
        <div>
          <strong>{comment.author}</strong>
          <span>{formatTime(comment.timestamp)}</span>
        </div>
        <Button variant="ghost" icon={<Play size={14} />} onClick={() => onSeek(comment.timestamp)} aria-label="Aller au timestamp" />
      </div>
      <p>
        <MessageCircle size={14} />
        {comment.body}
      </p>
    </article>
  );
}
