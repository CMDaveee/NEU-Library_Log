import { useState, useEffect } from 'react';
import { getAllStudents, setStudentBlocked } from '../../../firebase/firestore.js';
import { validateStudentId, formatStudentId, fmtDate, fmtTime } from '../../../utils/formatters.js';

export default function AccessControlTab({ visits, adminEmail }) {
  const [students,  setStudents]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [newId,     setNewId]     = useState('');
  const [err,       setErr]       = useState('');
  const [blocking,  setBlocking]  = useState({});

  const load = async () => {
    setLoading(true);
    try { setStudents(await getAllStudents()); }
    catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const blocked = students.filter(s => s.isBlocked);
  const uniq    = [...new Set(visits.map(v => v.studentId))].sort();

  const doBlock = async (sid) => {
    setBlocking(p => ({ ...p, [sid]: true }));
    try { await setStudentBlocked(sid, true, adminEmail); await load(); }
    catch (e) { console.error(e); }
    setBlocking(p => { const n = { ...p }; delete n[sid]; return n; });
  };

  const doUnblock = async (sid) => {
    setBlocking(p => ({ ...p, [sid]: true }));
    try { await setStudentBlocked(sid, false, adminEmail); await load(); }
    catch (e) { console.error(e); }
    setBlocking(p => { const n = { ...p }; delete n[sid]; return n; });
  };

  const handleManualBlock = async () => {
    setErr('');
    if (!validateStudentId(newId)) { setErr('Enter a valid 10-digit student ID.'); return; }
    const sid = formatStudentId(newId);
    setNewId('');
    await doBlock(sid);
  };

  const isBlocked = (sid) => students.some(s => s.studentId === sid && s.isBlocked);

  return (
    <div>
      <div className="sec-hdr mb2">
        <div>
          <div className="sec-t">Access Control</div>
          <div className="sec-s">Block or restore library access for student IDs.</div>
        </div>
        <button className="fb fb-g" onClick={load} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="fbar mb3" style={{ alignItems: 'flex-end' }}>
        <div className="fg" style={{ maxWidth: 260 }}>
          <div className="fl">Block a Student ID</div>
          <input
            className="fi"
            placeholder="XX-XXXXX-XXX"
            value={newId}
            onChange={e => { setNewId(e.target.value); setErr(''); }}
            onKeyDown={e => e.key === 'Enter' && handleManualBlock()}
          />
          {err && <div style={{ fontSize: '.7rem', color: 'var(--red)', marginTop: '.2rem' }}>{err}</div>}
        </div>
        <button className="fb" style={{ background: 'var(--red)', color: 'white' }} onClick={handleManualBlock}>
          Block ID
        </button>
      </div>

      {blocked.length > 0 && (
        <div className="tc mb3">
          <div className="thbar">
            <div className="thtitle">Blocked Students</div>
            <div className="cpill">{blocked.length} blocked</div>
          </div>
          <div className="tscroll">
            <table>
              <thead><tr><th>Student ID</th><th>Name</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {blocked.map(s => (
                  <tr key={s.studentId}>
                    <td><span className="mono">{s.studentId}</span></td>
                    <td>{s.fullName ?? '-'}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--txt3)' }}>{s.blockedReason ?? '-'}</td>
                    <td><span className="bdg bdg-blk">Blocked</span></td>
                    <td>
                      <button className="ab ab-ok" onClick={() => doUnblock(s.studentId)} disabled={blocking[s.studentId]}>
                        {blocking[s.studentId] ? '...' : 'Restore Access'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="tc">
        <div className="thbar">
          <div className="thtitle">All Registered Students</div>
          <div className="cpill">{uniq.length} students</div>
        </div>
        <div className="tscroll">
          {loading ? (
            <div className="empty">Loading...</div>
          ) : uniq.length === 0 ? (
            <div className="empty">No student records found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Student ID</th><th>Last Visit</th><th>Access Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {uniq.map(sid => {
                  const blk       = isBlocked(sid);
                  const lastVisit = visits.find(v => v.studentId === sid);
                  return (
                    <tr key={sid}>
                      <td><span className="mono">{sid}</span></td>
                      <td>{lastVisit ? `${fmtDate(lastVisit.checkInTime)} ${fmtTime(lastVisit.checkInTime)}` : '-'}</td>
                      <td><span className={`bdg ${blk ? 'bdg-blk' : 'bdg-in'}`}>{blk ? 'Blocked' : 'Allowed'}</span></td>
                      <td>
                        {blk ? (
                          <button className="ab ab-ok" onClick={() => doUnblock(sid)} disabled={blocking[sid]}>
                            {blocking[sid] ? '...' : 'Restore'}
                          </button>
                        ) : (
                          <button className="ab ab-blk" onClick={() => doBlock(sid)} disabled={blocking[sid]}>
                            {blocking[sid] ? '...' : 'Block'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
