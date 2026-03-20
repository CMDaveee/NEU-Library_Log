export default function CheckInPopup({ action, sid, onDismiss }) {
  const isCheckIn = action === 'check-in';

  return (
    <div className="po" onClick={onDismiss}>
      <div className="pc" onClick={e => e.stopPropagation()}>
        <div className="pc-icon">
          {isCheckIn ? (
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          )}
        </div>
        <div className="pc-title">
          {isCheckIn ? 'Welcome to NEU Library' : 'Thank You for Visiting'}
        </div>
        <div className="pc-id">{sid}</div>
        <div className="pc-tag">
          {isCheckIn ? 'Check-In Recorded' : 'Check-Out Recorded'}
        </div>
        <div className="pc-prog">
          <div className="pc-fill" />
        </div>
      </div>
    </div>
  );
}
