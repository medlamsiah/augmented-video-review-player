import { RadioTower, ShieldCheck, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "../ui/Badge";

type TopBarProps = {
  connected: boolean;
  usersCount: number;
  actions: ReactNode;
};

export function TopBar({ connected, usersCount, actions }: TopBarProps) {
  return (
    <header className="topbar">
      <div>
        <span className="eyebrow">Enterprise video review</span>
        <h1>V-Secure Review Studio</h1>
      </div>
      <div className="topbar-actions">
        <Badge tone="green">
          <ShieldCheck size={14} />
          Secure Workspace
        </Badge>
        <Badge tone={connected ? "cyan" : "amber"}>
          <RadioTower size={14} />
          {connected ? "Live collaboration" : "Offline"}
        </Badge>
        <Badge tone="violet">
          <UsersRound size={14} />
          {usersCount} connected
        </Badge>
        {actions}
      </div>
    </header>
  );
}
