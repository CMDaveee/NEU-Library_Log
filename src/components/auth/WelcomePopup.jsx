import { useState, useEffect } from 'react';
import Confetti from '../common/Confetti.jsx';
import '../../styles/auth.css';

const WELCOME_IMG_URL =
  'https://scontent.fmnl37-1.fna.fbcdn.net/v/t39.30808-6/477579626_122108352272743934_80451274266931311_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=2a1932&_nc_ohc=apGLE2KMe60Q7kNvwEWZrux&_nc_oc=AdqSxAp1cQoN_vFe5wtaj8M4Xmg8j1eu5zFX7mTW1PIRxBYrVK6i6sb4EZ9NHycroVk&_nc_zt=23&_nc_ht=scontent.fmnl37-1.fna&_nc_gid=SsEs_HYnDIrvRkHIKpNhbA&_nc_ss=7a30f&oh=00_Afys5_-cC7KIvjQ92v6ipSH2KiT3ka1zYoALn19QYFNBsQ&oe=69C316FC';

export default function WelcomePopup({ user, onDismiss }) {
  const [imgErr,  setImgErr]  = useState(false);
  const [showConf, setShowConf] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowConf(false), 4500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="wl">
      {showConf && <Confetti />}

      <div className="wc">
        {!imgErr ? (
          <img
            className="wc-img"
            src={WELCOME_IMG_URL}
            alt="NEU Library"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="wc-fb">
            <div className="wc-fb-txt">New Era University Library</div>
          </div>
        )}

        <div className="wc-body">
          <div className="wc-eyebrow">Welcome Back</div>
          <div className="wc-title">New Era University Library</div>
          <div className="wc-sub">
            Signed in as <strong>{user.name}</strong>. Administrator access granted.
          </div>
          <div style={{ background:'var(--navy,#1B2A4A)',borderRadius:10,padding:'0.75rem 1rem',margin:'0.875rem 0 1.25rem',color:'white',fontSize:'0.72rem',lineHeight:1.65,textAlign:'left' }}>
            <div style={{ marginBottom:'0.2rem' }}>&#128205; No. 9 Central Avenue, New Era, Quezon City, 1107 Metro Manila</div>
            <div style={{ marginBottom:'0.2rem' }}>&#128222; (02) 7273-6345</div>
            <div>&#9993;&#65039; library@neu.edu.ph</div>
          </div>
          <button className="wc-btn" onClick={onDismiss}>
            Access Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
