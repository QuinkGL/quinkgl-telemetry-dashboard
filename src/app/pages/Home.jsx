import { Link } from 'react-router-dom';
import { GossipBackground } from '../components/GossipBackground';

function Home() {
  return <div className="h-full relative overflow-hidden">
      <GossipBackground />

      <div className="relative z-10 h-full flex flex-col items-center justify-center gap-8">
        <div className="text-center space-y-3 px-6 py-4">
          <h1
    className="text-6xl text-[var(--gold-light)] tracking-tight"
    style={{ textShadow: '0 2px 24px rgba(0,0,0,1), 0 0 48px rgba(0,0,0,0.95), 0 0 80px rgba(0,0,0,0.7)' }}
  >
            QuinkGL
          </h1>
          <p
    className="text-xl text-white"
    style={{ textShadow: '0 2px 16px rgba(0,0,0,1), 0 0 32px rgba(0,0,0,0.9)' }}
  >
            Decentralized Gossip Learning Framework
          </p>
          <p
    className="text-base text-white max-w-lg mx-auto leading-relaxed"
    style={{ textShadow: '0 2px 14px rgba(0,0,0,1), 0 0 28px rgba(0,0,0,0.9)' }}
  >
            Train machine learning models across distributed peers without central coordination
          </p>
        </div>

        <div className="flex items-center gap-4 mt-6">
          <Link
    to="/dashboard"
    className="px-8 py-3 bg-[var(--gold-mid)] text-[var(--bg-base)] rounded hover:bg-[var(--gold-light)] transition-colors shadow-lg shadow-[var(--gold-mid)]/20"
  >
            Enter Dashboard
          </Link>
          <Link
    to="/docs"
    className="px-8 py-3 border border-[var(--border)] text-[var(--text-primary)] rounded hover:border-[var(--gold-mid)] hover:text-[var(--gold-mid)] transition-colors backdrop-blur-sm bg-[var(--surface)]/50"
  >
            Read Docs
          </Link>
        </div>
      </div>
    </div>;
}
export {
  Home
};
