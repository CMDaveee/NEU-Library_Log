import '../../styles/auth.css';

export default function AccessDenied({ onBack }) {
  return (
    <div className="denied-wrap">
      <div className="auth-grid" />
      <div className="auth-glow" />

      <div className="denied-card">
        <div className="denied-icon">
          <svg
            width="22" height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--red)"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        </div>
        <div className="denied-title">Access Denied</div>
        <div className="denied-sub">
          Your account does not have administrator privileges. Only authorized
          NEU Library administrators may access this system.
        </div>
        <button className="denied-btn" onClick={onBack}>
          Return to Kiosk
        </button>
      </div>
    </div>
  );
}
