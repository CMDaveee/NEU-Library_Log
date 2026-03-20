import { useState, useEffect, useRef } from 'react';
import NEULogo from '../common/NEULogo.jsx';
import LiveClock from '../common/LiveClock.jsx';
import ThemeToggle from '../common/ThemeToggle.jsx';
import WelcomePopup from '../auth/WelcomePopup.jsx';
import CampusSelector from './campus/CampusSelector.jsx';

// Existing tabs
import DashboardTab     from './tabs/DashboardTab.jsx';
import VisitsTab        from './tabs/VisitsTab.jsx';
import EnrichTab        from './tabs/EnrichTab.jsx';
import AccessControlTab from './tabs/AccessControlTab.jsx';
import StudentsTab      from './tabs/StudentsTab.jsx';

// New tabs
import AnalyticsTab     from './analytics/AnalyticsTab.jsx';
import ReportsTab       from './reports/ReportsTab.jsx';
import SettingsTab      from './settings/SettingsTab.jsx';
import AnnouncementsTab from './announcements/AnnouncementsTab.jsx';
import RewardsTab       from './rewards/RewardsTab.jsx';
import IssuesTab        from './issues/IssuesTab.jsx';

import { subscribeToVisits, getActiveAnnouncements } from '../../firebase/firestore.js';
import '../../styles/admin.css';

const TABS = [
  { id: 'dashboard',     label: 'Dashboard'     },
  { id: 'visits',        label: 'Visit Log'      },
  { id: 'students',      label: 'Students'       },
  { id: 'access',        label: 'Access Control' },
  { id: 'analytics',     label: 'Analytics'      },
  { id: 'reports',       label: 'Reports'        },
  { id: 'announcements', label: 'Announcements'  },
  { id: 'rewards',       label: 'Rewards'        },
  { id: 'issues',        label: 'Issues'         },
  { id: 'settings',      label: 'Settings'       },
];

const PRIORITY_COLORS = {
  urgent: { bg: 'rgba(192,57,43,0.12)', border: '#C0392B', text: '#C0392B', bar: '#C0392B' },
  high:   { bg: 'rgba(201,168,76,0.1)', border: '#C9A84C', text: '#7A5F20', bar: '#C9A84C' },
  normal: { bg: 'rgba(46,80,144,0.07)', border: '#2E5090', text: '#2E5090', bar: '#2E5090' },
  low:    { bg: 'rgba(138,155,181,0.1)', border: '#8A9BB5', text: '#4A5568', bar: '#8A9BB5' },
};

