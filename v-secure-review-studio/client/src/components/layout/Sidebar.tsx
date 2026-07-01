import { Building2, Clapperboard, LockKeyhole, RadioTower, Sparkles } from "lucide-react";
import { Badge } from "../ui/Badge";

type SidebarProps = {
  userName: string;
  userRole: string;
};

export function Sidebar({ userName, userRole }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">
          <Clapperboard size={23} />
        </div>
        <div>
          <strong>V-Secure</strong>
          <span>Review Studio</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <a className="is-active" href="#review">
          <Clapperboard size={17} />
          Review room
        </a>
        <a href="#secure">
          <LockKeyhole size={17} />
          Secure video
        </a>
        <a href="#live">
          <RadioTower size={17} />
          Live sync
        </a>
        <a href="#company">
          <Building2 size={17} />
          Workspace
        </a>
      </nav>

      <div className="sidebar-card">
        <Sparkles size={18} />
        <strong>Soutenance mode</strong>
        <p>Canvas, commentaires, timeline et export sont prets pour une demo multi-onglets.</p>
        <Badge tone="violet">Premium SaaS</Badge>
      </div>

      <div className="user-card">
        <span>{userName.slice(0, 1)}</span>
        <div>
          <strong>{userName}</strong>
          <small>{userRole}</small>
        </div>
      </div>
    </aside>
  );
}
