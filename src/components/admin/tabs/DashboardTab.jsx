import { fmtTime } from '../../../utils/formatters.js';

function StatCard({ label, value, hint }) {
  return (
    <div className="sc">
      <div className="sl">{label}</div>
      <div className="sv">{value}</div>
      <div className="sh">{hint}</div>
    </div>
  );
}

function BarChart({ visits }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); d.setHours(0,0,0,0);
    const next = new Date(d); next.setDate(next.getDate() + 1);
    return {
      lbl:   ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()],
      count: visits.filter(v => new Date(v.checkInTime) >= d && new Date(v.checkInTime) < next).length,
    };
  });
  const max = Math.max(...days.map(d => d.count), 1);
  return (
    <div className="barchart">
      {days.map(d => (
        <div className="bcol" key={d.lbl}>
          <div className="bval">{d.count || ''}</div>
          <div className="bbar" style={{ height: `${(d.count / max) * 70}px` }} />
          <div className="blbl">{d.lbl}</div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardTab({ visits }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const todayVisits = visits.filter(v => new Date(v.checkInTime) >= today);
  const active      = visits.filter(v => v.isActive);
  const completed   = visits.filter(v => !v.isActive);
  const avgDuration = (() => {
    const done = visits.filter(v => v.checkOutTime);
    if (!done.length) return '-';
    const avg = done.reduce((sum, v) => sum + (new Date(v.checkOutTime) - new Date(v.checkInTime)), 0) / done.length;
    const m = Math.round(avg / 60000);
    return m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60}m`;
  })();

  return (
    <div>
      <div className="sgrid">
        <StatCard label="Today"         value={todayVisits.length} hint="Check-ins today"     />
        <StatCard label="Active Now"    value={active.length}      hint="Currently inside"    />
        <StatCard label="Completed"     value={completed.length}   hint="Checked out"         />
        <StatCard label="Total Records" value={visits.length}      hint="All time"            />
        <StatCard label="Avg. Duration" value={avgDuration}        hint="Per completed visit" />
      </div>

      <div className="tc mb3">
        <div className="thbar"><div className="thtitle">Visits — Last 7 Days</div></div>
        <div style={{ padding: '1.4rem' }}><BarChart visits={visits} /></div>
      </div>

      <div className="tc">
        <div className="thbar">
          <div className="thtitle">Live Active Sessions</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="live-badge"><div className="live-dot" />Live</div>
            <div className="cpill">{active.length} active</div>
          </div>
        </div>
        <div className="tscroll">
          {active.length === 0 ? (
            <div className="empty">No active sessions at this time.</div>
          ) : (
            <table>
              <thead><tr><th>Student ID</th><th>Check-In Time</th><th>Status</th></tr></thead>
              <tbody>
                {active.map(v => (
                  <tr key={v.visitId}>
                    <td><span className="mono">{v.studentId}</span></td>
                    <td>{fmtTime(v.checkInTime)}</td>
                    <td><span className="bdg bdg-in">Active</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
