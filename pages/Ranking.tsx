import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { CCA } from '../types';
import './CCAFeed.css'; // Reuse Luminary styles

const Ranking: React.FC = () => {
  const [ccas, setCCAs] = useState<CCA[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'all'>('weekly');

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      try {
        const data = await apiService.getCCAs();
        // Sort by score (mocking different periods for now by using different sort keys if available, otherwise just score)
        const sorted = data
          .filter((c: any) => c.status === 'active')
          .sort((a, b) => (b.score || 0) - (a.score || 0));
        setCCAs(sorted);
      } catch (err) {
        console.error('Fetch rankings error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, [activeTab]);

  const goToProfile = (nickname: string) => {
    window.location.hash = `/@${nickname}`;
  };

  const podium = ccas.slice(0, 3);
  const theRest = ccas.slice(3);

  return (
    <div className="luminary-theme">
      {/* Sidebar (Desktop) */}
      <aside className="luminary-sidebar">
        <div className="luminary-logo">
          <span className="luminary-logo-text">LUMINARY</span>
          <span className="luminary-tagline">Ranking</span>
        </div>
        <nav className="luminary-nav">
          <a href="#/feed" className="luminary-nav-link">
            <span className="material-symbols-outlined">home</span>
            <span>Home</span>
          </a>
          <a href="#/ccas" className="luminary-nav-link">
            <span className="material-symbols-outlined">groups</span>
            <span>CCAs</span>
          </a>
          <a href="#/ranking" className="luminary-nav-link active">
            <span className="material-symbols-outlined">trophy</span>
            <span>Ranking</span>
          </a>
        </nav>
      </aside>

      <main className="luminary-main">
        <div className="luminary-section-header" style={{ marginBottom: 40 }}>
          <h2 className="luminary-hero-title" style={{ fontSize: 40 }}>Star Rankings</h2>
          <div style={{ display: 'flex', gap: 8, background: 'var(--bg-card)', padding: 4, borderRadius: 12 }}>
            {(['weekly', 'monthly', 'all'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 20px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer',
                  backgroundColor: activeTab === tab ? 'var(--luminary-gold)' : 'transparent',
                  color: activeTab === tab ? '#000' : 'var(--text-secondary)'
                }}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
            <div className="feed-spinner"></div>
          </div>
        ) : (
          <>
            {/* Podium */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 20, marginBottom: 60, padding: '0 20px' }}>
              {/* 2nd Place */}
              {podium[1] && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div style={{ position: 'relative' }}>
                    <img src={podium[1].image} alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #C0C0C0' }} />
                    <span style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#C0C0C0', color: '#000', fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 10 }}>2</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800 }}>{podium[1].nickname || podium[1].name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{podium[1].score?.toLocaleString()} pts</div>
                  </div>
                  <div style={{ width: 60, height: 80, background: 'linear-gradient(to top, rgba(192, 192, 192, 0.2), transparent)', borderRadius: '10px 10px 0 0' }}></div>
                </div>
              )}
              {/* 1st Place */}
              {podium[0] && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)', fontSize: 30 }}>👑</div>
                    <img src={podium[0].image} alt="" style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--luminary-gold)', boxShadow: '0 0 20px rgba(232, 184, 75, 0.4)' }} />
                    <span style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--luminary-gold)', color: '#000', fontSize: 12, fontWeight: 900, padding: '4px 12px', borderRadius: 12 }}>1</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 900, fontSize: 18 }}>{podium[0].nickname || podium[0].name}</div>
                    <div style={{ fontSize: 13, color: 'var(--luminary-gold)', fontWeight: 700 }}>{podium[0].score?.toLocaleString()} pts</div>
                  </div>
                  <div style={{ width: 80, height: 120, background: 'linear-gradient(to top, rgba(232, 184, 75, 0.2), transparent)', borderRadius: '12px 12px 0 0' }}></div>
                </div>
              )}
              {/* 3rd Place */}
              {podium[2] && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div style={{ position: 'relative' }}>
                    <img src={podium[2].image} alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #CD7F32' }} />
                    <span style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#CD7F32', color: '#000', fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 10 }}>3</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800 }}>{podium[2].nickname || podium[2].name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{podium[2].score?.toLocaleString()} pts</div>
                  </div>
                  <div style={{ width: 60, height: 60, background: 'linear-gradient(to top, rgba(205, 127, 50, 0.2), transparent)', borderRadius: '10px 10px 0 0' }}></div>
                </div>
              )}
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {theRest.map((cca, index) => (
                <div 
                  key={cca.id}
                  onClick={() => goToProfile(cca.nickname || cca.name)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: 20, padding: 20, background: 'var(--bg-card)', 
                    borderRadius: 16, border: 'var(--border-glass)', cursor: 'pointer' 
                  }}
                >
                  <span style={{ width: 30, fontSize: 14, fontWeight: 800, color: 'var(--text-muted)' }}>{index + 4}</span>
                  <img src={cca.image} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{cca.nickname || cca.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{cca.venueName}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>{cca.score?.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>points</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Mobile Tabbar */}
      <nav className="luminary-tabbar">
        <a href="#/feed" className="luminary-tabbar-item">
          <span className="material-symbols-outlined">home</span>
          <span className="luminary-tabbar-label">Home</span>
        </a>
        <a href="#/ccas" className="luminary-tabbar-item">
          <span className="material-symbols-outlined">groups</span>
          <span className="luminary-tabbar-label">CCAs</span>
        </a>
        <a href="#/ranking" className="luminary-tabbar-item active">
          <span className="material-symbols-outlined">trophy</span>
          <span className="luminary-tabbar-label">Ranking</span>
        </a>
        <a href="#/mypage" className="luminary-tabbar-item">
          <span className="material-symbols-outlined">person</span>
          <span className="luminary-tabbar-label">Profile</span>
        </a>
      </nav>
    </div>
  );
};

export default Ranking;
