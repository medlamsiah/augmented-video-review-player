import { Fragment, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Clock3, RadioTower, ShieldCheck, UsersRound } from "lucide-react";
import type { AnnotationTool, ReviewAnnotation } from "./types/annotation";
import type { ReviewComment } from "./types/comment";
import type { VideoTranscription } from "./types/transcription";
import { socket } from "./lib/socket";
import { formatTime, uid } from "./lib/utils";
import { demoUsers, getCurrentUser } from "./data/demoUsers";
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

const REVIEW_SESSION_ID = "default-review-session";
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/vsecure-api" : "http://localhost:4500");
type Language = "fr" | "en";

const copy = {
  fr: {
    sidebar: {
      reviewRoom: "Salle de revue",
      secureVideo: "Video securisee",
      liveSync: "Synchro live",
      workspace: "Espace equipe"
    },
    topbar: {
      eyebrow: "Revue video entreprise",
      secureWorkspace: "Espace securise",
      liveCollaboration: "Collaboration live",
      offline: "Hors ligne",
      connected: "connectes"
    },
    comments: {
      eyebrow: "Notes de revue",
      title: "Commentaires",
      placeholder: "Ajouter un commentaire horodate...",
      submit: "Ajouter",
      emptyTitle: "Aucun commentaire",
      emptyBody: "Ajoutez une note, elle sera synchronisee dans les autres onglets."
    },
    stats: {
      duration: "Duree",
      annotations: "Annotations",
      comments: "Commentaires"
    },
    annotations: {
      clear: "Effacer",
      color: "Couleur",
      visible: "Visible autour du timestamp",
      recent: "Annotations recentes",
      emptyTitle: "Aucune annotation",
      emptyBody: "Dessinez sur la video pour creer un retour visuel horodate."
    },
    workspace: {
      eyebrow: "Espace equipe",
      title: "Pilotage collaboratif",
      body: "Suivez les reviewers, le statut de synchronisation et les derniers retours crees pendant la session.",
      liveSession: "Session live",
      secureRoom: "Salle securisee",
      reviewers: "Relecteurs",
      currentMoment: "Moment actuel",
      teamMembers: "Membres de l'equipe",
      recentActivity: "Activite recente",
      noActivity: "Aucune activite pour le moment.",
      online: "en ligne",
      synced: "synchronise",
      annotations: "annotations",
      comments: "commentaires"
    },
    exportJson: "Exporter JSON",
    toasts: {
      sessionCleared: "Session nettoyee",
      annotationAdded: "Annotation ajoutee",
      commentSynced: "Commentaire synchronise",
      sessionReset: "Session remise a zero",
      jsonExported: "JSON exporte",
      transcriptionReady: "Transcription generee",
      signedIn: "est connecte",
      signedOut: "Session fermee"
    }
  },
  en: {
    sidebar: {
      reviewRoom: "Review room",
      secureVideo: "Secure video",
      liveSync: "Live sync",
      workspace: "Workspace"
    },
    topbar: {
      eyebrow: "Enterprise video review",
      secureWorkspace: "Secure workspace",
      liveCollaboration: "Live collaboration",
      offline: "Offline",
      connected: "connected"
    },
    comments: {
      eyebrow: "Review notes",
      title: "Comments",
      placeholder: "Add a timestamped comment...",
      submit: "Add",
      emptyTitle: "No comments",
      emptyBody: "Add a note and it will sync across other tabs."
    },
    stats: {
      duration: "Duration",
      annotations: "Annotations",
      comments: "Comments"
    },
    annotations: {
      clear: "Clear",
      color: "Color",
      visible: "Visible around timestamp",
      recent: "Recent annotations",
      emptyTitle: "No annotations",
      emptyBody: "Draw on the video to create timestamped visual feedback."
    },
    workspace: {
      eyebrow: "Team workspace",
      title: "Collaborative command center",
      body: "Track reviewers, sync status and the latest feedback created during the session.",
      liveSession: "Live session",
      secureRoom: "Secure room",
      reviewers: "Reviewers",
      currentMoment: "Current moment",
      teamMembers: "Team members",
      recentActivity: "Recent activity",
      noActivity: "No activity yet.",
      online: "online",
      synced: "synced",
      annotations: "annotations",
      comments: "comments"
    },
    exportJson: "Export JSON",
    toasts: {
      sessionCleared: "Session cleared",
      annotationAdded: "Annotation added",
      commentSynced: "Comment synced",
      sessionReset: "Session reset",
      jsonExported: "JSON exported",
      transcriptionReady: "Transcription generated",
      signedIn: "is signed in",
      signedOut: "Signed out"
    }
  }
} as const;

