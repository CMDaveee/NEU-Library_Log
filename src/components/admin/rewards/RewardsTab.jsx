import { useState, useEffect, useMemo } from 'react';
import { getAllRewards } from '../../../firebase/firestore.js';
import { getAllStudents } from '../../../firebase/firestore.js';

const LEVEL_COLORS = {
  bronze:   '#CD7F32',
  silver:   '#A0A0A0',
  gold:     '#C9A84C',
  platinum: '#8899AA',
};

const LEVEL_NEXT = { bronze: 500, silver: 1000, gold: 2500, platinum: Infinity };

function LevelBadge({ level }) {
  const color = LEVEL_COLORS[level] ?? '#8A9BB5';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.18rem 0.55rem', borderRadius: 99, background: `${color}22`, border: `1.5px solid ${color}`, fontSize: '0.68rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {level}
    </span>
  );
}

function ProgressBar({ points, level }) {
  const next  = LEVEL_NEXT[level] ?? Infinity;
  const prev  = { bronze: 0, silver: 500, gold: 1000, platinum: 2500 }[level] ?? 0;
  const pct   = next === Infinity ? 100 : Math.min(100, Math.round(((points - prev) / (next - prev)) * 100));
  const color = LEVEL_COLORS[level] ?? '#8A9BB5';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: 6, background: 'var(--bdr)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width .4s' }} />
      </div>
      {next !== Infinity && <span style={{ fontSize: '0.65rem', color: 'var(--txt3)', whiteSpace: 'nowrap' }}>{next - points} to next</span>}
    </div>
  );
}

