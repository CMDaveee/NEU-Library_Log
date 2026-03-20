import { duration } from '../../../utils/formatters.js';

function exportCSV(data, filename) {
  const headers = ['Student ID','Check-In','Check-Out','Duration','Status'];
  const rows    = data.map(v => [
    v.studentId,
    v.checkInTime  ? new Date(v.checkInTime).toISOString()  : '',
    v.checkOutTime ? new Date(v.checkOutTime).toISOString() : '',
    duration(v.checkInTime, v.checkOutTime),
    v.isActive ? 'Active' : 'Completed',
  ]);
  const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function ReportsTab({ visits }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const reports = [
    { title: "Today's Visits",   subtitle: `${visits.filter(v => new Date(v.checkInTime) >= today).length} records from today.`,    data: visits.filter(v => new Date(v.checkInTime) >= today), filename: 'neu-library-today.csv'  },
    { title: 'All Visit Records', subtitle: `${visits.length} total records in the system.`,                                          data: visits,                                               filename: 'neu-library-all.csv'    },
    { title: 'Active Sessions',   subtitle: `${visits.filter(v => v.isActive).length} students currently inside.`,                   data: visits.filter(v => v.isActive),                       filename: 'neu-library-active.csv' },
  ];
  return (
    <div>
      <div className="sec-t mb2">Reports and Data Export</div>
      <div className="rg">
        {reports.map(r => (
          <div className="rc" key={r.title}>
            <div className="rc-t">{r.title}</div>
            <div className="rc-s">{r.subtitle}</div>
            <button className="exp-btn" onClick={() => exportCSV(r.data, r.filename)}>Export CSV</button>
          </div>
        ))}
      </div>
    </div>
  );
}
