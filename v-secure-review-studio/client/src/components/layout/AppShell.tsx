import type { ReactNode } from "react";

type AppShellProps = {
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
};

export function AppShell({ sidebar, topbar, children }: AppShellProps) {
  return (
    <div className="app-shell">
      {sidebar}
      <div className="workspace">
        {topbar}
        {children}
      </div>
    </div>
  );
}
