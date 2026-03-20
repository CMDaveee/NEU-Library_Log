import { useState } from 'react';

const PURPOSES = [
  { id: 'research',         label: 'Research',          icon: '🔬' },
  { id: 'computer',         label: 'Computer Use',       icon: '💻' },
  { id: 'reading',          label: 'Reading / Study',    icon: '📖' },
  { id: 'borrow',           label: 'Borrow Books',       icon: '📚' },
  { id: 'return',           label: 'Return Books',       icon: '↩️' },
  { id: 'group-study',      label: 'Group Study',        icon: '👥' },
  { id: 'printing',         label: 'Printing / Scanning',icon: '🖨️' },
  { id: 'faculty',          label: 'Faculty Work',       icon: '🎓' },
  { id: 'other',            label: 'Other',              icon: '📌' },
];

export default function PurposePopup({ action, sid, onSelect }) {
  const [selected,   setSelected]   = useState('');
  const [otherText,  setOtherText]  = useState('');
  const [err,        setErr]        = useState('');

  if (action === 'check-out') {
    // No purpose needed for check-out — pass through immediately
    onSelect({ purpose: null, purposeOther: null });
    return null;
  }

  const handleSubmit = () => {
    if (!selected) { setErr('Please select your purpose of visit.'); return; }
    if (selected === 'other' && !otherText.trim()) {
      setErr('Please describe your purpose.'); return;
    }
    onSelect({
      purpose:      selected,
      purposeOther: selected === 'other' ? otherText.trim() : null,
    });
  };

  return (
    <div className="po">
      <div className="purpose-popup">
        <div className="purpose-popup-title">Purpose of Visit</div>
        <div className="purpose-popup-sub">
          <span className="mono" style={{ color: 'var(--silver)' }}>{sid}</span>
          &nbsp;— What brings you to the library today?
        </div>

        <div className="purpose-grid">
          {PURPOSES.map(p => (
            <button
              key={p.id}
              className={`purpose-btn${selected === p.id ? ' selected' : ''}`}
              onClick={() => { setSelected(p.id); setErr(''); }}
              type="button"
            >
              <span className="purpose-icon">{p.icon}</span>
              <span className="purpose-label">{p.label}</span>
            </button>
          ))}
        </div>

        {selected === 'other' && (
          <input
            className="f-inp"
            style={{ marginTop: '0.75rem', textAlign: 'left', fontSize: '0.9rem', letterSpacing: 0 }}
            type="text"
            placeholder="Briefly describe your purpose..."
            value={otherText}
            onChange={e => { setOtherText(e.target.value); setErr(''); }}
            autoFocus
            maxLength={100}
          />
        )}

        {err && <div className="f-err" style={{ textAlign: 'center', marginTop: '0.5rem' }}>{err}</div>}

        <button
          className="tap-btn"
          style={{ marginTop: '1.25rem' }}
          onClick={handleSubmit}
          disabled={!selected}
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
