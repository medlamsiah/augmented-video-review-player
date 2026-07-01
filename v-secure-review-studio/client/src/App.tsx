import { Fragment, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Clock3, KeyRound, LockKeyhole, RadioTower, Server, ShieldCheck, UsersRound } from "lucide-react";
import type { AnnotationTool, ReviewAnnotation } from "./types/annotation";
import type { ReviewComment } from "./types/comment";
import type { VideoTranscription } from "./types/transcription";
import type { VideoAiAnalysis, VideoSummary } from "./types/video";
import { socket } from "./lib/socket";
import { formatTime, uid } from "./lib/utils";
import { fetchVideos, resolveVideoUrl, uploadVideo } from "./lib/videos";
import { demoUsers, getCurrentUser } from "./data/demoUsers";
import { AppShell } from "./components/layout/AppShell";
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { PremiumVideoPlayer } from "./components/video/PremiumVideoPlayer";
import { VideoLibrary } from "./components/video/VideoLibrary";
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
const SECURE_HLS_URL = import.meta.env.VITE_HLS_URL || (import.meta.env.PROD ? "/vsecure-hls/master.m3u8" : "http://localhost:8080/hls/master.m3u8");
const SECURE_KEY_URL = import.meta.env.PROD ? "/vsecure-key/demo.key?token=demo-secure-token" : "http://localhost:8080/keys/demo.key?token=demo-secure-token";
const SECURE_KEY_DENIED_URL = import.meta.env.PROD ? "/vsecure-key/demo.key" : "http://localhost:8080/keys/demo.key";
const SOCKET_ROUTE = import.meta.env.PROD ? "/vsecure-socket/socket.io" : "/socket.io";
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
    library: {
      title: "Video Library",
      upload: "Upload",
      empty: "Aucune video uploadee.",
      aiReady: "Analyse IA disponible",
      comments: "com.",
      annotations: "ann."
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
    secure: {
      eyebrow: "Video securisee",
      title: "Streaming HLS Zero-Trust",
      body: "Le flux de demonstration est segmente en HLS, chiffre AES-128 et servi avec une cle temporaire protegee par token.",
      hls: "Playlist HLS chiffree",
      key: "Cle AES avec token",
      denied: "Cle refusee sans token",
      proxy: "Proxy Nginx separe",
      active: "Actif",
      protected: "Protege",
      blocked: "Bloque",
      route: "Route",
      architecture: "Architecture",
      stepOne: "React charge la playlist HLS depuis /vsecure-hls/.",
      stepTwo: "Le player demande la cle via /vsecure-key/ avec un token temporaire.",
      stepThree: "Nginx garde le projet existant sur / et isole V-Secure sur /vsecure/."
    },
    live: {
      eyebrow: "Synchro live",
      title: "Collaboration temps reel",
      body: "Les annotations et commentaires sont envoyes par Socket.IO, stockes en memoire cote serveur et redistribues a tous les onglets connectes.",
      socket: "Socket.IO",
      session: "Session",
      reviewers: "Utilisateurs",
      latency: "Diffusion",
      connected: "Connecte",
      disconnected: "Deconnecte",
      instant: "Instantanee",
      events: "Evenements synchronises",
      route: "Route WebSocket",
      eventOne: "join-session charge l'etat existant pour les nouveaux utilisateurs.",
      eventTwo: "add-annotation partage les dessins video en direct.",
      eventThree: "add-comment partage les notes horodatees en direct."
    },
    exportJson: "Exporter JSON",
    toasts: {
      sessionCleared: "Session nettoyee",
      annotationAdded: "Annotation ajoutee",
      commentSynced: "Commentaire synchronise",
      sessionReset: "Session remise a zero",
      jsonExported: "JSON exporte",
      transcriptionReady: "Transcription generee",
      authRequired: "Connectez-vous pour signer cette action.",
      videosLoaded: "Bibliotheque video chargee",
      videoUploadRequired: "Connectez-vous pour uploader une video.",
      videoUploaded: "Video uploadee",
      videoSelected: "Video chargee",
      videoUploadFailed: "Upload video impossible",
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
    library: {
      title: "Video Library",
      upload: "Upload",
      empty: "No uploaded videos yet.",
      aiReady: "AI analysis available",
      comments: "com.",
      annotations: "ann."
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
    secure: {
      eyebrow: "Secure video",
      title: "Zero-Trust HLS streaming",
      body: "The demo stream is segmented as HLS, encrypted with AES-128 and served through a temporary token-protected key.",
      hls: "Encrypted HLS playlist",
      key: "AES key with token",
      denied: "Key denied without token",
      proxy: "Separate Nginx proxy",
      active: "Active",
      protected: "Protected",
      blocked: "Blocked",
      route: "Route",
      architecture: "Architecture",
      stepOne: "React loads the HLS playlist from /vsecure-hls/.",
      stepTwo: "The player requests the key through /vsecure-key/ with a temporary token.",
      stepThree: "Nginx keeps the existing project on / and isolates V-Secure on /vsecure/."
    },
    live: {
      eyebrow: "Live sync",
      title: "Real-time collaboration",
      body: "Annotations and comments are sent through Socket.IO, stored in server memory and redistributed to every connected tab.",
      socket: "Socket.IO",
      session: "Session",
      reviewers: "Users",
      latency: "Broadcast",
      connected: "Connected",
      disconnected: "Disconnected",
      instant: "Instant",
      events: "Synchronized events",
      route: "WebSocket route",
      eventOne: "join-session loads the existing state for new users.",
      eventTwo: "add-annotation shares video drawings live.",
      eventThree: "add-comment shares timestamped notes live."
    },
    exportJson: "Export JSON",
    toasts: {
      sessionCleared: "Session cleared",
      annotationAdded: "Annotation added",
      commentSynced: "Comment synced",
      sessionReset: "Session reset",
      jsonExported: "JSON exported",
      transcriptionReady: "Transcription generated",
      authRequired: "Sign in to sign this action.",
      videosLoaded: "Video library loaded",
      videoUploadRequired: "Sign in to upload a video.",
      videoUploaded: "Video uploaded",
      videoSelected: "Video loaded",
      videoUploadFailed: "Video upload failed",
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
  const [videos, setVideos] = useState<VideoSummary[]>([]);
  const [currentVideo, setCurrentVideo] = useState<VideoSummary | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
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
  const [aiAnalysis, setAiAnalysis] = useState<VideoAiAnalysis | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [language, setLanguage] = useState<Language>("fr");
  const pendingAnnotationsRef = useRef<ReviewAnnotation[]>([]);
  const pendingCommentsRef = useRef<ReviewComment[]>([]);
  const labels = copy[language];
  const isAuthenticated = Boolean(currentUser.email);
  const activeSessionId = currentVideo?.id ?? REVIEW_SESSION_ID;
  const activeVideoSource = currentVideo
    ? {
        id: currentVideo.id,
        url: resolveVideoUrl(currentVideo.url),
        label: currentVideo.title
      }
    : undefined;
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
    let cancelled = false;

    async function loadVideos() {
      try {
        const nextVideos = await fetchVideos();
        if (cancelled) {
          return;
        }

        setVideos(nextVideos);
        setCurrentVideo((previous) => previous ?? nextVideos.find((video) => video.id === REVIEW_SESSION_ID) ?? nextVideos[0] ?? null);
      } catch {
        return;
      }
    }

    void loadVideos();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const emitAnnotation = (annotation: ReviewAnnotation) => {
      socket.emit("add-annotation", { sessionId: activeSessionId, annotation });
    };

    const emitComment = (comment: ReviewComment) => {
      socket.emit("add-comment", { sessionId: activeSessionId, comment });
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
        sessionId: activeSessionId,
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
      if (state.video) {
        setCurrentVideo(state.video);
        setVideos((previous) => [state.video!, ...previous.filter((video) => video.id !== state.video!.id)]);
      }
      setAiAnalysis(state.aiAnalysis ?? null);
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
  }, [activeSessionId, currentUser, labels.toasts.sessionCleared]);

  useEffect(() => {
    let cancelled = false;

    async function syncSessionSnapshot() {
      try {
        const response = await fetch(`${API_URL}/session?sessionId=${encodeURIComponent(activeSessionId)}`);
        if (!response.ok || cancelled) {
          return;
        }

        const state = await response.json();
        if (state.video) {
          setCurrentVideo(state.video);
          setVideos((previous) => [state.video, ...previous.filter((video) => video.id !== state.video.id)]);
        }
        setAiAnalysis(state.aiAnalysis ?? null);
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
  }, [activeSessionId]);

  useEffect(() => {
    const maybeTranscription = aiAnalysis?.transcription as VideoTranscription | undefined;
    if (maybeTranscription && Array.isArray(maybeTranscription.segments)) {
      setTranscription(maybeTranscription);
    }
  }, [aiAnalysis]);

  async function persistAnnotation(annotation: ReviewAnnotation) {
    try {
      const response = await fetch(`${API_URL}/session/${encodeURIComponent(activeSessionId)}/annotations`, {
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
      const response = await fetch(`${API_URL}/session/${encodeURIComponent(activeSessionId)}/comments`, {
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

  async function persistAiAnalysis(transcriptionPayload: VideoTranscription) {
    try {
      const response = await fetch(`${API_URL}/videos/${encodeURIComponent(activeSessionId)}/analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: "Demo transcription generated inside V-Secure Review Studio.",
          transcription: transcriptionPayload,
          chapters: [],
          keywords: ["review", "video", "collaboration"]
        })
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { analysis: VideoAiAnalysis };
      setAiAnalysis(payload.analysis);
      setVideos((previous) =>
        previous.map((video) => (video.id === activeSessionId ? { ...video, aiAvailable: true, aiStatus: "ready" } : video))
      );
    } catch {
      return;
    }
  }


  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }

  function requireAuth() {
    if (isAuthenticated) {
      return true;
    }

    setAuthModalOpen(true);
    showToast(labels.toasts.authRequired);
    return false;
  }

  function selectVideo(video: VideoSummary) {
    pendingAnnotationsRef.current = [];
    pendingCommentsRef.current = [];
    setCurrentVideo(video);
    setAnnotations([]);
    setComments([]);
    setTranscription(null);
    setAiAnalysis(null);
    setCurrentTime(0);
    setDuration(video.duration ?? 0);
    setSeekTarget(0);
    window.setTimeout(() => setSeekTarget(null), 120);
    showToast(labels.toasts.videoSelected);
  }

  async function handleUploadVideo(file: File) {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      showToast(labels.toasts.videoUploadRequired);
      return;
    }

    setUploadingVideo(true);
    try {
      const uploaded = await uploadVideo(file);
      setVideos((previous) => [uploaded, ...previous.filter((video) => video.id !== uploaded.id)]);
      selectVideo(uploaded);
      showToast(labels.toasts.videoUploaded);
    } catch {
      showToast(labels.toasts.videoUploadFailed);
    } finally {
      setUploadingVideo(false);
    }
  }

  function addAnnotation(annotation: ReviewAnnotation) {
    pendingAnnotationsRef.current = [annotation, ...pendingAnnotationsRef.current.filter((item) => item.id !== annotation.id)];
    setAnnotations((previous) => (previous.some((item) => item.id === annotation.id) ? previous : [annotation, ...previous]));
    if (connected) {
      socket.emit("add-annotation", { sessionId: activeSessionId, annotation });
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
      socket.emit("add-comment", { sessionId: activeSessionId, comment });
    }
    void persistComment(comment);
    showToast(labels.toasts.commentSynced);
  }

  function clearSession() {
    if (connected) {
      socket.emit("clear-session", { sessionId: activeSessionId });
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
      sidebar={
        <Sidebar
          userName={currentUser.name}
          userRole={currentUser.role}
          labels={labels.sidebar}
          library={
            <VideoLibrary
              videos={videos}
              currentVideoId={activeSessionId}
              labels={labels.library}
              uploading={uploadingVideo}
              onUpload={handleUploadVideo}
              onSelect={selectVideo}
            />
          }
        />
      }
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
                open={authModalOpen}
                onOpenChange={setAuthModalOpen}
                onAuthenticated={(user) => {
                  setCurrentUser(user);
                  showToast(`${user.name} ${labels.toasts.signedIn}`);
                }}
                onLogout={() => {
                  setCurrentUser(fallbackUser);
                  showToast(labels.toasts.signedOut);
                }}
              />
              <ExportJsonButton
                annotations={annotations}
                comments={comments}
                video={currentVideo}
                aiAnalysis={aiAnalysis}
                transcription={transcription}
                label={labels.exportJson}
                canExport={isAuthenticated}
                onAuthRequired={requireAuth}
                onExported={() => showToast(labels.toasts.jsonExported)}
              />
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
              selectedSource={activeVideoSource}
              activeTool={activeTool}
              color={color}
              thickness={thickness}
              author={currentUser.name}
              canAnnotate={isAuthenticated}
              onAuthRequired={requireAuth}
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
                void persistAiAnalysis(generated);
                showToast(labels.toasts.transcriptionReady);
              }}
            />
            <Card className="secure-video-card" id="secure" tabIndex={-1}>
              <div className="secure-video-hero">
                <div className="section-heading">
                  <span>{labels.secure.eyebrow}</span>
                  <strong>{labels.secure.title}</strong>
                </div>
                <p>{labels.secure.body}</p>
              </div>

              <div className="secure-metrics">
                <a href={SECURE_HLS_URL} target="_blank" rel="noreferrer">
                  <LockKeyhole size={18} />
                  <span>{labels.secure.hls}</span>
                  <strong>{labels.secure.active}</strong>
                </a>
                <a href={SECURE_KEY_URL} target="_blank" rel="noreferrer">
                  <KeyRound size={18} />
                  <span>{labels.secure.key}</span>
                  <strong>{labels.secure.protected}</strong>
                </a>
                <a href={SECURE_KEY_DENIED_URL} target="_blank" rel="noreferrer">
                  <ShieldCheck size={18} />
                  <span>{labels.secure.denied}</span>
                  <strong>401</strong>
                </a>
                <div>
                  <Server size={18} />
                  <span>{labels.secure.proxy}</span>
                  <strong>/vsecure/</strong>
                </div>
              </div>

              <div className="secure-route-grid">
                <div className="secure-route-panel">
                  <strong>{labels.secure.route}</strong>
                  <code>{SECURE_HLS_URL}</code>
                  <code>{SECURE_KEY_URL}</code>
                  <code>/vsecure-socket/socket.io</code>
                </div>
                <div className="secure-route-panel">
                  <strong>{labels.secure.architecture}</strong>
                  <ol>
                    <li>{labels.secure.stepOne}</li>
                    <li>{labels.secure.stepTwo}</li>
                    <li>{labels.secure.stepThree}</li>
                  </ol>
                </div>
              </div>
            </Card>
            <Card className="live-sync-card" id="live" tabIndex={-1}>
              <div className="secure-video-hero">
                <div className="section-heading">
                  <span>{labels.live.eyebrow}</span>
                  <strong>{labels.live.title}</strong>
                </div>
                <p>{labels.live.body}</p>
              </div>

              <div className="live-sync-metrics">
                <div>
                  <RadioTower size={18} />
                  <span>{labels.live.socket}</span>
                  <strong>{connected ? labels.live.connected : labels.live.disconnected}</strong>
                </div>
                <div>
                  <Activity size={18} />
                  <span>{labels.live.session}</span>
                  <strong>{activeSessionId}</strong>
                </div>
                <div>
                  <UsersRound size={18} />
                  <span>{labels.live.reviewers}</span>
                  <strong>{usersCount}</strong>
                </div>
                <div>
                  <Clock3 size={18} />
                  <span>{labels.live.latency}</span>
                  <strong>{labels.live.instant}</strong>
                </div>
              </div>

              <div className="live-sync-panels">
                <div className="secure-route-panel">
                  <strong>{labels.live.route}</strong>
                  <code>{SOCKET_ROUTE}</code>
                  <code>{socket.id ? `socket:${socket.id.slice(0, 12)}` : "socket:pending"}</code>
                </div>
                <div className="secure-route-panel">
                  <strong>{labels.live.events}</strong>
                  <ol>
                    <li>{labels.live.eventOne}</li>
                    <li>{labels.live.eventTwo}</li>
                    <li>{labels.live.eventThree}</li>
                  </ol>
                </div>
              </div>
            </Card>
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

        <CommentsPanel
          comments={comments}
          currentTime={currentTime}
          author={currentUser.name}
          labels={labels.comments}
          canComment={isAuthenticated}
          onAuthRequired={requireAuth}
          onAddComment={addComment}
          onSeek={seek}
        />
      </main>
      <Toast message={toast} />
    </AppShell>
  );
}
