import { useState } from 'react';
import { getVisitsByDateRange } from '../../../firebase/firestore.js';
import { fmtDate, fmtTime, duration } from '../../../utils/formatters.js';

function pad(n) { return String(n).padStart(2, '0'); }
function isoDate(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }

function todayStr() { return isoDate(new Date()); }
function sevenDaysAgo() {
  const d = new Date(); d.setDate(d.getDate() - 7);
  return isoDate(d);
}

export default function ReportsTab({ visits }) {
  const [from,       setFrom]       = useState(sevenDaysAgo());
  const [to,         setTo]         = useState(todayStr());
  const [rangeData,  setRangeData]  = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [showPreview,setShowPreview]= useState(false);
  const [err,        setErr]        = useState('');

  const fetchData = async () => {
    if (!from || !to) { setErr('Please select both From and To dates.'); return; }
    const start = new Date(from); start.setHours(0,0,0,0);
    const end   = new Date(to);   end.setHours(23,59,59,999);
    if (start > end) { setErr('From date must be before To date.'); return; }
    setErr('');
    setLoading(true);
    try {
      const data = await getVisitsByDateRange(start, end);
      setRangeData(data);
    } catch (e) {
      console.error(e);
      setErr('Failed to fetch data. Please try again.');
    }
    setLoading(false);
  };

  const exportCSV = () => {
    if (!rangeData) return;
    const headers = ['Student ID','Full Name','College','Program','Purpose','Check-In','Check-Out','Duration','Status'];
    const rows = rangeData.map(v => [
      v.studentId, v.fullName, v.collegeCode, v.programCode, v.purpose ?? '-',
      v.checkInTime  ? new Date(v.checkInTime).toISOString()  : '',
      v.checkOutTime ? new Date(v.checkOutTime).toISOString() : '',
      duration(v.checkInTime, v.checkOutTime),
      v.isActive ? 'Active' : 'Completed',
    ]);
    const csv  = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `library-report-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportPDF = async () => {
    if (!rangeData) return;
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const pdf = new jsPDF({ orientation: 'landscape' });

      // Header
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('New Era University Library', pdf.internal.pageSize.width / 2, 18, { align: 'center' });
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('9 Central Ave, Quezon City, Philippines', pdf.internal.pageSize.width / 2, 25, { align: 'center' });
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Visit Report: ${from} to ${to}`, pdf.internal.pageSize.width / 2, 33, { align: 'center' });

      autoTable(pdf, {
        startY: 40,
        head: [['Student ID','Full Name','College','Purpose','Check-In','Check-Out','Duration','Status']],
        body: rangeData.map(v => [
          v.studentId, v.fullName, v.collegeCode, v.purpose ?? '-',
          v.checkInTime  ? `${fmtDate(v.checkInTime)} ${fmtTime(v.checkInTime)}`   : '-',
          v.checkOutTime ? `${fmtDate(v.checkOutTime)} ${fmtTime(v.checkOutTime)}` : '-',
          duration(v.checkInTime, v.checkOutTime),
          v.isActive ? 'Active' : 'Completed',
        ]),
        styles:     { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: [27, 42, 74], textColor: 255, fontSize: 8 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        didDrawPage: (data) => {
          const gen = `Generated: ${new Date().toLocaleString('en-PH')}  |  Total Records: ${rangeData.length}`;
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'normal');
          pdf.text(gen, 14, pdf.internal.pageSize.height - 8);
        },
      });

      pdf.save(`library-report-${from}-to-${to}.pdf`);
    } catch (e) {
      console.error(e);
      alert('PDF export requires jspdf and jspdf-autotable.\nRun: npm install jspdf jspdf-autotable');
    }
  };

  // Quick CSV for current live visits (existing simple reports)
  const quickCSV = (data, filename) => {
    const rows = data.map(v => [
      v.studentId,
      v.checkInTime  ? new Date(v.checkInTime).toISOString()  : '',
      v.checkOutTime ? new Date(v.checkOutTime).toISOString() : '',
      duration(v.checkInTime, v.checkOutTime),
      v.isActive ? 'Active' : 'Completed',
    ]);
    const csv  = [['Student ID','Check-In','Check-Out','Duration','Status'], ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob); a.download = filename; a.click();
    URL.revokeObjectURL(a.href);
  };

  const today2 = new Date(); today2.setHours(0,0,0,0);

  return (
    <div>
      {/* Print Preview Modal */}
      {showPreview && rangeData && (
        <div className="po" onClick={() => setShowPreview(false)}>
          <div
            style={{ background: 'var(--surf)', borderRadius: 10, padding: '2rem', maxWidth: 800, width: '95%', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,.35)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '2px solid var(--bdr)', paddingBottom: '1rem' }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.3rem', color: 'var(--navy)' }}>New Era University Library</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--txt3)' }}>9 Central Ave, Quezon City, Philippines</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--txt)' }}>
                Visit Report: {from} to {to}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--txt3)' }}>{rangeData.length} records</div>
            </div>
            <div className="tscroll">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead><tr style={{ background: 'var(--navy)', color: 'white' }}>
                  {['Student ID','Name','College','Purpose','Check-In','Check-Out','Status'].map(h => (
                    <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {rangeData.map((v,i) => (
                    <tr key={v.visitId} style={{ background: i%2===0 ? 'var(--surf)' : 'var(--surf2)' }}>
                      <td style={{ padding: '0.4rem 0.75rem', fontFamily: 'monospace' }}>{v.studentId}</td>
                      <td style={{ padding: '0.4rem 0.75rem' }}>{v.fullName}</td>
                      <td style={{ padding: '0.4rem 0.75rem' }}>{v.collegeCode}</td>
                      <td style={{ padding: '0.4rem 0.75rem' }}>{v.purpose ?? '-'}</td>
                      <td style={{ padding: '0.4rem 0.75rem', whiteSpace: 'nowrap' }}>{v.checkInTime ? `${fmtDate(v.checkInTime)} ${fmtTime(v.checkInTime)}` : '-'}</td>
                      <td style={{ padding: '0.4rem 0.75rem', whiteSpace: 'nowrap' }}>{v.checkOutTime ? fmtTime(v.checkOutTime) : '-'}</td>
                      <td style={{ padding: '0.4rem 0.75rem' }}>
                        <span className={`bdg ${v.isActive ? 'bdg-in' : 'bdg-out'}`}>{v.isActive ? 'Active' : 'Done'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '1rem', textAlign: 'center', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="fb fb-g" onClick={() => setShowPreview(false)}>Close</button>
              <button className="fb fb-p" onClick={exportCSV}>Export CSV</button>
              <button className="fb fb-p" onClick={exportPDF}>Export PDF</button>
            </div>
          </div>
        </div>
      )}

      <div className="sec-hdr mb2">
        <div>
          <div className="sec-t">Reports &amp; Export</div>
          <div className="sec-s">Generate and export visit records with custom date ranges.</div>
        </div>
      </div>

      {/* Date range picker */}
      <div className="tc" style={{ marginBottom: '1.5rem' }}>
        <div className="thbar"><div className="thtitle">Custom Date Range Report</div></div>
        <div style={{ padding: '1.5rem' }}>
          <div className="fbar" style={{ border: 'none', padding: 0, marginBottom: '1rem' }}>
            <div className="fg">
              <div className="fl">From</div>
              <input className="fi" type="date" value={from} max={to} onChange={e => setFrom(e.target.value)} />
            </div>
            <div className="fg">
              <div className="fl">To</div>
              <input className="fi" type="date" value={to} min={from} max={todayStr()} onChange={e => setTo(e.target.value)} />
            </div>
            <button className="fb fb-p" onClick={fetchData} disabled={loading} style={{ alignSelf: 'flex-end' }}>
              {loading ? 'Fetching...' : 'Fetch Data'}
            </button>
          </div>
          {err && <div className="f-err">{err}</div>}

          {rangeData !== null && (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--txt2)' }}>
                <strong>{rangeData.length}</strong> records fetched
              </span>
              <button className="exp-btn" onClick={() => setShowPreview(true)}>Print Preview</button>
              <button className="exp-btn" onClick={exportCSV}>Export CSV</button>
              <button className="exp-btn" onClick={exportPDF}>Export PDF</button>
            </div>
          )}
        </div>
      </div>

      {/* Quick exports (live data) */}
      <div className="sec-t" style={{ marginBottom: '1rem', fontSize: '1rem' }}>Quick Exports (Live Data)</div>
      <div className="rg">
        {[
          { title: "Today's Visits",    sub: `${visits.filter(v => v.checkInTime && new Date(v.checkInTime) >= today2).length} records from today.`,    data: visits.filter(v => v.checkInTime && new Date(v.checkInTime) >= today2),  fn: 'neu-library-today.csv'  },
          { title: 'All Visit Records', sub: `${visits.length} total records in the system.`,                                                              data: visits,                                                                    fn: 'neu-library-all.csv'    },
          { title: 'Active Sessions',   sub: `${visits.filter(v => v.isActive).length} students currently inside.`,                                        data: visits.filter(v => v.isActive),                                           fn: 'neu-library-active.csv' },
        ].map(r => (
          <div className="rc" key={r.title}>
            <div className="rc-t">{r.title}</div>
            <div className="rc-s">{r.sub}</div>
            <button className="exp-btn" onClick={() => quickCSV(r.data, r.fn)}>Export CSV</button>
          </div>
        ))}
      </div>
    </div>
  );
}
