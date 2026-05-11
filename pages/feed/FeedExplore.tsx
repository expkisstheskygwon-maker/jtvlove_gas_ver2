import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { CCA } from '../../types';

const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: 'trending', label: '인기' },
  { id: 'new', label: '신규' },
  { id: 'free', label: '무료구독' },
  { id: 'secret', label: '시크릿' },
];

interface RankingItem {
  rank: number;
  id: string;
  name: string;
  nickname: string;
  image: string;
  baseScore: number;
  recentLikes: number;
  recentComments: number;
  recentViews: number;
  newFollowers7d: number;
  totalFollowers: number;
  isWorking: boolean;
  rankingScore: number;
}

interface NewCCAItem {
  id: string;
  name: string;
  nickname: string;
  image: string;
  score: number;
  createdAt: string;
  isWorking: boolean;
  postCount: number;
  totalFollowers: number;
}

const FeedExplore: React.FC = () => {
  const navigate = useNavigate();
  const [activeCat, setActiveCat] = useState('all');
  const [creators, setCreators] = useState<CCA[]>([]);
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [newCCAs, setNewCCAs] = useState<NewCCAItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [rankingError, setRankingError] = useState<string>('');
  const [newCCAError, setNewCCAError] = useState<string>('');

  const loadRankings = useCallback(async () => {
    setRankingLoading(true);
    setRankingError('');
    try {
      const data = await apiService.getRankings(5);
      console.log('Rankings response:', data);
      if (data.success && data.rankings) {
        setRankings(data.rankings);
        setLastUpdated(data.lastUpdated);
      } else {
        console.error('Rankings API returned success: false or no rankings');
        setRankings([]);
        setRankingError(data.error || '랭킹 데이터를 가져오지 못했습니다');
      }
    } catch (e) {
      console.error('Load rankings error:', e);
      setRankings([]);
      setRankingError('랭킹 로딩 중 오류 발생');
    } finally {
      setRankingLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        console.log('Loading explore data...');
        const [ccaData, rankingData, newCCAData] = await Promise.all([
          apiService.getCCAs(),
          apiService.getRankings(5),
          apiService.getNewCCAs(10, 30)
        ]);
        console.log('CCA data:', ccaData);
        console.log('Ranking data:', rankingData);
        console.log('New CCA data:', newCCAData);

        setCreators(ccaData);
        if (rankingData.success && rankingData.rankings) {
          setRankings(rankingData.rankings);
          setLastUpdated(rankingData.lastUpdated);
        } else {
          console.error('Rankings failed:', rankingData);
          console.error('Rankings error details:', rankingData.error, rankingData.details);
          setRankings([]);
          setRankingError(rankingData.error || '랭킹 데이터를 가져오지 못했습니다');
        }
        if (newCCAData.success && newCCAData.ccas) {
          setNewCCAs(newCCAData.ccas);
        } else {
          console.error('New CCAs failed:', newCCAData);
          console.error('New CCAs error details:', newCCAData.error, newCCAData.details);
          setNewCCAs([]);
          setNewCCAError(newCCAData.error || '신규 CCA 데이터를 가져오지 못했습니다');
        }
      } catch (e) {
        console.error('Load data error:', e);
        setRankings([]);
        setNewCCAs([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    // Auto-refresh rankings every 30 seconds
    const interval = setInterval(loadRankings, 30000);
    return () => clearInterval(interval);
  }, [loadRankings]);

  const goToProfile = (nickname: string) => {
    navigate(`/@${nickname}`);
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
          <span className="ft-ex-subtitle">
            팬들이 가장 많이 찾은 크리에이터
            {lastUpdated && (
              <span style={{ fontSize: 11, opacity: 0.6, marginLeft: 8 }}>
                업데이트: {new Date(lastUpdated).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          {rankings.length > 0 ? rankings.map((item) => (
            <div key={item.id} className="ft-ex-rank-item" onClick={() => goToProfile(item.nickname || item.name)}>
              <span className={`ft-ex-rank-num ${item.rank <= 3 ? 'top-3' : ''}`}>{item.rank}</span>
              <div style={{ position: 'relative' }}>
                <img src={item.image} className="ft-ex-rank-av" alt="" />
                {item.isWorking && (
                  <div style={{ position: 'absolute', bottom: -4, right: -4, background: '#22c55e', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, border: '2px solid var(--ft-bg)' }}>
                    ON
                  </div>
                )}
              </div>
              <div className="ft-ex-rank-info">
                <div className="ft-ex-rank-name">{item.nickname || item.name}</div>
                <div className="ft-ex-rank-sub">
                  ❤️ {item.recentLikes} • 💬 {item.recentComments} • 👥 +{item.newFollowers7d}
                </div>
              </div>
              <span className="material-symbols-outlined" style={{ color: 'var(--ft-primary)', fontSize: 18 }}>trending_up</span>
            </div>
          )) : rankingError ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--ft-danger)' }}>
              {rankingError}
            </div>
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--ft-text-tertiary)' }}>
              랭킹 데이터를 불러오는 중...
            </div>
          )}
        </div>
      </section>

      {/* ═══ New Rising Stars (Magazine Grid) ═══ */}
      <section className="ft-ex-section">
        <div className="ft-ex-head">
          <h2 className="ft-ex-title">새로운 원석의 발견</h2>
          <span className="ft-ex-subtitle">최근 30일 내 신규 크리에이터</span>
        </div>
        <div className="ft-ex-grid">
          {newCCAs.length > 0 ? newCCAs.map(cca => (
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
                    <span className="ft-ex-glass-tag">POST {cca.postCount}</span>
                    <span className="ft-ex-glass-tag">👥 {cca.totalFollowers}</span>
                  </div>
                </div>
              </div>
            </div>
          )) : newCCAError ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--ft-danger)' }}>
              {newCCAError}
            </div>
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--ft-text-tertiary)' }}>
              신규 크리에이터를 찾는 중...
            </div>
          )}
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
