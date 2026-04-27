import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { CCA } from '../../types';

const FeedExplore: React.FC = () => {
  const [ccas, setCCAs] = useState<CCA[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await apiService.getCCAs();
        setCCAs(data.filter((c: any) => c.status === 'active').sort((a, b) => (b.score || 0) - (a.score || 0)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const goToProfile = (nickname: string) => {
    window.location.hash = `/@${nickname}`;
  };

  const top20 = ccas.slice(0, 20);
  const trending = ccas.slice(0, 8);

  return (
    <>
      <div className="ft-page-header">
        <div className="ft-page-title">
          <span>탐색</span>
          <div className="ft-page-title-icon">
            <span className="material-symbols-outlined">notifications</span>
          </div>
        </div>
        <div className="ft-tabs">
          <button className="ft-tab active">홈</button>
          <button className="ft-tab">
            <span style={{ color: 'var(--ft-danger)', marginRight: 4, fontSize: 8 }}>●</span>
            Comp
          </button>
        </div>
      </div>

      {loading ? (
        <div className="ft-loading"><div className="ft-spinner"></div></div>
      ) : (
        <>
          {/* Banner area */}
          <div className="ft-banner-wrap">
            <div className="ft-banner">
              {top20[0] && (
                <img src={top20[0].image} alt="" style={{ opacity: 0.4 }} />
              )}
              <div className="ft-banner-overlay">
                <div className="ft-banner-badge">🏆 이번 주 1위</div>
                <div className="ft-banner-title">
                  {top20[0]?.nickname || top20[0]?.name || 'Top Creator'}
                </div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>
                  최고 후원자 · {top20[0]?.venueName}
                </div>
              </div>
            </div>
            <div className="ft-banner-dots">
              <button className="ft-banner-dot active" />
              <button className="ft-banner-dot" />
              <button className="ft-banner-dot" />
            </div>
          </div>

          {/* Top 20 Section */}
          <div className="ft-explore-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="ft-explore-emoji">👀</span>
              <div>
                <div className="ft-explore-section-title" style={{ color: 'var(--ft-primary)' }}>
                  실시간 검색 Top 20
                </div>
                <div className="ft-explore-section-subtitle">
                  팬들이 가장 많이 찾은 크리에이터 🔥
                </div>
              </div>
            </div>

            <div className="ft-creator-scroll">
              {trending.map(cca => (
                <div
                  key={cca.id}
                  className="ft-creator-card"
                  onClick={() => goToProfile(cca.nickname || cca.name)}
                >
                  <img
                    src={cca.image || 'https://ui-avatars.com/api/?name=' + cca.name}
                    alt=""
                    className="ft-creator-card-img"
                  />
                  <div className="ft-creator-card-info">
                    <div className="ft-creator-card-name">{cca.nickname || cca.name}</div>
                    <div className="ft-creator-card-desc">
                      {cca.description || cca.oneLineStory || `${cca.venueName}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular picks section */}
          <div className="ft-explore-section" style={{ borderTop: '8px solid var(--ft-bg-tertiary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="ft-explore-emoji">💸</span>
              <div>
                <div className="ft-explore-section-title" style={{ color: 'var(--ft-success)' }}>
                  지갑 조심하세요
                </div>
                <div className="ft-explore-section-subtitle">
                  팬들이 가장 많이 팔로우한 크리에이터 ⚠️
                </div>
              </div>
            </div>

            <div className="ft-creator-scroll">
              {ccas.slice(3, 11).map(cca => (
                <div
                  key={cca.id}
                  className="ft-creator-card"
                  onClick={() => goToProfile(cca.nickname || cca.name)}
                >
                  <img
                    src={cca.image || 'https://ui-avatars.com/api/?name=' + cca.name}
                    alt=""
                    className="ft-creator-card-img"
                  />
                  <div className="ft-creator-card-info">
                    <div className="ft-creator-card-name">{cca.nickname || cca.name}</div>
                    <div className="ft-creator-card-desc">
                      {cca.description || cca.oneLineStory || `Score: ${cca.score || 0}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default FeedExplore;
