import { useState, useEffect } from 'react';
import { createAnnouncement, getActiveAnnouncements, deleteAnnouncement, getMonitors } from '../../../firebase/firestore.js';

const PRIORITIES = [
  { value: 'low',    label: 'Low',    color: 'var(--txt3)' },
  { value: 'normal', label: 'Normal', color: 'var(--steel)' },
  { value: 'high',   label: 'High',   color: 'var(--gold, #C9A84C)' },
  { value: 'urgent', label: 'Urgent', color: 'var(--red)' },
];

const EXPIRY_OPTIONS = [
  { value: 30,    label: '30 minutes' },
  { value: 60,    label: '1 hour' },
  { value: 120,   label: '2 hours' },
  { value: 480,   label: '8 hours' },
  { value: 1440,  label: '24 hours' },
];

function priorityColor(p) {
  return PRIORITIES.find(x => x.value === p)?.color ?? 'var(--txt2)';
}

function timeLeft(expiresAt) {
  if (!expiresAt) return '';
  const diff = new Date(expiresAt) - new Date();
  if (diff <= 0) return 'Expired';
  const m = Math.ceil(diff / 60000);
  if (m < 60) return `${m}m left`;
  return `${Math.floor(m/60)}h ${m%60}m left`;
}

export default function AnnouncementsTab({ adminEmail }) {
  const [announcements, setAnnouncements] = useState([]);
  const [monitors,      setMonitors]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [sending,       setSending]       = useState(false);

  const [message,   setMessage]   = useState('');
  const [target,    setTarget]    = useState('all');
  const [monitorId, setMonitorId] = useState('');
  const [priority,  setPriority]  = useState('normal');
  const [expiryMin, setExpiryMin] = useState(60);
  const [err,       setErr]       = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [ann, mon] = await Promise.all([getActiveAnnouncements(), getMonitors()]);
      setAnnouncements(ann);
      setMonitors(mon);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSend = async () => {
    if (!message.trim()) { setErr('Message is required.'); return; }
    if (target === 'specific' && !monitorId) { setErr('Please select a monitor.'); return; }
    setErr(''); setSending(true);

    const expiresAt = new Date(Date.now() + expiryMin * 60000);

    try {
      await createAnnouncement({
        message:   message.trim(),
        target,
        monitorId: target === 'specific' ? monitorId : null,
        priority,
        expiresAt,
      }, adminEmail);
      setMessage(''); setTarget('all'); setMonitorId(''); setPriority('normal');
      await load();
    } catch (e) {
      console.error(e);
      setErr('Failed to send announcement.');
    }
    setSending(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteAnnouncement(id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (e) { console.error(e); }
  };

  return (
    <div>
      <div className="sec-hdr mb2">
        <div>
          <div className="sec-t">Announcements</div>
          <div className="sec-s">Send popup messages to library monitors.</div>
        </div>
        <button className="fb fb-g" onClick={load} disabled={loading}>Refresh</button>
      </div>

      {/* Compose form */}
      <div className="tc" style={{ marginBottom: '1.5rem', maxWidth: 620 }}>
        <div className="thbar"><div className="thtitle">New Announcement</div></div>
        <div style={{ padding: '1.5rem' }}>
          <div className="form-row" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Message</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="e.g. Library closes at 5PM today. Please wrap up."
              value={message}
              onChange={e => { setMessage(e.target.value); setErr(''); }}
              style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '0.875rem' }}
              maxLength={300}
            />
            <div style={{ fontSize: '0.68rem', color: 'var(--txt3)', marginTop: '0.2rem' }}>{message.length}/300</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.875rem', marginBottom: '1.25rem' }}>
            <div>
              <label className="form-label">Target</label>
              <select className="fs" value={target} onChange={e => setTarget(e.target.value)}>
                <option value="all">All Monitors</option>
                <option value="specific">Specific Monitor</option>
              </select>
            </div>
            {target === 'specific' && (
              <div>
                <label className="form-label">Monitor</label>
                <select className="fs" value={monitorId} onChange={e => setMonitorId(e.target.value)}>
                  <option value="">Select...</option>
                  {monitors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="form-label">Priority</label>
              <select className="fs" value={priority} onChange={e => setPriority(e.target.value)}>
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Expires In</label>
              <select className="fs" value={expiryMin} onChange={e => setExpiryMin(Number(e.target.value))}>
                {EXPIRY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {err && <div className="f-err" style={{ marginBottom: '0.75rem' }}>{err}</div>}
          <button className="fb fb-p" onClick={handleSend} disabled={sending || !message.trim()}>
            {sending ? 'Sending...' : 'Send Announcement'}
          </button>
        </div>
      </div>

      {/* Active announcements */}
      <div className="tc">
        <div className="thbar">
          <div className="thtitle">Active Announcements</div>
          <div className="cpill">{announcements.length} active</div>
        </div>
        {loading ? (
          <div className="empty">Loading...</div>
        ) : announcements.length === 0 ? (
          <div className="empty">No active announcements.</div>
        ) : (
          <div style={{ padding: '1rem' }}>
            {announcements.map(a => (
              <div key={a.id} style={{
                background: 'var(--surf2)', border: '1.5px solid var(--bdr)',
                borderLeft: `4px solid ${priorityColor(a.priority)}`,
                borderRadius: 8, padding: '1rem 1.25rem', marginBottom: '0.75rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--txt)', marginBottom: '0.25rem' }}>{a.message}</div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.72rem', color: 'var(--txt3)' }}>
                      <span>Target: {a.target === 'all' ? 'All Monitors' : (a.monitorId ?? 'Specific')}</span>
                      <span style={{ color: priorityColor(a.priority), fontWeight: 600, textTransform: 'capitalize' }}>{a.priority}</span>
                      <span>{timeLeft(a.expiresAt)}</span>
                      <span>By: {a.createdBy?.split('@')[0]}</span>
                    </div>
                  </div>
                  <button className="ab ab-blk" onClick={() => handleDelete(a.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
