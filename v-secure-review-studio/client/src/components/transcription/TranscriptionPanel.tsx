import { useState } from "react";
import { FileText, Loader2, WandSparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { VideoTranscription } from "../../types/transcription";
import { formatTime } from "../../lib/utils";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

const demoTranscription: VideoTranscription = {
  videoId: "secure-demo-video",
  language: "fr",
  generatedAt: "",
  segments: [
    {
      id: "intro",
      start: 0,
      end: 14,
      text: "Peut-on vivre sans coeur ? Le coeur est souvent presente comme le moteur du corps humain."
    },
    {
      id: "role-heart",
      start: 14,
      end: 36,
      text: "Il envoie le sang vers les organes, transporte l'oxygene et permet au cerveau de continuer a fonctionner."
    },
    {
      id: "medical-support",
      start: 36,
      end: 64,
      text: "Dans certains cas tres graves, des machines ou un coeur artificiel peuvent remplacer temporairement cette fonction."
    },
    {
      id: "limits",
      start: 64,
      end: 86,
      text: "Mais vivre sans aucune circulation sanguine est impossible, car les cellules ont besoin d'oxygene en permanence."
    },
    {
      id: "conclusion",
      start: 86,
      end: 102,
      text: "La reponse courte est donc non, sauf avec une assistance medicale capable d'assurer le travail du coeur."
    }
  ]
};

type TranscriptionPanelProps = {
  currentTime: number;
  onSeek: (time: number) => void;
  onReady?: (transcription: VideoTranscription) => void;
};

export function TranscriptionPanel({ currentTime, onSeek, onReady }: TranscriptionPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [transcription, setTranscription] = useState<VideoTranscription | null>(null);

  function generateTranscription() {
    setIsGenerating(true);
    window.setTimeout(() => {
      const generated = {
        ...demoTranscription,
        generatedAt: new Date().toISOString()
      };
      setTranscription(generated);
      setIsGenerating(false);
      onReady?.(generated);
    }, 650);
  }

  const activeSegmentId = transcription?.segments.find((segment) => currentTime >= segment.start && currentTime <= segment.end)?.id;

  return (
    <Card className="transcription-card" id="transcription">
      <div className="section-heading transcription-heading">
        <div>
          <span>AI assisted review</span>
          <strong>Transcription</strong>
        </div>
        <Button
          variant={transcription ? "secondary" : "primary"}
          icon={isGenerating ? <Loader2 className="spin-icon" size={16} /> : <WandSparkles size={16} />}
          onClick={generateTranscription}
          disabled={isGenerating}
        >
          {transcription ? "Regenerer" : "Transcrire"}
        </Button>
      </div>

      {transcription ? (
        <motion.div className="transcript-list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {transcription.segments.map((segment) => (
            <button
              key={segment.id}
              className={activeSegmentId === segment.id ? "transcript-segment is-active" : "transcript-segment"}
              onClick={() => onSeek(segment.start)}
            >
              <span>
                {formatTime(segment.start)} - {formatTime(segment.end)}
              </span>
              <p>{segment.text}</p>
            </button>
          ))}
        </motion.div>
      ) : (
        <div className="transcript-empty">
          <FileText size={22} />
          <p>Cliquez sur Transcrire pour afficher une transcription demo horodatee de la video.</p>
        </div>
      )}
    </Card>
  );
}
