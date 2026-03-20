import { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { CampusProvider } from './context/CampusContext.jsx';
import KioskPage       from './components/kiosk/KioskPage.jsx';
import AuthPage        from './components/auth/AuthPage.jsx';
import AccessDenied    from './components/auth/AccessDenied.jsx';
import AdminDashboard  from './components/admin/AdminDashboard.jsx';
import GoogleSignUp    from './components/auth/GoogleSignUp.jsx';
import CompleteProfile from './components/auth/CompleteProfile.jsx';
import { onAuthChange } from './firebase/auth.js';
import './styles/globals.css';

/**
 * Views:
 *   kiosk          — public ID-tap landing
 *   auth           — admin Google sign-in
 *   admin          — admin dashboard
 *   denied         — non-admin rejection
 *   student-signup — student Google sign-up
 *   complete-profile — new student profile form
 */
export default function App() {
  const [view,        setView]        = useState('kiosk');
  const [user,        setUser]        = useState(null);
  const [googleUser,  setGoogleUser]  = useState(null); // temp hold during profile completion

  // Restore admin session on page reload
  useEffect(() => {
    const unsub = onAuthChange(authUser => {
      if (!authUser) return;
      if (authUser.isAdmin) {
        setUser(authUser);
        setView('admin');
      }
    });
    return () => unsub();
  }, []);

  const handleAdminLogin = (u) => {
    setUser(u);
    setView(u.isAdmin ? 'admin' : 'denied');
  };

  const handleLogout = () => {
    setUser(null);
    setView('kiosk');
  };

  // Student Google sign-up flows
  const handleStudentExisting = (u) => {
    // Student already has a profile — just return to kiosk (they use ID tap)
    setView('kiosk');
  };

  const handleStudentNew = (u) => {
    setGoogleUser(u);
    setView('complete-profile');
  };

  const handleProfileComplete = (studentId) => {
    setGoogleUser(null);
    setView('kiosk');
  };

  return (
    <CampusProvider>
    <ThemeProvider>
      {view === 'kiosk' && (
        <KioskPage
          onAdminClick={() => setView('auth')}
          onStudentSignUp={() => setView('student-signup')}
        />
      )}
      {view === 'auth' && (
        <AuthPage onLogin={handleAdminLogin} onBack={() => setView('kiosk')} />
      )}
      {view === 'admin' && user && (
        <AdminDashboard user={user} onLogout={handleLogout} />
      )}
      {view === 'denied' && (
        <AccessDenied onBack={handleLogout} />
      )}
      {view === 'student-signup' && (
        <GoogleSignUp
          onExisting={handleStudentExisting}
          onNew={handleStudentNew}
          onBack={() => setView('kiosk')}
        />
      )}
      {view === 'complete-profile' && googleUser && (
        <CompleteProfile
          googleUser={googleUser}
          onComplete={handleProfileComplete}
          onBack={() => setView('kiosk')}
        />
      )}
    </ThemeProvider>
    </CampusProvider>
  );
}
