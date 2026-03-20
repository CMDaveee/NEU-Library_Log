import { useState, useEffect } from 'react';

export default function LiveClock({ dark = false }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const time = now.toLocaleTimeString('en-PH', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  });
  const date = now.toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: dark ? '0.95rem' : '1rem',
        fontWeight: 700,
        color: dark ? 'white' : 'var(--navy)',
        letterSpacing: '0.04em',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {time}
      </div>
      <div style={{
        fontSize: '0.65rem',
        color: dark ? 'rgba(255,255,255,0.4)' : 'var(--txt3)',
        letterSpacing: '0.04em',
        marginTop: '0.1rem',
      }}>
        {date}
      </div>
    </div>
  );
}
