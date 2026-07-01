import { useEffect, useRef, useState } from "react";
import type { AnnotationTool, Point, ReviewAnnotation } from "../../types/annotation";

type AnnotationCanvasProps = {
  annotations: ReviewAnnotation[];
  currentTime: number;
  activeTool: AnnotationTool;
  color: string;
  thickness: number;
  author: string;
  onCreate: (annotation: ReviewAnnotation) => void;
};

function drawAnnotation(ctx: CanvasRenderingContext2D, annotation: ReviewAnnotation, width: number, height: number) {
  const points = annotation.points.map((point) => ({ x: point.x * width, y: point.y * height }));

  if (points.length < 2) {
    return;
  }

  ctx.save();
  ctx.strokeStyle = annotation.color;
  ctx.lineWidth = annotation.thickness;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = annotation.color;
  ctx.shadowBlur = 10;

  const first = points[0];
  const last = points[points.length - 1];

  if (annotation.type === "freehand") {
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.stroke();
  }

  if (annotation.type === "rectangle") {
    ctx.strokeRect(first.x, first.y, last.x - first.x, last.y - first.y);
  }

  if (annotation.type === "circle") {
    const radiusX = Math.abs(last.x - first.x) / 2;
    const radiusY = Math.abs(last.y - first.y) / 2;
    ctx.beginPath();
    ctx.ellipse(first.x + (last.x - first.x) / 2, first.y + (last.y - first.y) / 2, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (annotation.type === "arrow") {
    const angle = Math.atan2(last.y - first.y, last.x - first.x);
    const headLength = 18 + annotation.thickness * 2;
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    ctx.lineTo(last.x, last.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(last.x - headLength * Math.cos(angle - Math.PI / 6), last.y - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(last.x - headLength * Math.cos(angle + Math.PI / 6), last.y - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  }

  ctx.restore();
}

export function AnnotationCanvas({ annotations, currentTime, activeTool, color, thickness, author, onCreate }: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [draft, setDraft] = useState<ReviewAnnotation | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * window.devicePixelRatio));
      canvas.height = Math.max(1, Math.floor(rect.height * window.devicePixelRatio));
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const visible = annotations.filter((annotation) => Math.abs(annotation.timestamp - currentTime) <= 1.5);
    visible.forEach((annotation) => drawAnnotation(ctx, annotation, canvas.width, canvas.height));
    if (draft) {
      drawAnnotation(ctx, draft, canvas.width, canvas.height);
    }
  }, [annotations, currentTime, draft]);

  function getPoint(event: React.PointerEvent<HTMLCanvasElement>): Point {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height
    };
  }

  function startDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = getPoint(event);
    setIsDrawing(true);
    setDraft({
      id: crypto.randomUUID(),
      type: activeTool,
      color,
      thickness,
      timestamp: currentTime,
      author,
      createdAt: new Date().toISOString(),
      points: [point, point]
    });
  }

  function updateDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing || !draft) {
      return;
    }

    const point = getPoint(event);
    setDraft((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        points: previous.type === "freehand" ? [...previous.points, point] : [previous.points[0], point]
      };
    });
  }

  function finishDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.releasePointerCapture(event.pointerId);
    setIsDrawing(false);
    if (draft && draft.points.length >= 2) {
      onCreate(draft);
    }
    setDraft(null);
  }

  return (
    <canvas
      ref={canvasRef}
      className="annotation-canvas"
      onPointerDown={startDrawing}
      onPointerMove={updateDrawing}
      onPointerUp={finishDrawing}
      onPointerCancel={() => {
        setDraft(null);
        setIsDrawing(false);
      }}
      aria-label="Canvas d'annotation video"
    />
  );
}
