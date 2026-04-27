import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { createDashboardApi } from "../../lib/dashboardApi";
import { storeViewerSession } from "../../lib/dashboardAuth";
import { dashboardStore } from "../../lib/dashboardState";

function normalizeCode(value) {
  return value.trim().toUpperCase();
}

function Login() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const normalizedCode = normalizeCode(code);
    if (!normalizedCode) {
      setError("Enter the dashboard code from your terminal.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const session = await createDashboardApi().loginDashboard(normalizedCode);
      storeViewerSession({
        viewerToken: session.viewer_token,
        scope: session.scope,
      });
      dashboardStore.stop();
      await dashboardStore.retry();
      navigate("/dashboard", { replace: true });
    } catch {
      setError("The dashboard code is invalid or expired.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return <main className="min-h-full bg-[var(--bg-base)] flex items-center justify-center px-6 py-10">
      <section className="w-full max-w-md border border-[var(--border)] bg-[var(--bg-elevated)] rounded p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--gold-mid)]">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg text-[var(--text-primary)] leading-tight">Dashboard access</h1>
            <p className="text-sm text-[var(--text-secondary)]">Paste the code printed by your QuinkGL peer.</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Terminal code</span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="QGL-ABCD-1234"
              autoCapitalize="characters"
              autoComplete="one-time-code"
              className="mt-2 w-full bg-[var(--surface)] border border-[var(--border)] rounded px-3 py-3 text-sm mono text-[var(--text-primary)] outline-none focus:border-[var(--gold-mid)]"
            />
          </label>

          {error && <div className="border border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)] rounded px-3 py-2 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-[var(--gold-mid)] text-[var(--bg-base)] rounded px-4 py-3 text-sm font-medium disabled:opacity-60"
          >
            {isSubmitting ? "Checking code" : "Open dashboard"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 flex items-start gap-3 border-t border-[var(--border)] pt-4 text-xs text-[var(--text-secondary)]">
          <ShieldCheck className="w-4 h-4 text-[var(--success)] flex-shrink-0 mt-0.5" />
          <p>The code grants read-only access to the swarm associated with the peer that issued it.</p>
        </div>
      </section>
    </main>;
}

export {
  Login
};
