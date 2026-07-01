import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, SyntheticEvent } from "react";
import { motion } from "framer-motion";
import type Hls from "hls.js";
import { LockKeyhole, Pause, Play, UploadCloud } from "lucide-react";
import type { AnnotationTool, ReviewAnnotation } from "../../types/annotation";
import { Button } from "../ui/Button";
import { AnnotationCanvas } from "./AnnotationCanvas";

const DEFAULT_VIDEO_SOURCE = `${import.meta.env.BASE_URL}sample.mp4`;
const SECURE_HLS_SOURCE = import.meta.env.VITE_HLS_URL || (import.meta.env.PROD ? "/vsecure-hls/master.m3u8" : "http://localhost:8080/hls/master.m3u8");
const VIDEO_NOT_FOUND_MESSAGE = "Video not found. Please add sample.mp4 inside client/public/";
const HLS_NOT_AVAILABLE_MESSAGE = "Secure HLS stream unavailable. Run secure-streaming/scripts/prepare-demo.sh then docker compose up inside secure-streaming/.";
type VideoSourceType = "mp4" | "hls";

type PremiumVideoPlayerProps = {
  annotations: ReviewAnnotation[];
  currentTime: number;
  activeTool: AnnotationTool;
  color: string;
  thickness: number;
  author: string;
  canAnnotate: boolean;
  onAuthRequired: () => void;
  onCreateAnnotation: (annotation: ReviewAnnotation) => void;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  seekTarget: number | null;
};

export function PremiumVideoPlayer({
  annotations,
  currentTime,
  activeTool,
  color,
  thickness,
  author,
  canAnnotate,
  onAuthRequired,
  onCreateAnnotation,
  onTimeUpdate,
  onDurationChange,
  seekTarget
}: PremiumVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [source, setSource] = useState(DEFAULT_VIDEO_SOURCE);
  const [sourceLabel, setSourceLabel] = useState(DEFAULT_VIDEO_SOURCE);
  const [sourceType, setSourceType] = useState<VideoSourceType>("mp4");
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (seekTarget !== null && videoRef.current && Math.abs(videoRef.current.currentTime - seekTarget) > 0.25) {
      videoRef.current.currentTime = seekTarget;
    }
  }, [seekTarget]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    hlsRef.current?.destroy();
    hlsRef.current = null;
    setIsPlaying(false);

    if (sourceType === "hls") {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
        video.load();
        return;
      }

      let cancelled = false;
      void import("hls.js").then(({ default: HlsRuntime }) => {
        if (cancelled) {
          return;
        }

        if (!HlsRuntime.isSupported()) {
          setVideoError("Secure HLS is not supported by this browser.");
          return;
        }

        const hls = new HlsRuntime({
          enableWorker: true,
          lowLatencyMode: false
        });
        hlsRef.current = hls;
        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(HlsRuntime.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            setVideoError(HLS_NOT_AVAILABLE_MESSAGE);
            setIsPlaying(false);
            onTimeUpdate(0);
            onDurationChange(0);
          }
        });
      });

      return () => {
        cancelled = true;
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      };
    }

    video.src = source;
    video.load();
  }, [source, sourceType, onDurationChange, onTimeUpdate]);

  useEffect(() => {
    return () => {
      hlsRef.current?.destroy();
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }

      const objectUrl = URL.createObjectURL(file);
      objectUrlRef.current = objectUrl;
      setSource(objectUrl);
      setSourceLabel(file.name);
      setSourceType("mp4");
      setVideoError(null);
      setIsPlaying(false);
    }
  }

  function useSecureHls() {
    setSource(SECURE_HLS_SOURCE);
    setSourceLabel(`Secure HLS: ${SECURE_HLS_SOURCE}`);
    setSourceType("hls");
    setVideoError(null);
    onTimeUpdate(0);
    onDurationChange(0);
  }

  function handleLoadedMetadata(event: SyntheticEvent<HTMLVideoElement>) {
    const video = event.currentTarget;
    setVideoError(null);
    onTimeUpdate(video.currentTime);
    onDurationChange(Number.isFinite(video.duration) ? video.duration : 0);
  }

  function handleVideoError() {
    setVideoError(sourceType === "hls" ? HLS_NOT_AVAILABLE_MESSAGE : VIDEO_NOT_FOUND_MESSAGE);
    setIsPlaying(false);
    onTimeUpdate(0);
    onDurationChange(0);
  }

  function pauseForAnnotation() {
    const video = videoRef.current;
    if (!video || video.paused) {
      return;
    }

    video.pause();
    onTimeUpdate(video.currentTime);
  }

  async function togglePlayback() {
    const video = videoRef.current;
    if (!video || videoError) {
      return;
    }

    if (video.paused) {
      try {
        await video.play();
      } catch {
        setVideoError("Video playback failed. Please try again or load another MP4.");
      }
    } else {
      video.pause();
    }
  }

  return (
    <motion.section
      className="video-stage"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="video-frame">
        <video
          ref={videoRef}
          controls
          playsInline
          className="review-video"
          onTimeUpdate={(event) => onTimeUpdate(event.currentTarget.currentTime)}
          onLoadedMetadata={handleLoadedMetadata}
          onDurationChange={(event) => onDurationChange(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
          onError={handleVideoError}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
        {videoError ? <div className="video-error-message">{videoError}</div> : null}
        <AnnotationCanvas
          annotations={annotations}
          currentTime={currentTime}
          activeTool={activeTool}
          color={color}
          thickness={thickness}
          author={author}
          canDraw={canAnnotate}
          onAuthRequired={onAuthRequired}
          onDrawingStart={pauseForAnnotation}
          onCreate={onCreateAnnotation}
        />
      </div>

      <div className="video-source-row">
        <span>Source: {sourceLabel}</span>
        <div className="video-source-actions">
          <Button variant={sourceType === "hls" ? "primary" : "secondary"} icon={<LockKeyhole size={16} />} onClick={useSecureHls}>
            Secure HLS
          </Button>
          <Button variant="secondary" icon={isPlaying ? <Pause size={16} /> : <Play size={16} />} onClick={togglePlayback} disabled={Boolean(videoError)}>
            {isPlaying ? "Pause" : "Play"}
          </Button>
          <label className="file-button">
            <UploadCloud size={16} />
            Load MP4
            <input type="file" accept="video/mp4,video/*" onChange={handleUpload} />
          </label>
        </div>
      </div>
    </motion.section>
  );
}
