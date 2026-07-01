import { Circle, Eraser, MoveUpRight, Paintbrush, Square } from "lucide-react";
import type { ReactNode } from "react";
import type { AnnotationTool } from "../../types/annotation";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";

const tools: Array<{ value: AnnotationTool; label: string; icon: ReactNode }> = [
  { value: "freehand", label: "Freehand", icon: <Paintbrush size={17} /> },
  { value: "arrow", label: "Arrow", icon: <MoveUpRight size={17} /> },
  { value: "rectangle", label: "Rectangle", icon: <Square size={17} /> },
  { value: "circle", label: "Circle", icon: <Circle size={17} /> }
];

const colors = ["#22d3ee", "#a78bfa", "#34d399", "#f59e0b", "#fb7185"];

type AnnotationToolbarProps = {
  activeTool: AnnotationTool;
  color: string;
  thickness: number;
  onToolChange: (tool: AnnotationTool) => void;
  onColorChange: (color: string) => void;
  onThicknessChange: (thickness: number) => void;
  onClear: () => void;
};

export function AnnotationToolbar({ activeTool, color, thickness, onToolChange, onColorChange, onThicknessChange, onClear }: AnnotationToolbarProps) {
  return (
    <div className="annotation-toolbar">
      <div className="tool-group">
        {tools.map((tool) => (
          <button
            key={tool.value}
            className={cn("tool-button", activeTool === tool.value && "is-active")}
            onClick={() => onToolChange(tool.value)}
            title={tool.label}
            aria-label={tool.label}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      <div className="tool-group">
        {colors.map((option) => (
          <button
            key={option}
            className={cn("color-swatch", color === option && "is-active")}
            style={{ backgroundColor: option }}
            onClick={() => onColorChange(option)}
            title={option}
            aria-label={`Couleur ${option}`}
          />
        ))}
      </div>

      <label className="thickness-control">
        <span>{thickness}px</span>
        <input type="range" min={2} max={12} value={thickness} onChange={(event) => onThicknessChange(Number(event.target.value))} />
      </label>

      <Button variant="danger" icon={<Eraser size={16} />} onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}
