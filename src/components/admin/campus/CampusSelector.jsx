import { useEffect } from 'react';
import { useCampus } from '../../../context/CampusContext.jsx';
import { getCampuses } from '../../../firebase/firestore.js';

export default function CampusSelector() {
  const { campusId, setCampusId, campuses, setCampuses } = useCampus();

  useEffect(() => {
    getCampuses().then(list => {
      if (list.length > 0) setCampuses(list);
    }).catch(() => {});
  }, []);

  if (campuses.length <= 1) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.35)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Campus
      </span>
      <select
        className="t-btn"
        style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', color: 'rgba(255,255,255,.8)', fontSize: '0.72rem', cursor: 'pointer', padding: '0.3rem 0.7rem', borderRadius: '4px' }}
        value={campusId}
        onChange={e => setCampusId(e.target.value)}
      >
        {campuses.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  );
}
