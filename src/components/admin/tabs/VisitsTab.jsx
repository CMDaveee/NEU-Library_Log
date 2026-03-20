import { useState, useEffect } from 'react';
import { fmtDate, fmtTime, duration } from '../../../utils/formatters.js';

export default function VisitsTab({ visits }) {
  const [from,     setFrom]     = useState('');
  const [to,       setTo]       = useState('');
  const [query,    setQuery]    = useState('');
  const [filtered, setFiltered] = useState(visits);

  useEffect(() => { setFiltered(visits); }, [visits]);

  const applyFilters = () => {
    let f = [...visits];
    if (from) f = f.filter(v => new Date(v.checkInTime) >= new Date(from));
    if (to) { const end = new Date(to); end.setHours(23,59,59); f = f.filter(v => new Date(v.checkInTime) <= end); }
    if (query) { const d = query.replace(/\D/g,''); f = f.filter(v => v.studentId.replace(/-/g,'').includes(d)); }
    setFiltered(f);
  };

  const clearFilters = () => { setFrom(''); setTo(''); setQuery(''); setFiltered(visits); };

  return (
    <div>
      <div className="sec-hdr mb2">
        <div>
          <div className="sec-t">Visit Log</div>
          <div className="sec-s">Read-only. Visit records cannot be deleted.</div>
        </div>
      </div>

      <div className="fbar">
        <div className="fg"><div className="fl">From</div>
          <input className="fi" type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div className="fg"><div className="fl">To</div>
          <input className="fi" type="date" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <div className="fg"><div className="fl">Student ID</div>
          <input className="fi" placeholder="Search..." value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyFilters()} />
        </div>
        <button className="fb fb-p" onClick={applyFilters}>Apply</button>
        <button className="fb fb-g" onClick={clearFilters}>Clear</button>
      </div>

      <div className="tc">
        <div className="thbar">
          <div className="thtitle">Visit Records</div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div className="live-badge"><div className="live-dot" />Live</div>
            <div className="cpill">{filtered.length} records</div>
          </div>
        </div>
        <div className="tscroll">
          {filtered.length === 0 ? (
            <div className="empty">No records match your filters.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => (
                  <tr key={v.visitId}>
                    <td><span className="mono">{v.studentId}</span></td>
                    <td>{fmtDate(v.checkInTime)} {fmtTime(v.checkInTime)}</td>
                    <td>{v.checkOutTime ? `${fmtDate(v.checkOutTime)} ${fmtTime(v.checkOutTime)}` : '-'}</td>
                    <td>{duration(v.checkInTime, v.checkOutTime)}</td>
                    <td><span className={`bdg ${v.isActive ? 'bdg-in' : 'bdg-out'}`}>{v.isActive ? 'Active' : 'Completed'}</span></td>
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
