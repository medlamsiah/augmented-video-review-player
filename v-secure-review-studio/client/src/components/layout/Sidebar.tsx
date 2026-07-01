import { Building2, Clapperboard, LockKeyhole, RadioTower } from "lucide-react";

type SidebarProps = {
  userName: string;
  userRole: string;
  labels: {
    reviewRoom: string;
    secureVideo: string;
    liveSync: string;
    workspace: string;
  };
};

export function Sidebar({ userName, userRole, labels }: SidebarProps) {
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
          {labels.reviewRoom}
        </a>
        <a href="#secure">
          <LockKeyhole size={17} />
          {labels.secureVideo}
        </a>
        <a href="#live">
          <RadioTower size={17} />
          {labels.liveSync}
        </a>
        <a href="#company">
          <Building2 size={17} />
          {labels.workspace}
        </a>
      </nav>

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
