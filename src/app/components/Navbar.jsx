import { Link, useLocation } from "react-router-dom";
import quinkglLogo from "../../imports/quinkgl_logo.png";
function Navbar() {
  const location = useLocation();
  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };
  return <nav className="h-14 border-b border-[var(--border)] bg-[var(--bg-base)] flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-3">
          <img src={quinkglLogo} alt="QuinkGL" className="w-8 h-8" />
          <span className="text-[var(--text-primary)] font-medium tracking-tight">QuinkGL</span>
        </Link>
      </div>

      <div className="flex items-center gap-1">
        <Link
    to="/"
    className={`px-4 py-2 text-sm transition-colors relative ${isActive("/") && location.pathname === "/" ? "text-[var(--gold-mid)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
  >
          Home
          {isActive("/") && location.pathname === "/" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--gold-mid)]" />}
        </Link>

        <Link
    to="/docs"
    className={`px-4 py-2 text-sm transition-colors relative ${isActive("/docs") ? "text-[var(--gold-mid)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
  >
          Documentation
          {isActive("/docs") && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--gold-mid)]" />}
        </Link>

        <Link
    to="/dashboard"
    className={`px-4 py-2 text-sm transition-colors relative ${isActive("/dashboard") ? "text-[var(--gold-mid)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
  >
          Dashboard
          {isActive("/dashboard") && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--gold-mid)]" />}
        </Link>
      </div>
    </nav>;
}
export {
  Navbar
};