export default function RewardsTab() {
  const [rewards,  setRewards]  = useState([]);
  const [students, setStudents] = useState({});
  const [search,   setSearch]   = useState('');
  const [levelF,   setLevelF]   = useState('all');
  const [loading,  setLoading]  = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [rw, st] = await Promise.all([getAllRewards(), getAllStudents()]);
      setRewards(rw);
      const map = {};
      st.forEach(s => { map[s.studentId] = s; });
      setStudents(map);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rewards.filter(r => {
      const st = students[r.studentId];
      const matchSearch = !q || r.studentId?.toLowerCase().includes(q) || st?.fullName?.toLowerCase().includes(q);
      const matchLevel  = levelF === 'all' || r.level === levelF;
      return matchSearch && matchLevel;
    });
  }, [rewards, students, search, levelF]);

  const stats = useMemo(() => ({
    total:    rewards.length,
    bronze:   rewards.filter(r => r.level === 'bronze').length,
    silver:   rewards.filter(r => r.level === 'silver').length,
    gold:     rewards.filter(r => r.level === 'gold').length,
    platinum: rewards.filter(r => r.level === 'platinum').length,
  }), [rewards]);

  return (
    <div>
      {/* Rewards info modal */}
      {showInfo && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:500,backdropFilter:'blur(4px)' }} onClick={() => setShowInfo(false)}>
          <div style={{ background:'var(--surf)',borderRadius:12,maxWidth:480,width:'90%',maxHeight:'80vh',overflowY:'auto',boxShadow:'0 16px 40px rgba(0,0,0,.3)',animation:'slideUp .3s ease' }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'1.1rem 1.5rem',borderBottom:'1px solid var(--bdr)' }}>
              <div style={{ fontFamily:"'DM Serif Display',serif",fontSize:'1.1rem',color:'var(--navy)' }}>Rewards System — How It Works</div>
              <button onClick={() => setShowInfo(false)} style={{ background:'none',border:'none',fontSize:'1.4rem',cursor:'pointer',color:'var(--txt3)',lineHeight:1 }}>×</button>
            </div>
            <div style={{ padding:'1.5rem',fontSize:'0.875rem',color:'var(--txt2)',lineHeight:1.7 }}>
              <p>This system tracks student engagement automatically. <strong style={{color:'var(--txt)'}}>Students are not aware of this system.</strong></p>
              <div style={{ marginTop:'1.1rem' }}>
                <div style={{ fontWeight:700,color:'var(--navy)',marginBottom:'0.4rem' }}>Points System</div>
                <ul style={{ paddingLeft:'1.25rem',display:'flex',flexDirection:'column',gap:'0.2rem' }}>
                  <li>Check-in: +10 points</li>
                  <li>Check-out: +5 points</li>
                  <li>Purpose bonus: +5 to +15 points depending on activity</li>
                </ul>
              </div>
              <div style={{ marginTop:'1.1rem' }}>
                <div style={{ fontWeight:700,color:'var(--navy)',marginBottom:'0.4rem' }}>Levels</div>
                <ul style={{ paddingLeft:'1.25rem',display:'flex',flexDirection:'column',gap:'0.2rem' }}>
                  <li><strong>Bronze</strong> — 0 pts (base)</li>
                  <li><strong>Silver</strong> — 500 pts</li>
                  <li><strong>Gold</strong> — 1,000 pts</li>
                  <li><strong>Platinum</strong> — 2,500 pts</li>
                </ul>
              </div>
              <div style={{ marginTop:'1.1rem' }}>
                <div style={{ fontWeight:700,color:'var(--navy)',marginBottom:'0.4rem' }}>Auto-Earned Badges</div>
                <ul style={{ paddingLeft:'1.25rem',display:'flex',flexDirection:'column',gap:'0.2rem' }}>
                  <li><strong>Early Bird</strong> — visited before 8 AM multiple times</li>
                  <li><strong>First Steps</strong> — 10 library visits</li>
                  <li><strong>Regular</strong> — 50 library visits</li>
                  <li><strong>Centurion</strong> — 100 library visits</li>
                </ul>
              </div>
              <div style={{ marginTop:'1.25rem',paddingTop:'0.875rem',borderTop:'1px solid var(--bdr)',fontSize:'0.78rem',color:'var(--txt3)' }}>
                Students are not informed about this system. It is for admin analytics and engagement tracking only.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="sec-hdr mb2">
        <div>
          <div style={{ display:'flex',alignItems:'center',gap:'0.625rem' }}>
            <div className="sec-t">Rewards System</div>
            <button
              onClick={() => setShowInfo(true)}
              title="How rewards work"
              style={{ width:22,height:22,borderRadius:'50%',border:'1.5px solid var(--bdr)',background:'none',cursor:'pointer',fontSize:'0.72rem',fontWeight:700,color:'var(--acc)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background .2s,color .2s' }}
              onMouseEnter={e=>{ e.currentTarget.style.background='var(--acc)'; e.currentTarget.style.color='white'; }}
              onMouseLeave={e=>{ e.currentTarget.style.background='none'; e.currentTarget.style.color='var(--acc)'; }}
            >i</button>
          </div>
          <div className="sec-s">Student points, levels, and badges — admin visibility only. Students are not aware of this system.</div>
        </div>
        <button className="fb fb-g" onClick={load} disabled={loading}>Refresh</button>
      </div>

      {/* Level summary */}
      <div className="sgrid" style={{ marginBottom: '1.5rem' }}>
        {[
          { l: 'Total Students', v: stats.total,    h: 'with rewards data' },
          { l: 'Bronze',  v: stats.bronze,   h: '0 – 499 pts',   color: LEVEL_COLORS.bronze  },
          { l: 'Silver',  v: stats.silver,   h: '500 – 999 pts', color: LEVEL_COLORS.silver  },
          { l: 'Gold',    v: stats.gold,     h: '1000 – 2499 pts', color: LEVEL_COLORS.gold  },
          { l: 'Platinum',v: stats.platinum, h: '2500+ pts',     color: LEVEL_COLORS.platinum},
        ].map(s => (
          <div className="sc" key={s.l}>
            <div className="sl">{s.l}</div>
            <div className="sv" style={s.color ? { color: s.color } : {}}>{s.v}</div>
            <div className="sh">{s.h}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="fbar mb3">
        <div className="fg" style={{ maxWidth: 260 }}>
          <div className="fl">Search</div>
          <input className="fi" placeholder="Student ID or name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="fg" style={{ maxWidth: 160 }}>
          <div className="fl">Level</div>
          <select className="fs" value={levelF} onChange={e => setLevelF(e.target.value)}>
            <option value="all">All Levels</option>
            <option value="bronze">Bronze</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
          </select>
        </div>
      </div>

      {/* Leaderboard table */}
      <div className="tc">
        <div className="thbar">
          <div className="thtitle">Student Leaderboard</div>
          <div className="cpill">{filtered.length} students</div>
        </div>
        <div className="tscroll">
          {loading ? (
            <div className="empty">Loading rewards data...</div>
          ) : filtered.length === 0 ? (
            <div className="empty">No rewards data yet. Points are awarded automatically when students check in.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Level</th>
                  <th>Points</th>
                  <th>Progress</th>
                  <th>Visits</th>
                  <th>Streak</th>
                  <th>Badges</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const st = students[r.studentId];
                  return (
                    <tr key={r.studentId}>
                      <td style={{ color: 'var(--txt3)', fontSize: '0.78rem', fontFamily: "'DM Mono', monospace" }}>{i+1}</td>
                      <td><span className="mono">{r.studentId}</span></td>
                      <td style={{ fontWeight: 500 }}>{st?.fullName ?? '-'}</td>
                      <td><LevelBadge level={r.level ?? 'bronze'} /></td>
                      <td style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: 'var(--navy)' }}>{r.points ?? 0}</td>
                      <td style={{ minWidth: 140 }}><ProgressBar points={r.points ?? 0} level={r.level ?? 'bronze'} /></td>
                      <td style={{ fontFamily: "'DM Mono', monospace" }}>{r.visits ?? 0}</td>
                      <td style={{ fontFamily: "'DM Mono', monospace" }}>{r.streak ?? 0}d</td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {(r.badges ?? []).map(b => (
                            <span key={b.id} title={b.description} style={{ cursor: 'help', background: 'var(--surf2)', border: '1px solid var(--bdr)', borderRadius: 4, padding: '0.1rem 0.4rem', fontSize: '0.65rem', color: 'var(--txt2)' }}>
                              {b.name}
                            </span>
                          ))}
                        </div>
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
