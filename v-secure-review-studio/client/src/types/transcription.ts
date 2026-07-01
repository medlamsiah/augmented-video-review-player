export type TranscriptSegment = {
  id: string;
  start: number;
  end: number;
  text: string;
};

export type VideoTranscription = {
  videoId: string;
  language: string;
  generatedAt: string;
  segments: TranscriptSegment[];
};
