export default function BlockedPopup({ sid, onDismiss }) {
  return (
    <div className="po" onClick={onDismiss}>
      <div className="bc" onClick={e => e.stopPropagation()}>
        <div style={{ marginBottom: '1rem' }}>
          <svg
            width="38" height="38"
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
        <div className="bc-title">Access Restricted</div>
        <div className="bc-sub">
          Student ID <strong>{sid}</strong> has been restricted from library
          access. Please proceed to the library counter for assistance.
        </div>
        <button className="bc-close" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
