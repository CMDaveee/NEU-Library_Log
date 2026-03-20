import { useState, useRef, useEffect, useCallback } from 'react';
import NEULogo from '../common/NEULogo.jsx';
import LiveClock from '../common/LiveClock.jsx';
import CheckInPopup from './CheckInPopup.jsx';
import BlockedPopup from './BlockedPopup.jsx';
import PurposePopup from './PurposePopup.jsx';
import RegistrationPage from './RegistrationPage.jsx';
import { getStudentAndActiveVisit, checkIn, checkOut } from '../../firebase/firestore.js';
import libraryBg from '../../assets/library-building.jpg';
import '../../styles/kiosk.css';

// Auto-format digits as user types → XX-XXXXX-XXX
function autoFormat(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 2)  return digits;
  if (digits.length <= 7)  return `${digits.slice(0,2)}-${digits.slice(2)}`;
  return `${digits.slice(0,2)}-${digits.slice(2,7)}-${digits.slice(7)}`;
}

function isComplete(formatted) {
  return formatted.replace(/\D/g, '').length === 10;
}

export default function KioskPage({ onAdminClick, onStudentSignUp }) {
  const [inp,     setInp]     = useState('');
  const [err,     setErr]     = useState('');
  const [loading, setLoading] = useState(false);
  const [popup,   setPopup]   = useState(null);
  const [regId,   setRegId]   = useState(null);

  // NEW: pending tap data waiting for purpose selection
  const [pendingTap, setPendingTap] = useState(null); // { sid, action, activeVisit }

  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleInput = useCallback(e => {
    setInp(autoFormat(e.target.value));
    setErr('');
  }, []);

  const handleTap = useCallback(async () => {
    if (!isComplete(inp)) {
      setErr('Please enter a complete 10-digit student ID.');
      return;
    }

    setLoading(true);
    setErr('');

    try {
      const { student, activeVisit } = await getStudentAndActiveVisit(inp);

      if (!student) {
        setRegId(inp);
        setInp('');
        setLoading(false);
        return;
      }

      if (student.isBlocked) {
        setPopup({ type: 'blocked', sid: inp });
        setInp('');
        setLoading(false);
        return;
      }

      // NEW: determine action then show purpose popup before committing to Firestore
      const action = activeVisit ? 'check-out' : 'check-in';
      setPendingTap({ sid: inp, action, activeVisit });
      setInp('');
    } catch (e) {
      console.error(e);
      setErr('An error occurred. Please try again.');
    }

    setLoading(false);
  }, [inp]);

  // NEW: called when student selects purpose (or skipped for check-out)
  const handlePurposeSelect = useCallback(async ({ purpose, purposeOther }) => {
    if (!pendingTap) return;
    const { sid, action, activeVisit } = pendingTap;
    setPendingTap(null);

    try {
      if (action === 'check-in') {
        await checkIn(sid, { purpose, purposeOther });
      } else {
        await checkOut(activeVisit.id);
      }
      setPopup({ type: 'ok', action, sid });
      setTimeout(() => { setPopup(null); inputRef.current?.focus(); }, 3000);
    } catch (e) {
      console.error(e);
      setErr('An error occurred. Please try again.');
      inputRef.current?.focus();
    }
  }, [pendingTap]);

  const dismissPopup = useCallback(() => {
    setPopup(null);
    inputRef.current?.focus();
  }, []);

  const handleRegistrationComplete = useCallback(async (sid) => {
    setRegId(null);
    // After registration, show purpose popup before check-in
    setPendingTap({ sid, action: 'check-in', activeVisit: null });
  }, []);

  if (regId) {
    return (
      <RegistrationPage
        studentId={regId}
        onComplete={handleRegistrationComplete}
        onCancel={() => { setRegId(null); setTimeout(() => inputRef.current?.focus(), 50); }}
      />
    );
  }

  const ready = isComplete(inp);

  return (
    <div className="landing">
      <div className="l-bg">
        <div className="l-bg-div" style={{ backgroundImage: `url(${libraryBg})` }} />
        <div className="l-overlay" />
        <div className="l-caption">
          <div className="l-eyebrow">New Era University — Quezon City</div>
          <div className="l-title">University<br />Library</div>
          <div className="l-sub">
            Automated visitor management system. Tap your student ID card
            at the kiosk to record your library visit.
          </div>
        </div>
      </div>

      <div className="l-panel">
        <div className="l-clock"><LiveClock /></div>
        <div className="l-logo-ring"><NEULogo size={68} /></div>
        <div className="l-title2">Library Log System</div>
        <div className="l-sub2">Student ID Tap — Check In / Check Out</div>

        <div style={{ width: '100%' }}>
          <label className="f-lbl" htmlFor="student-id">Student ID Number</label>
          <input
            id="student-id"
            ref={inputRef}
            className={`f-inp${err ? ' err' : ''}`}
            type="text"
            placeholder="XX-XXXXX-XXX"
            value={inp}
            onChange={handleInput}
            onKeyDown={e => e.key === 'Enter' && ready && !loading && handleTap()}
            maxLength={12}
            autoComplete="off"
          />
          {err && <div className="f-err">{err}</div>}
          <button
            className="tap-btn"
            onClick={handleTap}
            disabled={loading || !ready}
          >
            {loading ? <><SpinnerInline /> Processing...</> : 'Tap ID'}
          </button>
          <div className="f-status">
            {ready
              ? 'ID complete — press Tap ID or hit Enter'
              : 'System ready — enter your student ID number'}
          </div>
        </div>

        <button className="admin-link" onClick={onAdminClick}>
          Administrator Access
        </button>

        {onStudentSignUp && (
          <button
            className="admin-link"
            style={{ bottom: '3.5rem', color: 'var(--acc)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={onStudentSignUp}
          >
            <svg width="14" height="14" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2a10.3 10.3 0 0 0-.16-1.84H9v3.48h4.84A4.14 4.14 0 0 1 12.08 13v2.25h2.86A8.64 8.64 0 0 0 17.64 9.2z"/>
              <path fill="#34A853" d="M9 18a8.46 8.46 0 0 0 5.87-2.15l-2.86-2.25a5.34 5.34 0 0 1-7.97-2.8H1.07v2.33A9 9 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M4.04 10.8a5.38 5.38 0 0 1 0-3.6V4.87H1.07A9 9 0 0 0 0 9a9 9 0 0 0 1.07 4.13l2.97-2.33z"/>
              <path fill="#EA4335" d="M9 3.58a4.85 4.85 0 0 1 3.44 1.35l2.58-2.58A8.62 8.62 0 0 0 9 0 9 9 0 0 0 1.07 4.87l2.97 2.33A5.37 5.37 0 0 1 9 3.58z"/>
            </svg>
            Sign Up with Google
          </button>
        )}
      </div>

      {/* NEW: Purpose popup shown after tap, before welcome */}
      {pendingTap && (
        <PurposePopup
          action={pendingTap.action}
          sid={pendingTap.sid}
          onSelect={handlePurposeSelect}
        />
      )}

      {popup?.type === 'blocked' && <BlockedPopup sid={popup.sid} onDismiss={dismissPopup} />}
      {popup?.type === 'ok'      && <CheckInPopup action={popup.action} sid={popup.sid} onDismiss={dismissPopup} />}
    </div>
  );
}

function SpinnerInline() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: 'spin 0.7s linear infinite', marginRight: '0.35rem', verticalAlign: 'middle' }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  );
}
