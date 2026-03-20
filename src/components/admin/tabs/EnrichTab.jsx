import { useState } from 'react';
import { FirebaseService } from '../../../utils/firebase.js';
import { COLLEGES, PROGRAMS, PURPOSES } from '../../../data/constants.js';
import { fmtDate } from '../../../utils/formatters.js';

export default function EnrichTab({ visits }) {
  const [enrichData, setEnrichData] = useState({});
  const [saved,      setSaved]      = useState({});
  const [saving,     setSaving]     = useState(false);

  const update = (visitId, field, value) => {
    setEnrichData(prev => {
      const next = { ...prev, [visitId]: { ...(prev[visitId] || {}), [field]: value } };
      if (field === 'collegeCode') next[visitId].programCode = '';
      return next;
    });
  };

  const saveAll = async () => {
    setSaving(true);
    for (const [visitId, data] of Object.entries(enrichData)) {
      await FirebaseService.saveEnrichment(visitId, { ...data, status: data.status || 'student' });
      setSaved(prev => ({ ...prev, [visitId]: true }));
    }
    setSaving(false);
  };

  return (
    <div>
      <div className="sec-hdr">
        <div>
          <div className="sec-t">Data Enrichment</div>
          <div className="sec-s">Assign college, program, and purpose to visit records.</div>
        </div>
        <button className="sav-btn" onClick={saveAll} disabled={saving || Object.keys(enrichData).length === 0}>
          {saving ? 'Saving...' : 'Save All'}
        </button>
      </div>
      <div className="tc">
        <div className="tscroll">
          {visits.length === 0 ? (
            <div className="empty">No visit records available.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Student ID</th><th>Date</th><th>Status</th>
                  <th>Purpose</th><th>College</th><th>Program</th><th></th>
                </tr>
              </thead>
              <tbody>
                {visits.map(v => {
                  const d        = enrichData[v.visitId] || {};
                  const existing = FirebaseService.getDetailForVisit(v.visitId);
                  const college  = d.collegeCode || existing?.collegeCode || '';
                  const programs = college ? (PROGRAMS[college] || []) : [];
                  return (
                    <tr key={v.visitId}>
                      <td><span className="mono">{v.studentId}</span></td>
                      <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(v.checkInTime)}</td>
                      <td>
                        <select className="esel" value={d.status || existing?.status || ''} onChange={e => update(v.visitId, 'status', e.target.value)}>
                          <option value="">Select...</option>
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="staff">Staff</option>
                        </select>
                      </td>
                      <td>
                        <select className="esel" value={d.purpose || existing?.purpose || ''} onChange={e => update(v.visitId, 'purpose', e.target.value)}>
                          <option value="">Select...</option>
                          {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>
                      <td>
                        <select className="esel" value={college} onChange={e => update(v.visitId, 'collegeCode', e.target.value)}>
                          <option value="">Select...</option>
                          {COLLEGES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                        </select>
                      </td>
                      <td>
                        <select className="esel" value={d.programCode || existing?.programCode || ''} onChange={e => update(v.visitId, 'programCode', e.target.value)} disabled={!college}>
                          <option value="">{college ? 'Select...' : 'Select college first'}</option>
                          {programs.map(p => <option key={p.code} value={p.code}>{p.code}</option>)}
                        </select>
                      </td>
                      <td>{saved[v.visitId] && <span className="sav-ok">Saved</span>}</td>
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
