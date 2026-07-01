import { LocateFixed } from "lucide-react";
import type { ReviewAnnotation } from "../../types/annotation";
import { formatTime } from "../../lib/utils";
import { EmptyState } from "../ui/EmptyState";

type AnnotationListProps = {
  annotations: ReviewAnnotation[];
  onSeek: (time: number) => void;
};

export function AnnotationList({ annotations, onSeek }: AnnotationListProps) {
  if (!annotations.length) {
    return <EmptyState icon={<LocateFixed size={22} />} title="Aucune annotation" body="Dessinez sur la video pour creer un retour visuel horodate." />;
  }

  return (
    <div className="annotation-list">
      {annotations.slice(0, 6).map((annotation) => (
        <button key={annotation.id} className="annotation-row" onClick={() => onSeek(annotation.timestamp)}>
          <span className="annotation-dot" style={{ background: annotation.color }} />
          <span>{annotation.type}</span>
          <strong>{formatTime(annotation.timestamp)}</strong>
        </button>
      ))}
    </div>
  );
}
