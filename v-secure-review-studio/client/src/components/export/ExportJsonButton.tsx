import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import type { ReviewAnnotation } from "../../types/annotation";
import type { ReviewComment } from "../../types/comment";
import type { VideoTranscription } from "../../types/transcription";
import { downloadJson } from "../../lib/utils";
import { Button } from "../ui/Button";
import { ExportPreviewModal } from "./ExportPreviewModal";

type ExportJsonButtonProps = {
  annotations: ReviewAnnotation[];
  comments: ReviewComment[];
  transcription?: VideoTranscription | null;
  label: string;
  canExport: boolean;
  onAuthRequired: () => void;
  onExported: () => void;
};

export function ExportJsonButton({ annotations, comments, transcription, label, canExport, onAuthRequired, onExported }: ExportJsonButtonProps) {
  const [open, setOpen] = useState(false);
  const payload = useMemo(
    () => ({
      project: "V-Secure Review Studio",
      videoId: "secure-demo-video",
      exportedAt: new Date().toISOString(),
      annotations,
      comments,
      transcription: transcription ?? null
    }),
    [annotations, comments, transcription]
  );

  function download() {
    downloadJson("v-secure-review-export.json", payload);
    setOpen(false);
    onExported();
  }

  return (
    <>
      <Button
        variant="primary"
        icon={<Download size={16} />}
        onClick={() => {
          if (!canExport) {
            onAuthRequired();
            return;
          }

          setOpen(true);
        }}
      >
        {label}
      </Button>
      <ExportPreviewModal open={open} payload={payload} onClose={() => setOpen(false)} onDownload={download} />
    </>
  );
}
