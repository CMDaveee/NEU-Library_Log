import { useState, useEffect } from 'react';
import { getSettings, saveSettings, autoCheckoutAll } from '../../../firebase/firestore.js';

export default function SettingsTab({ adminEmail }) {
  const [enabled,    setEnabled]    = useState(true);
  const [time,       setTime]       = useState('23:59');
  const [saving,     setSaving]     = useState(false);
  const [running,    setRunning]    = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    getSettings('autoCheckout').then(s => {
      if (s) { setEnabled(s.enabled ?? true); setTime(s.time ?? '23:59'); }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    try {
      await saveSettings('autoCheckout', { enabled, time }, adminEmail);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleRunNow = async () => {
    if (!window.confirm('Run auto check-out now? All active sessions before the configured time will be closed.')) return;
    setRunning(true); setResult(null);
    try {
      const count = await autoCheckoutAll(time);
      setResult(`${count} session${count !== 1 ? 's' : ''} checked out.`);
    } catch (e) {
      console.error(e);
      setResult('Error running auto check-out.');
    }
    setRunning(false);
  };

  return (
    <div>
      <div className="sec-hdr mb2">
        <div>
          <div className="sec-t">Settings</div>
          <div className="sec-s">Configure system behavior and scheduled operations.</div>
        </div>
      </div>

      {/* Auto check-out */}
      <div className="tc" style={{ maxWidth: 560, marginBottom: '1.5rem' }}>
        <div className="thbar"><div className="thtitle">Auto Check-Out</div></div>
        <div style={{ padding: '1.5rem' }}>
          {loading ? <div className="empty">Loading settings...</div> : (
            <>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', userSelect: 'none' }}>
                  <div
                    onClick={() => setEnabled(e => !e)}
                    style={{
                      width: 44, height: 24, borderRadius: 99, cursor: 'pointer',
                      background: enabled ? 'var(--navy)' : 'var(--bdr)',
                      position: 'relative', transition: 'background .2s', flexShrink: 0,
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: 50, background: 'white',
                      position: 'absolute', top: 3, left: enabled ? 23 : 3,
                      transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                    }} />
                  </div>
                  <span style={{ fontSize: '0.9rem', color: 'var(--txt)', fontWeight: 600 }}>
                    Enable auto check-out at midnight
                  </span>
                </label>
                <div style={{ fontSize: '0.78rem', color: 'var(--txt3)', marginTop: '0.35rem', paddingLeft: '3.5rem' }}>
                  Automatically closes all active sessions at the configured time. Students who forgot to tap out will be checked out.
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ marginBottom: '0.4rem', display: 'block' }}>Check-Out Time (24-hour)</label>
                <input
                  type="time"
                  className="fi"
                  style={{ maxWidth: 140 }}
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  disabled={!enabled}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button className="fb fb-p" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
                <button className="fb fb-g" onClick={handleRunNow} disabled={running || !enabled}>
                  {running ? 'Running...' : 'Run Now'}
                </button>
                {saved && <span style={{ fontSize: '0.78rem', color: 'var(--grn)' }}>Settings saved.</span>}
                {result && <span style={{ fontSize: '0.78rem', color: 'var(--txt2)' }}>{result}</span>}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Campus seed utility */}
      <div className="tc" style={{ maxWidth: 560 }}>
        <div className="thbar"><div className="thtitle">Campus Configuration</div></div>
        <div style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--txt2)', marginBottom: '1rem', lineHeight: 1.65 }}>
            Multi-campus support is available. Seed the default campus or add new campuses from the Firestore console under the <code>campuses</code> collection.
          </p>
          <div className="callout-body" style={{ background: 'var(--surf2)', border: '1px solid var(--bdr)', borderRadius: 6, padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--txt2)', fontFamily: "'DM Mono', monospace" }}>
            {'{'}<br/>
            &nbsp;&nbsp;id: "qc-main",<br/>
            &nbsp;&nbsp;name: "Quezon City Main Campus",<br/>
            &nbsp;&nbsp;address: "9 Central Ave, Quezon City",<br/>
            &nbsp;&nbsp;timezone: "Asia/Manila",<br/>
            &nbsp;&nbsp;active: true<br/>
            {'}'}
          </div>
        </div>
      </div>
    </div>
  );
}
