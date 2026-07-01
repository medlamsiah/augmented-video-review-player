export type AnnotationTool = "freehand" | "arrow" | "rectangle" | "circle";

export type Point = {
  x: number;
  y: number;
};

export type ReviewAnnotation = {
  id: string;
  type: AnnotationTool;
  color: string;
  thickness: number;
  timestamp: number;
  author: string;
  createdAt: string;
  points: Point[];
};
