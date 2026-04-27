import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Activity, Network, Boxes, Server, TrendingUp, LayoutGrid } from "lucide-react";
import { useEffect, useState } from "react";
import { dashboardStore, useDashboardState } from "../../lib/dashboardState";
import { relativeAge, statusTone } from "../lib/dashboardUi";

function DashboardLayout() {
  const location = useLocation();
  const state = useDashboardState();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    dashboardStore.start();
  }, []);

  const navItems = [
    { path: "/dashboard", icon: LayoutGrid, label: "Overview", desc: "Session health" },
    { path: "/dashboard/swarms", icon: Boxes, label: "Swarms", desc: "Manifests and peers" },
    { path: "/dashboard/topology", icon: Network, label: "Topology", desc: "Peer graph" },
    { path: "/dashboard/nodes", icon: Server, label: "Nodes", desc: "Runtime roster" },
    { path: "/dashboard/training", icon: TrendingUp, label: "Training", desc: "Learning metrics" },
    { path: "/dashboard/activity", icon: Activity, label: "Activity", desc: "Event stream" }
  ];
  const currentPage = navItems.find(
    (item) => item.path === location.pathname || item.path !== "/dashboard" && location.pathname.startsWith(item.path)
  ) || navItems[0];
  const connectionTone = statusTone(state.connection.status);
  const connectionClass = connectionTone === "success" ? "text-[var(--success)]" : connectionTone === "danger" ? "text-[var(--danger)]" : "text-[var(--warning)]";
  const dotClass = connectionTone === "success" ? "bg-[var(--success)]" : connectionTone === "danger" ? "bg-[var(--danger)]" : "bg-[var(--warning)]";

  return <div className="flex h-[calc(100vh-3.5rem)]">
      {
    /* Desktop Drawer */
  }
      <aside className="hidden lg:flex lg:w-60 border-r border-[var(--border)] bg-[var(--bg-elevated)] flex-col">
        <div className="p-5 border-b border-[var(--border)]">
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Operations</div>
          <div className="text-sm text-[var(--text-primary)] mb-2">QuinkGL</div>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${dotClass} animate-pulse`} />
            <span className="text-xs text-[var(--text-secondary)] mono">{state.source}</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
    const Icon = item.icon;
    const isActive = item.path === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(item.path);
    return <NavLink
      key={item.path}
      to={item.path}
      end={item.path === "/dashboard"}
      className={`flex items-start gap-3 px-3 py-2.5 rounded transition-colors relative group ${isActive ? "bg-[var(--surface)] text-[var(--gold-mid)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]"}`}
    >
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--gold-mid)]" />}
                <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm leading-tight">{item.label}</div>
                  <div className="text-xs text-[var(--text-muted)] leading-tight mt-0.5">{item.desc}</div>
                </div>
              </NavLink>;
  })}
        </nav>
      </aside>

      {
    /* Mobile Drawer Toggle */
  }
      <button
    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
    className="lg:hidden fixed bottom-4 right-4 z-50 w-12 h-12 bg-[var(--gold-mid)] text-[var(--bg-base)] rounded-full shadow-lg flex items-center justify-center"
  >
        <LayoutGrid className="w-5 h-5" />
      </button>

      {
    /* Mobile Menu */
  }
      {isMobileMenuOpen && <>
          <div
    className="lg:hidden fixed inset-0 bg-black/50 z-40"
    onClick={() => setIsMobileMenuOpen(false)}
  />
          <div className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-[var(--bg-elevated)] border-r border-[var(--border)] z-50 flex flex-col">
            <div className="p-5 border-b border-[var(--border)]">
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Operations</div>
              <div className="text-sm text-[var(--text-primary)] mb-2">QuinkGL</div>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${dotClass} animate-pulse`} />
                <span className="text-xs text-[var(--text-secondary)] mono">{state.source}</span>
              </div>
            </div>

            <nav className="flex-1 p-3 space-y-1">
              {navItems.map((item) => {
    const Icon = item.icon;
    const isActive = item.path === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(item.path);
    return <NavLink
      key={item.path}
      to={item.path}
      end={item.path === "/dashboard"}
      onClick={() => setIsMobileMenuOpen(false)}
      className={`flex items-start gap-3 px-3 py-2.5 rounded transition-colors relative ${isActive ? "bg-[var(--surface)] text-[var(--gold-mid)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]"}`}
    >
                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--gold-mid)]" />}
                    <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm leading-tight">{item.label}</div>
                      <div className="text-xs text-[var(--text-muted)] leading-tight mt-0.5">{item.desc}</div>
                    </div>
                  </NavLink>;
  })}
            </nav>
          </div>
        </>}

      {
    /* Main Content */
  }
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {
    /* Dashboard Header */
  }
        <header className="h-12 border-b border-[var(--border)] bg-[var(--bg-elevated)] flex items-center justify-between px-6 flex-shrink-0">
          <h1 className="text-sm text-[var(--text-primary)]">{currentPage.label}</h1>

          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 bg-[var(--surface)] border border-[var(--border)] rounded text-xs mono">
              <span className="text-[var(--text-muted)]">socket:</span>{" "}
              <span className={connectionClass}>{state.connection.status}</span>
            </div>
            <div className="px-2.5 py-1 bg-[var(--surface)] border border-[var(--border)] rounded text-xs mono">
              <span className="text-[var(--text-muted)]">updated:</span>{" "}
              <span className="text-[var(--text-secondary)]">{relativeAge(state.session.lastUpdatedAt ?? state.connection.lastConnectedAt)}</span>
            </div>
          </div>
        </header>

        {
    /* Page Content */
  }
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>;
}
export {
  DashboardLayout
};
