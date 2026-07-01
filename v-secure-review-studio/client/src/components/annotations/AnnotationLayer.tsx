import type { ReviewAnnotation } from "../../types/annotation";
import { formatTime } from "../../lib/utils";

type AnnotationLayerProps = {
  annotations: ReviewAnnotation[];
  currentTime: number;
};

const ANNOTATION_VISIBILITY_WINDOW_SECONDS = 6;

export function AnnotationLayer({ annotations, currentTime }: AnnotationLayerProps) {
  const active = annotations.filter((annotation) => Math.abs(annotation.timestamp - currentTime) <= ANNOTATION_VISIBILITY_WINDOW_SECONDS).slice(0, 3);

  if (!active.length) {
    return null;
  }

  return (
    <div className="active-annotation-layer">
      {active.map((annotation) => (
        <span key={annotation.id} style={{ borderColor: annotation.color }}>
          {annotation.type} at {formatTime(annotation.timestamp)}
        </span>
      ))}
    </div>
  );
}
