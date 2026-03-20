import { useState } from 'react';
import NEULogo from '../common/NEULogo.jsx';
import { signInWithGoogle } from '../../firebase/auth.js';
import '../../styles/auth.css';

export default function AuthPage({ onLogin, onBack }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const user = await signInWithGoogle();
      if (!user.email.endsWith('@neu.edu.ph')) {
        setError('Only @neu.edu.ph accounts are permitted.');
        setLoading(false);
        return;
      }
      onLogin(user);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled.');
      } else {
        setError('Sign-in failed. Please try again.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="auth">
      <div className="auth-grid" />
      <div className="auth-glow" />
      <div className="auth-card">
        <div className="auth-logo"><NEULogo size={62} /></div>
        <div className="auth-title">Administrator Login</div>
        <div className="auth-sub">New Era University Library Log</div>

        <button className="g-btn" onClick={handleGoogleSignIn} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2a10.3 10.3 0 0 0-.16-1.84H9v3.48h4.84A4.14 4.14 0 0 1 12.08 13v2.25h2.86A8.64 8.64 0 0 0 17.64 9.2z"/>
            <path fill="#34A853" d="M9 18a8.46 8.46 0 0 0 5.87-2.15l-2.86-2.25a5.34 5.34 0 0 1-7.97-2.8H1.07v2.33A9 9 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M4.04 10.8a5.38 5.38 0 0 1 0-3.6V4.87H1.07A9 9 0 0 0 0 9a9 9 0 0 0 1.07 4.13l2.97-2.33z"/>
            <path fill="#EA4335" d="M9 3.58a4.85 4.85 0 0 1 3.44 1.35l2.58-2.58A8.62 8.62 0 0 0 9 0 9 9 0 0 0 1.07 4.87l2.97 2.33A5.37 5.37 0 0 1 9 3.58z"/>
          </svg>
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>

        {error && (
          <div style={{ fontSize: '0.78rem', color: 'var(--red)', marginTop: '0.875rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <p className="auth-note">
          Access is restricted to authorized New Era University administrator accounts only.
        </p>
        <button className="auth-back" onClick={onBack}>Return to Kiosk</button>
      </div>
    </div>
  );
}
