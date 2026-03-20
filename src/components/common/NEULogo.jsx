export default function NEULogo({ size = 64 }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      overflow: 'hidden',
      background: 'white',
      flexShrink: 0,
    }}>
      <img
        src="https://neu.edu.ph/main/img/neu.png"
        alt="New Era University"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={e => {
          e.target.style.display = 'none';
          e.target.parentNode.innerHTML = `
            <div style="width:100%;height:100%;background:#1B2A4A;display:flex;align-items:center;
              justify-content:center;color:white;font-family:'DM Serif Display',serif;
              font-size:${size * 0.22}px">NEU</div>`;
        }}
      />
    </div>
  );
}
