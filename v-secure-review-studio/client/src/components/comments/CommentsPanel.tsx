import { useState } from "react";
import type { FormEvent } from "react";
import { SendHorizonal } from "lucide-react";
import type { ReviewComment } from "../../types/comment";
import { formatTime } from "../../lib/utils";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { CommentCard } from "./CommentCard";

type CommentsPanelProps = {
  comments: ReviewComment[];
  currentTime: number;
  author: string;
  onAddComment: (body: string) => void;
  onSeek: (time: number) => void;
};

export function CommentsPanel({ comments, currentTime, onAddComment, onSeek }: CommentsPanelProps) {
  const [body, setBody] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) {
      return;
    }
    onAddComment(trimmed);
    setBody("");
  }

  return (
    <aside className="comments-panel">
      <div className="panel-header">
        <div>
          <span>Review notes</span>
          <strong>Commentaires</strong>
        </div>
        <span className="time-pill">{formatTime(currentTime)}</span>
      </div>

      <form className="comment-form" onSubmit={submit}>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Ajouter un commentaire horodate..."
          rows={4}
        />
        <Button variant="primary" icon={<SendHorizonal size={16} />} type="submit">
          Ajouter
        </Button>
      </form>

      <div className="comments-list">
        {comments.length ? (
          comments.map((comment) => <CommentCard key={comment.id} comment={comment} onSeek={onSeek} />)
        ) : (
          <EmptyState icon={<SendHorizonal size={22} />} title="Aucun commentaire" body="Ajoutez une note, elle sera synchronisee dans les autres onglets." />
        )}
      </div>
    </aside>
  );
}