function mergeById<T extends { id: string }>(remote: T[], pending: T[]) {
  const seen = new Set<string>();
  return [...pending, ...remote].filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

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
  const [language, setLanguage] = useState<Language>("fr");
  const pendingAnnotationsRef = useRef<ReviewAnnotation[]>([]);
  const pendingCommentsRef = useRef<ReviewComment[]>([]);
  const labels = copy[language];
  const teamMembers = [currentUser, ...demoUsers.filter((user) => user.name !== currentUser.name)].slice(0, 4);
  const recentActivity = [
    ...annotations.map((annotation) => ({
      id: annotation.id,
      author: annotation.author,
      time: annotation.timestamp,
      createdAt: annotation.createdAt,
      label: `${annotation.type} - ${labels.workspace.annotations}`
    })),
    ...comments.map((comment) => ({
      id: comment.id,
      author: comment.author,
      time: comment.timestamp,
      createdAt: comment.createdAt,
      label: `${comment.body.slice(0, 42) || labels.workspace.comments}`
    }))
  ]
    .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
    .slice(0, 4);

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
    const emitAnnotation = (annotation: ReviewAnnotation) => {
      socket.emit("add-annotation", { sessionId: REVIEW_SESSION_ID, annotation });
    };

    const emitComment = (comment: ReviewComment) => {
      socket.emit("add-comment", { sessionId: REVIEW_SESSION_ID, comment });
    };

    const flushPending = () => {
      pendingAnnotationsRef.current.forEach(emitAnnotation);
      pendingCommentsRef.current.forEach(emitComment);
      pendingAnnotationsRef.current = [];
      pendingCommentsRef.current = [];
    };

    const join = () => {
      setConnected(true);
      socket.emit("join-session", {
        sessionId: REVIEW_SESSION_ID,
        user: {
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role
        }
      });
      flushPending();
    };

    socket.on("connect", join);
    socket.on("disconnect", () => setConnected(false));
    socket.on("session-state", (state) => {
      setAnnotations(mergeById(state.annotations, pendingAnnotationsRef.current));
      setComments(mergeById(state.comments, pendingCommentsRef.current));
    });
    socket.on("annotation-added", (annotation) => {
      pendingAnnotationsRef.current = pendingAnnotationsRef.current.filter((item) => item.id !== annotation.id);
      setAnnotations((previous) => (previous.some((item) => item.id === annotation.id) ? previous : [annotation, ...previous]));
    });
    socket.on("comment-added", (comment) => {
      pendingCommentsRef.current = pendingCommentsRef.current.filter((item) => item.id !== comment.id);
      setComments((previous) => (previous.some((item) => item.id === comment.id) ? previous : [comment, ...previous]));
    });
    socket.on("session-cleared", () => {
      setAnnotations([]);
      setComments([]);
      showToast(labels.toasts.sessionCleared);
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
  }, [currentUser, labels.toasts.sessionCleared]);

  useEffect(() => {
    let cancelled = false;

    async function syncSessionSnapshot() {
      try {
        const response = await fetch(`${API_URL}/session?sessionId=${encodeURIComponent(REVIEW_SESSION_ID)}`);
        if (!response.ok || cancelled) {
          return;
        }

        const state = await response.json();
        setAnnotations(mergeById(state.annotations ?? [], pendingAnnotationsRef.current));
        setComments(mergeById(state.comments ?? [], pendingCommentsRef.current));
      } catch {
        return;
      }
    }

    void syncSessionSnapshot();
    const interval = window.setInterval(syncSessionSnapshot, 2500);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  async function persistAnnotation(annotation: ReviewAnnotation) {
    try {
      const response = await fetch(`${API_URL}/session/${encodeURIComponent(REVIEW_SESSION_ID)}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(annotation)
      });

      if (response.ok) {
        pendingAnnotationsRef.current = pendingAnnotationsRef.current.filter((item) => item.id !== annotation.id);
      }
    } catch {
      return;
    }
  }

  async function persistComment(comment: ReviewComment) {
    try {
      const response = await fetch(`${API_URL}/session/${encodeURIComponent(REVIEW_SESSION_ID)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(comment)
      });

      if (response.ok) {
        pendingCommentsRef.current = pendingCommentsRef.current.filter((item) => item.id !== comment.id);
      }
    } catch {
      return;
    }
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }

  function addAnnotation(annotation: ReviewAnnotation) {
    pendingAnnotationsRef.current = [annotation, ...pendingAnnotationsRef.current.filter((item) => item.id !== annotation.id)];
    setAnnotations((previous) => (previous.some((item) => item.id === annotation.id) ? previous : [annotation, ...previous]));
    if (connected) {
      socket.emit("add-annotation", { sessionId: REVIEW_SESSION_ID, annotation });
    }
    void persistAnnotation(annotation);
    showToast(labels.toasts.annotationAdded);
  }

  function addComment(body: string) {
    const comment: ReviewComment = {
      id: uid("comment"),
      timestamp: currentTime,
      body,
      author: currentUser.name,
      createdAt: new Date().toISOString()
    };

    pendingCommentsRef.current = [comment, ...pendingCommentsRef.current.filter((item) => item.id !== comment.id)];
    setComments((previous) => (previous.some((item) => item.id === comment.id) ? previous : [comment, ...previous]));
    if (connected) {
      socket.emit("add-comment", { sessionId: REVIEW_SESSION_ID, comment });
    }
    void persistComment(comment);
    showToast(labels.toasts.commentSynced);
  }

  function clearSession() {
    if (connected) {
      socket.emit("clear-session", { sessionId: REVIEW_SESSION_ID });
    } else {
      setAnnotations([]);
      setComments([]);
    }
    showToast(labels.toasts.sessionReset);
  }

  function seek(time: number) {
    setCurrentTime(time);
    setSeekTarget(time);
    window.setTimeout(() => setSeekTarget(null), 120);
  }

  return (
    <AppShell
      sidebar={<Sidebar userName={currentUser.name} userRole={currentUser.role} labels={labels.sidebar} />}
      topbar={
        <TopBar
          connected={connected}
          usersCount={usersCount}
          language={language}
          onLanguageChange={setLanguage}
          labels={labels.topbar}
          actions={
            <Fragment>
              <AuthModal
                user={currentUser}
                onAuthenticated={(user) => {
                  setCurrentUser(user);
                  showToast(`${user.name} ${labels.toasts.signedIn}`);
                }}
                onLogout={() => {
                  setCurrentUser(fallbackUser);
                  showToast(labels.toasts.signedOut);
                }}
              />
              <ExportJsonButton annotations={annotations} comments={comments} transcription={transcription} label={labels.exportJson} onExported={() => showToast(labels.toasts.jsonExported)} />
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
            clearLabel={labels.annotations.clear}
            colorLabel={labels.annotations.color}
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
            <VideoStats duration={duration} annotationsCount={annotations.length} commentsCount={comments.length} labels={labels.stats} />
            <Card className="annotation-card">
              <div className="section-heading">
                <span>{labels.annotations.visible}</span>
                <strong>{labels.annotations.recent}</strong>
              </div>
              <AnnotationList annotations={annotations} onSeek={seek} labels={labels.annotations} />
            </Card>
            <TranscriptionPanel
              currentTime={currentTime}
              onSeek={seek}
              onReady={(generated) => {
                setTranscription(generated);
                showToast(labels.toasts.transcriptionReady);
              }}
            />
            <Card className="team-workspace-card" id="company" tabIndex={-1}>
              <div className="team-workspace-hero">
                <div className="section-heading">
                  <span>{labels.workspace.eyebrow}</span>
                  <strong>{labels.workspace.title}</strong>
                </div>
                <p>{labels.workspace.body}</p>
              </div>

              <div className="workspace-metrics">
                <div>
                  <RadioTower size={18} />
                  <span>{labels.workspace.liveSession}</span>
                  <strong>{connected ? labels.workspace.synced : labels.topbar.offline}</strong>
                </div>
                <div>
                  <UsersRound size={18} />
                  <span>{labels.workspace.reviewers}</span>
                  <strong>{usersCount}</strong>
                </div>
                <div>
                  <Clock3 size={18} />
                  <span>{labels.workspace.currentMoment}</span>
                  <strong>{formatTime(currentTime)}</strong>
                </div>
                <div>
                  <ShieldCheck size={18} />
                  <span>{labels.workspace.secureRoom}</span>
                  <strong>Zero Trust</strong>
                </div>
              </div>

              <div className="workspace-panels">
                <div className="workspace-panel">
                  <div className="workspace-panel-title">
                    <UsersRound size={17} />
                    <strong>{labels.workspace.teamMembers}</strong>
                  </div>
                  <div className="team-member-list">
                    {teamMembers.map((member) => (
                      <div className="team-member-row" key={member.name}>
                        <span style={{ background: member.accent }}>{member.name.slice(0, 1)}</span>
                        <div>
                          <strong>{member.name}</strong>
                          <small>{member.role} - {labels.workspace.online}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="workspace-panel">
                  <div className="workspace-panel-title">
                    <Activity size={17} />
                    <strong>{labels.workspace.recentActivity}</strong>
                  </div>
                  {recentActivity.length > 0 ? (
                    <div className="activity-list">
                      {recentActivity.map((activity) => (
                        <button className="activity-row" key={activity.id} type="button" onClick={() => seek(activity.time)}>
                          <span>{formatTime(activity.time)}</span>
                          <div>
                            <strong>{activity.author}</strong>
                            <small>{activity.label}</small>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="workspace-empty">{labels.workspace.noActivity}</p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        </section>

        <CommentsPanel comments={comments} currentTime={currentTime} author={currentUser.name} labels={labels.comments} onAddComment={addComment} onSeek={seek} />
      </main>
      <Toast message={toast} />
    </AppShell>
  );
}