function AnnouncementBanner({ announcements, onDismiss, onGoToTab }) {
  // Show the highest-priority unread announcement
  const priority = ['urgent','high','normal','low'];
  const top = priority.reduce((found, p) => {
    if (found) return found;
    return announcements.find(a => a.priority === p) ?? null;
  }, null);

  if (!top) return null;

  const c = PRIORITY_COLORS[top.priority] ?? PRIORITY_COLORS.normal;

  return (
    <div style={{
      background: c.bg,
      borderLeft: `4px solid ${c.bar}`,
      borderBottom: `1px solid ${c.border}33`,
      padding: '0.75rem 1.4rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.875rem',
      flexWrap: 'wrap',
      animation: 'fadeIn 0.3s ease',
    }}>
      {/* Priority dot */}
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: c.bar, flexShrink: 0,
        boxShadow: `0 0 0 3px ${c.bar}33`,
        animation: top.priority === 'urgent' ? 'pulse 1.2s ease-in-out infinite' : 'none',
      }} />

      {/* Message */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '0.82rem', color: c.text, fontWeight: top.priority === 'urgent' ? 700 : 600 }}>
          {top.priority === 'urgent' && (
            <span style={{ textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.1em', marginRight: '0.5rem', opacity: 0.75 }}>
              Urgent —
            </span>
          )}
          {top.message}
        </span>
        {announcements.length > 1 && (
          <span style={{ fontSize: '0.72rem', color: 'var(--txt3)', marginLeft: '0.75rem' }}>
            +{announcements.length - 1} more
          </span>
        )}
      </div>

      {/* View all link */}
      <button
        onClick={onGoToTab}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', color: c.text, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.2rem 0', textDecoration: 'underline', textUnderlineOffset: '3px', flexShrink: 0 }}
      >
        View All
      </button>

      {/* Dismiss */}
      <button
        onClick={onDismiss}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt3)', fontSize: '1rem', lineHeight: 1, padding: '0.1rem 0.2rem', flexShrink: 0 }}
        title="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab,    setActiveTab]    = useState('dashboard');
  const [visits,       setVisits]       = useState([]);
  const [showWelcome,  setShowWelcome]  = useState(true);

  // ── Announcement state ──────────────────────────────────────────────────────
  const [announcements,    setAnnouncements]    = useState([]);
  const [unreadCount,      setUnreadCount]      = useState(0);
  const [bannerDismissed,  setBannerDismissed]  = useState(false);
  const seenIdsRef = useRef(new Set()); // tracks IDs seen this session

  // Poll announcements every 30 seconds
  useEffect(() => {
    const fetchAnn = async () => {
      try {
        const active = await getActiveAnnouncements();
        setAnnouncements(active);

        // Count IDs we haven't seen before
        const newOnes = active.filter(a => !seenIdsRef.current.has(a.id));
        if (newOnes.length > 0) {
          setUnreadCount(prev => prev + newOnes.length);
          setBannerDismissed(false); // re-show banner when new ones arrive
          newOnes.forEach(a => seenIdsRef.current.add(a.id));
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchAnn(); // run immediately
    const interval = setInterval(fetchAnn, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Clear unread badge when user opens the Announcements tab
  useEffect(() => {
    if (activeTab === 'announcements') {
      setUnreadCount(0);
      setBannerDismissed(true);
    }
  }, [activeTab]);

  // Live visits subscription
  useEffect(() => {
    const unsub = subscribeToVisits(setVisits);
    return () => unsub();
  }, []);

  const handleGoToAnnouncements = () => {
    setActiveTab('announcements');
  };

  const showBanner = announcements.length > 0 && !bannerDismissed && activeTab !== 'announcements';

  return (
    <div className="aw">
      {showWelcome && (
        <WelcomePopup user={user} onDismiss={() => setShowWelcome(false)} />
      )}

      <header className="topbar">
        <div className="tl">
          <div className="t-logo"><NEULogo size={34} /></div>
          <div className="t-name">New Era University Library Log</div>
          <div className="t-div" />
          <div className="t-mod">Admin Dashboard</div>
        </div>
        <div className="tr">
          <CampusSelector />
          <LiveClock dark />
          <div className="live-badge"><div className="live-dot" />Live</div>
          <div className="t-user">{user.email}</div>
          <ThemeToggle />
          <button className="t-btn" onClick={onLogout}>Sign Out</button>
        </div>
      </header>

      <nav className="anav">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`ntab${activeTab === t.id ? ' on' : ''}`}
            onClick={() => setActiveTab(t.id)}
            style={{ position: 'relative' }}
          >
            {t.label}
            {/* Unread badge — only on Announcements tab */}
            {t.id === 'announcements' && unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: 6,
                right: '50%',
                transform: 'translateX(calc(50% + 18px))',
                background: '#C0392B',
                color: 'white',
                borderRadius: 99,
                fontSize: '0.58rem',
                fontWeight: 800,
                lineHeight: 1,
                padding: '0.18rem 0.38rem',
                minWidth: 16,
                textAlign: 'center',
                fontFamily: "'DM Mono', monospace",
                letterSpacing: 0,
                pointerEvents: 'none',
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Announcement banner — shown on dashboard (and any non-announcements tab) */}
      {showBanner && (
        <AnnouncementBanner
          announcements={announcements}
          onDismiss={() => setBannerDismissed(true)}
          onGoToTab={handleGoToAnnouncements}
        />
      )}

      <main className="abody">
        {activeTab === 'dashboard'     && <DashboardTab     visits={visits} />}
        {activeTab === 'visits'        && <VisitsTab         visits={visits} />}
        {activeTab === 'students'      && <StudentsTab       adminEmail={user.email} />}
        {activeTab === 'access'        && <AccessControlTab  visits={visits} adminEmail={user.email} />}
        {activeTab === 'analytics'     && <AnalyticsTab      visits={visits} />}
        {activeTab === 'reports'       && <ReportsTab        visits={visits} />}
        {activeTab === 'announcements' && <AnnouncementsTab  adminEmail={user.email} />}
        {activeTab === 'rewards'       && <RewardsTab />}
        {activeTab === 'issues'        && <IssuesTab         adminEmail={user.email} />}
        {activeTab === 'settings'      && <SettingsTab       adminEmail={user.email} />}
      </main>
    </div>
  );
}
