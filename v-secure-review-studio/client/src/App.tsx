import { Fragment, useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { AnnotationTool, ReviewAnnotation } from "./types/annotation";
import type { ReviewComment } from "./types/comment";
import type { VideoTranscription } from "./types/transcription";
import { socket } from "./lib/socket";
import { uid } from "./lib/utils";
import { getCurrentUser } from "./data/demoUsers";
import { AppShell } from "./components/layout/AppShell";
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { PremiumVideoPlayer } from "./components/video/PremiumVideoPlayer";
import { VideoTimeline } from "./components/video/VideoTimeline";
import { VideoStats } from "./components/video/VideoStats";
import { AnnotationToolbar } from "./components/annotations/AnnotationToolbar";
import { AnnotationLayer } from "./components/annotations/AnnotationLayer";
import { AnnotationList } from "./components/annotations/AnnotationList";
import { CommentsPanel } from "./components/comments/CommentsPanel";
import { ExportJsonButton } from "./components/export/ExportJsonButton";
import { TranscriptionPanel } from "./components/transcription/TranscriptionPanel";
import { AuthModal } from "./components/auth/AuthModal";
import type { AuthUser } from "./components/auth/AuthModal";
import { fetchMe, loadStoredAuthUser } from "./lib/auth";
import { Card } from "./components/ui/Card";
import { Toast } from "./components/ui/Toast";

export default function App() {
  const [fallbackUser] = useState(() => getCurrentUser());
  const [currentUser, setCurrentUser] = useState<AuthUser>(() => loadStoredAuthUser() ?? fallbackUser);
  const [annotations, setAnnotations] = useState<ReviewAnnotation[]>([]);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [activeTool, setActiveTool] = useState<AnnotationTool>("freehand");
  const [color, setColor] = useState("#22d3ee");
  const [thickness, setThickness] = useState(5);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [usersCount, setUsersCount] = useState(1);
  const [connected, setConnected] = useState(socket.connected);
  const [seekTarget, setSeekTarget] = useState<number | null>(null);
  const [transcription, setTranscription] = useState<VideoTranscription | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    void fetchMe()
      .then((user) => {
        if (user) {
          setCurrentUser(user);
        }
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    const join = () => {
      setConnected(true);
      socket.emit("join-session");
    };

    socket.on("connect", join);
    socket.on("disconnect", () => setConnected(false));
    socket.on("session-state", (state) => {
      setAnnotations(state.annotations);
      setComments(state.comments);
    });
    socket.on("annotation-added", (annotation) => {
      setAnnotations((previous) => (previous.some((item) => item.id === annotation.id) ? previous : [annotation, ...previous]));
    });
    socket.on("comment-added", (comment) => {
      setComments((previous) => (previous.some((item) => item.id === comment.id) ? previous : [comment, ...previous]));
    });
    socket.on("session-cleared", () => {
      setAnnotations([]);
      setComments([]);
      showToast("Session nettoyee");
    });
    socket.on("users-count", setUsersCount);

    if (socket.connected) {
      join();
    }

    return () => {
      socket.off("connect", join);
      socket.off("disconnect");
      socket.off("session-state");
      socket.off("annotation-added");
      socket.off("comment-added");
      socket.off("session-cleared");
      socket.off("users-count");
    };
  }, []);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }

  function addAnnotation(annotation: ReviewAnnotation) {
    if (connected) {
      socket.emit("add-annotation", annotation);
    } else {
      setAnnotations((previous) => [annotation, ...previous]);
    }
    showToast("Annotation ajoutee");
  }

  function addComment(body: string) {
    const comment: ReviewComment = {
      id: uid("comment"),
      timestamp: currentTime,
      body,
      author: currentUser.name,
      createdAt: new Date().toISOString()
    };

    if (connected) {
      socket.emit("add-comment", comment);
    } else {
      setComments((previous) => [comment, ...previous]);
    }
    showToast("Commentaire synchronise");
  }

  function clearSession() {
    if (connected) {
      socket.emit("clear-session");
    } else {
      setAnnotations([]);
      setComments([]);
    }
    showToast("Session remise a zero");
  }

  function seek(time: number) {
    setCurrentTime(time);
    setSeekTarget(time);
    window.setTimeout(() => setSeekTarget(null), 120);
  }

  return (
    <AppShell
      sidebar={<Sidebar userName={currentUser.name} userRole={currentUser.role} />}
      topbar={
        <TopBar
          connected={connected}
          usersCount={usersCount}
          actions={
            <Fragment>
              <AuthModal
                user={currentUser}
                onAuthenticated={(user) => {
                  setCurrentUser(user);
                  showToast(`${user.name} est connecte`);
                }}
                onLogout={() => {
                  setCurrentUser(fallbackUser);
                  showToast("Session fermee");
                }}
              />
              <ExportJsonButton annotations={annotations} comments={comments} transcription={transcription} onExported={() => showToast("JSON exporte")} />
            </Fragment>
          }
        />
      }
    >
      <main className="studio-grid" id="review">
        <section className="main-column">
          <AnnotationToolbar
            activeTool={activeTool}
            color={color}
            thickness={thickness}
            onToolChange={setActiveTool}
            onColorChange={setColor}
            onThicknessChange={setThickness}
            onClear={clearSession}
          />

          <div className="player-wrap">
            <PremiumVideoPlayer
              annotations={annotations}
              currentTime={currentTime}
              activeTool={activeTool}
              color={color}
              thickness={thickness}
              author={currentUser.name}
              onCreateAnnotation={addAnnotation}
              onTimeUpdate={setCurrentTime}
              onDurationChange={setDuration}
              seekTarget={seekTarget}
            />
            <AnnotationLayer annotations={annotations} currentTime={currentTime} />
          </div>

          <VideoTimeline currentTime={currentTime} duration={duration} annotations={annotations} comments={comments} onSeek={seek} />

          <motion.div className="lower-grid" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <VideoStats duration={duration} annotationsCount={annotations.length} commentsCount={comments.length} />
            <Card className="annotation-card">
              <div className="section-heading">
                <span>Visible around timestamp</span>
                <strong>Annotations recentes</strong>
              </div>
              <AnnotationList annotations={annotations} onSeek={seek} />
            </Card>
            <TranscriptionPanel
              currentTime={currentTime}
              onSeek={seek}
              onReady={(generated) => {
                setTranscription(generated);
                showToast("Transcription generee");
              }}
            />
          </motion.div>
        </section>

        <CommentsPanel comments={comments} currentTime={currentTime} author={currentUser.name} onAddComment={addComment} onSeek={seek} />
      </main>
      <Toast message={toast} />
    </AppShell>
  );
}
