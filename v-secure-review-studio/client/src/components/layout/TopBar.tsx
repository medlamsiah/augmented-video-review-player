import { RadioTower, ShieldCheck, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "../ui/Badge";

type TopBarProps = {
  connected: boolean;
  usersCount: number;
  language: "fr" | "en";
  onLanguageChange: (language: "fr" | "en") => void;
  labels: {
    eyebrow: string;
    secureWorkspace: string;
    liveCollaboration: string;
    offline: string;
    connected: string;
  };
  actions: ReactNode;
};

export function TopBar({ connected, usersCount, language, onLanguageChange, labels, actions }: TopBarProps) {
  return (
    <header className="topbar">
      <div>
        <span className="eyebrow">{labels.eyebrow}</span>
        <h1>V-Secure Review Studio</h1>
      </div>
      <div className="topbar-actions">
        <div className="language-toggle" aria-label="Language selector">
          <button type="button" className={language === "fr" ? "is-active" : ""} onClick={() => onLanguageChange("fr")}>
            FR
          </button>
          <button type="button" className={language === "en" ? "is-active" : ""} onClick={() => onLanguageChange("en")}>
            EN
          </button>
        </div>
        <Badge tone="green">
          <ShieldCheck size={14} />
          {labels.secureWorkspace}
        </Badge>
        <Badge tone={connected ? "cyan" : "amber"}>
          <RadioTower size={14} />
          {connected ? labels.liveCollaboration : labels.offline}
        </Badge>
        <Badge tone="violet">
          <UsersRound size={14} />
          {usersCount} {labels.connected}
        </Badge>
        {actions}
      </div>
    </header>
  );
}
