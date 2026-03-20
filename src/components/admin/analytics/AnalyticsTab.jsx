import { useState, useEffect, useMemo } from 'react';
import { getPurposeStats, getHourlyTraffic } from '../../../firebase/firestore.js';

const PURPOSE_LABELS = {
  research:    'Research',
  computer:    'Computer Use',
  reading:     'Reading / Study',
  borrow:      'Borrow Books',
  return:      'Return Books',
  'group-study': 'Group Study',
  printing:    'Printing / Scanning',
  faculty:     'Faculty Work',
  other:       'Other',
  unspecified: 'Not Specified',
};

const PURPOSE_COLORS = [
  '#2E5090', '#1A6B3A', '#C9A84C', '#B33A3A', '#6A5ACD',
  '#20B2AA', '#FF7F50', '#9370DB', '#3CB371', '#708090',
];

function Bar({ label, count, max, color }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.625rem' }}>
      <div style={{ width: 130, fontSize: '0.78rem', color: 'var(--txt2)', flexShrink: 0, textAlign: 'right' }}>
        {PURPOSE_LABELS[label] ?? label}
      </div>
      <div style={{ flex: 1, background: 'var(--line-lt, var(--surf2))', borderRadius: 99, height: 14, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width .5s' }} />
      </div>
      <div style={{ width: 36, fontSize: '0.78rem', color: 'var(--txt3)', fontFamily: "'DM Mono', monospace" }}>{count}</div>
    </div>
  );
}

function HeatmapRow({ hour, count, max }) {
  const pct = max > 0 ? count / max : 0;
  const alpha = 0.1 + pct * 0.85;
  const label = `${String(hour).padStart(2,'0')}:00`;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
      <div style={{ width: 44, fontSize: '0.68rem', color: 'var(--txt3)', fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 22, borderRadius: 4, background: `rgba(46,80,144,${alpha})`, display: 'flex', alignItems: 'center', paddingLeft: '0.5rem' }}>
        {count > 0 && <span style={{ fontSize: '0.68rem', color: pct > 0.5 ? 'white' : 'var(--txt2)', fontFamily: "'DM Mono', monospace" }}>{count}</span>}
      </div>
    </div>
  );
}

export default function AnalyticsTab({ visits }) {
  const [purposeStats, setPurposeStats] = useState({});
  const [hourlyData,   setHourlyData]   = useState([]);
  const [dateFilter,   setDateFilter]   = useState('today');
  const [loading,      setLoading]      = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const now   = new Date();
      let start, end;
      if (dateFilter === 'today') {
        start = new Date(now); start.setHours(0,0,0,0);
        end   = new Date(now); end.setHours(23,59,59,999);
      } else if (dateFilter === 'week') {
        start = new Date(now); start.setDate(now.getDate() - 7); start.setHours(0,0,0,0);
        end   = new Date(now);
      } else {
        start = new Date(now); start.setDate(1); start.setHours(0,0,0,0);
        end   = new Date(now);
      }
      const [ps, hd] = await Promise.all([
        getPurposeStats({ startDate: start, endDate: end }),
        getHourlyTraffic(now),
      ]);
      setPurposeStats(ps);
      setHourlyData(hd);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [dateFilter]);

  const sortedPurposes = useMemo(() =>
    Object.entries(purposeStats).sort((a,b) => b[1] - a[1]),
    [purposeStats]
  );
  const maxPurpose  = sortedPurposes[0]?.[1] ?? 1;
  const totalPurpose = sortedPurposes.reduce((s,[,c]) => s + c, 0);

  const maxHour = Math.max(...hourlyData.map(h => h.count), 1);
  const peakHour = hourlyData.reduce((best, h) => h.count > (best?.count ?? 0) ? h : best, null);

  // Client-side today stats from live visits prop
  const today = new Date(); today.setHours(0,0,0,0);
  const todayVisits = visits.filter(v => v.checkInTime && new Date(v.checkInTime) >= today);
  const todayPurposes = {};
  todayVisits.forEach(v => {
    const p = v.purpose ?? 'unspecified';
    todayPurposes[p] = (todayPurposes[p] ?? 0) + 1;
  });

  return (
    <div>
      <div className="sec-hdr mb2">
        <div>
          <div className="sec-t">Analytics</div>
          <div className="sec-s">Purpose distribution, hourly traffic, and visit trends.</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {['today', 'week', 'month'].map(f => (
            <button key={f} className={`fb ${dateFilter === f ? 'fb-p' : 'fb-g'}`} onClick={() => setDateFilter(f)} style={{ textTransform: 'capitalize', minWidth: 60 }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <button className="fb fb-g" onClick={loadData} disabled={loading}>Refresh</button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="sgrid" style={{ marginBottom: '1.5rem' }}>
        {[
          { l: "Today's Visits",   v: todayVisits.length,             h: 'from live data' },
          { l: 'Currently Inside', v: visits.filter(v=>v.isActive).length, h: 'active sessions' },
          { l: 'Peak Hour',        v: peakHour ? `${String(peakHour.hour).padStart(2,'0')}:00` : '-', h: peakHour ? `${peakHour.count} visits` : 'no data' },
          { l: 'Total (Period)',   v: totalPurpose,                    h: `${dateFilter} range` },
        ].map(s => (
          <div className="sc" key={s.l}><div className="sl">{s.l}</div><div className="sv">{s.v}</div><div className="sh">{s.h}</div></div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Purpose distribution */}
        <div className="tc">
          <div className="thbar"><div className="thtitle">Purpose Distribution</div><div className="cpill">{totalPurpose} visits</div></div>
          <div style={{ padding: '1.25rem 1.5rem' }}>
            {loading ? <div className="empty">Loading...</div> :
             sortedPurposes.length === 0 ? <div className="empty">No purpose data for this period.</div> :
             sortedPurposes.map(([label, count], i) => (
              <Bar key={label} label={label} count={count} max={maxPurpose} color={PURPOSE_COLORS[i % PURPOSE_COLORS.length]} />
            ))}
          </div>
        </div>

        {/* Hourly heatmap */}
        <div className="tc">
          <div className="thbar"><div className="thtitle">Hourly Traffic — Today</div><div className="cpill">24h view</div></div>
          <div style={{ padding: '1.25rem 1.5rem', maxHeight: 400, overflowY: 'auto' }}>
            {loading ? <div className="empty">Loading...</div> :
             hourlyData.map(h => <HeatmapRow key={h.hour} hour={h.hour} count={h.count} max={maxHour} />)}
          </div>
        </div>
      </div>

      {/* Today's purpose breakdown from live data */}
      {Object.keys(todayPurposes).length > 0 && (
        <div className="tc" style={{ marginTop: '1.25rem' }}>
          <div className="thbar"><div className="thtitle">Today's Purpose Breakdown (Live)</div></div>
          <div style={{ padding: '1rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {Object.entries(todayPurposes).sort((a,b) => b[1]-a[1]).map(([p, c]) => (
              <div key={p} style={{ background: 'var(--surf2)', border: '1px solid var(--bdr)', borderRadius: 6, padding: '0.4rem 0.875rem', fontSize: '0.8rem', color: 'var(--txt2)' }}>
                <strong style={{ color: 'var(--navy)' }}>{c}</strong> &nbsp;{PURPOSE_LABELS[p] ?? p}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
