export default function Confetti() {
  const pieces = Array.from({ length: 48 }, (_, i) => ({
    id: i,
    color: ['#1B2A4A', '#2E5090', '#8A9BB5', '#3D6BC4'][i % 4],
    left:  `${Math.random() * 100}%`,
    delay: `${Math.random() * 1.3}s`,
    dur:   `${2.5 + Math.random() * 2}s`,
    w:     `${7  + Math.random() * 7}px`,
    h:     `${4  + Math.random() * 4}px`,
  }));

  return (
    <>
      {pieces.map(p => (
        <div
          key={p.id}
          className="cf"
          style={{
            left:              p.left,
            top:               '-20px',
            backgroundColor:   p.color,
            width:             p.w,
            height:            p.h,
            animationDelay:    p.delay,
            animationDuration: p.dur,
          }}
        />
      ))}
    </>
  );
}
