import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { CCA } from '../../types';

const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: 'trending', label: '인기' },
  { id: 'new', label: '신규' },
  { id: 'free', label: '무료구독' },
  { id: 'secret', label: '시크릿' },
];

const FeedExplore: React.FC = () => {
  const [activeCat, setActiveCat] = useState('all');
  const [creators, setCreators] = useState<CCA[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await apiService.getCCAs();
        setCreators(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    loadData();
  }, []);

  const goToProfile = (nickname: string) => {
    window.location.hash = `/@${nickname}`;
  };

  return (
    <div className="ft-ex-container">
      {/* ═══ 입체적인 탭 네비게이션 ═══ */}
      <div className="ft-tabs" style={{ marginBottom: 32 }}>
        {CATEGORIES.map(cat => (
          <button 
            key={cat.id} 
            className={`ft-tab ${activeCat === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCat(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ═══ Spotlight Hero Banner ═══ */}
      <div className="ft-ex-banner-hero">
        <div className="ft-ex-banner-bg"></div>
        <div className="ft-ex-banner-content">
          <div className="ft-ex-banner-tag">HOT EVENT</div>
          <h1 className="ft-ex-banner-title">
            신규 구독 시 <br />
            보너스 캐시 100% 증정
          </h1>
          <p style={{ fontSize: 14, opacity: 0.8 }}>지금 바로 최애 크리에이터를 구독하세요.</p>
        </div>
      </div>

      {/* ═══ 실시간 랭킹 (Mini List) ═══ */}
      <section className="ft-ex-section">
        <div className="ft-ex-head">
          <h2 className="ft-ex-title">실시간 랭킹 Top 5</h2>
          <span className="ft-ex-subtitle">팬들이 가장 많이 찾은 크리에이터</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          {creators.slice(0, 5).map((cca, i) => (
            <div key={cca.id} className="ft-ex-rank-item" onClick={() => goToProfile(cca.nickname || cca.name)}>
              <span className="ft-ex-rank-num">{i + 1}</span>
              <img src={cca.image} className="ft-ex-rank-av" alt="" />
              <div className="ft-ex-rank-info">
                <div className="ft-ex-rank-name">{cca.nickname || cca.name}</div>
                <div className="ft-ex-rank-sub">오늘 {Math.floor(Math.random() * 1000)}명 방문</div>
              </div>
              <span className="material-symbols-outlined" style={{ color: 'var(--ft-primary)', fontSize: 18 }}>trending_up</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ New Rising Stars (Magazine Grid) ═══ */}
      <section className="ft-ex-section">
        <div className="ft-ex-head">
          <h2 className="ft-ex-title">새로운 원석의 발견</h2>
          <span className="ft-ex-subtitle">신규 크리에이터를 만나보세요</span>
        </div>
        <div className="ft-ex-grid">
          {creators.slice(5, 15).map(cca => (
            <div key={cca.id} className="ft-ex-card" onClick={() => goToProfile(cca.nickname || cca.name)}>
              <img src={cca.image} className="ft-ex-card-img" alt="" />
              <div className="ft-ex-card-overlay">
                <div className="ft-ex-card-info">
                  <div className="ft-ex-card-name">
                    {cca.nickname || cca.name}
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#facc15' }}>verified</span>
                  </div>
                  <div className="ft-ex-card-stats">
                    <span className="ft-ex-glass-tag">NEW</span>
                    <span className="ft-ex-glass-tag">POST {Math.floor(Math.random() * 50)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Exclusive Secret Rooms ═══ */}
      <section className="ft-ex-section" style={{ background: 'var(--ft-gradient-soft)', padding: 30, borderRadius: 24 }}>
        <div className="ft-ex-head">
          <h2 className="ft-ex-title">🔒 비밀스러운 대화</h2>
          <span className="ft-ex-subtitle">오직 당신만을 위한 프라이빗 룸</span>
        </div>
        <div className="ft-ex-grid">
          {creators.slice(2, 6).map(cca => (
            <div key={cca.id} className="ft-ex-card" style={{ height: 200, aspectRatio: 'auto' }}>
              <img src={cca.image} className="ft-ex-card-img" alt="" />
              <div className="ft-ex-card-overlay" style={{ background: 'linear-gradient(to top, rgba(232,82,122,0.8), transparent)' }}>
                <div className="ft-ex-card-info">
                  <div className="ft-ex-card-name">{cca.nickname || cca.name}</div>
                  <div className="ft-ex-glass-tag">입장하기</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {loading && (
        <div className="ft-loading"><div className="ft-spinner"></div></div>
      )}
    </div>
  );
};

export default FeedExplore;
