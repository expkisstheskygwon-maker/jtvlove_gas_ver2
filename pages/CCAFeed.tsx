import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { CCA, MediaItem } from '../types';
import './CCAFeed.css';

// ─── i18n Configuration ──────────────────────
const LANGUAGES = {
  ko: {
    home: "홈",
    ccas: "CCA 멤버",
    ranking: "연말 랭킹",
    live: "라이브 & 이벤트",
    fanclub: "팬클럽",
    following: "내가 팔로우한",
    trending: "이번 주 인기 멤버",
    heroBadge: "이번 주의 루미너리",
    latest: "최신 피드",
    rising: "급상승 라이징 스타",
    fanActivity: "팬 활동",
    follow: "팔로우",
    following_btn: "팔로잉",
    letter: "팬레터",
    toast: "별 토스트",
    language: "English",
    tagline: "모든 CCA가 빛나는 곳",
    no_posts: "아직 등록된 포스트가 없습니다."
  },
  en: {
    home: "Home",
    ccas: "CCAs",
    ranking: "Ranking",
    live: "Live & Events",
    fanclub: "Fanclub",
    following: "Following",
    trending: "Trending this week",
    heroBadge: "Luminary of the Week",
    latest: "Latest from your CCAs",
    rising: "Rising Stars",
    fanActivity: "Fan Activity",
    follow: "Follow",
    following_btn: "Following",
    letter: "Fan Letter",
    toast: "Star Toast",
    language: "한국어",
    tagline: "Where every CCA shines",
    no_posts: "No posts yet — stay tuned!"
  }
};

const CCAFeed: React.FC = () => {
  const { user } = useAuth();
  
  // ─── State ───
  const [lang, setLang] = useState<'ko' | 'en'>('ko');
  const t = LANGUAGES[lang];
  
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [ccas, setCCAs] = useState<CCA[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroCCA, setHeroCCA] = useState<CCA | null>(null);

  // ─── Data Loading ──────────────────────────
  const init = useCallback(async () => {
    setLoading(true);
    try {
      const [feedData, ccasData] = await Promise.all([
        apiService.getFeed(1, 20, user?.id),
        apiService.getCCAs()
      ]);
      
      setFeedItems(feedData.items || []);
      const activeCCAs = ccasData.filter((c: any) => c.status === 'active');
      setCCAs(activeCCAs);
      
      // Select hero (top rated or random high score)
      if (activeCCAs.length > 0) {
        const top = [...activeCCAs].sort((a, b) => (b.score || 0) - (a.score || 0))[0];
        setHeroCCA(top);
      }

      if (user?.id) {
        const followData = await apiService.checkCCAFollow(user.id, '');
        if (followData.followedIds) {
          setFollowing(followData.followedIds);
        }
      }
    } catch (err) {
      console.error('Luminary init error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    init();
  }, [init]);

  // ─── Handlers ─────────────────────────────
  const toggleFollow = async (ccaId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      window.location.hash = '/login';
      return;
    }
    
    const isFollowing = following.includes(ccaId);
    if (isFollowing) {
      setFollowing(prev => prev.filter(id => id !== ccaId));
    } else {
      setFollowing(prev => [...prev, ccaId]);
    }
    
    await apiService.toggleCCAFollow(user.id, ccaId);
  };

  const goToProfile = (nickname: string) => {
    window.location.hash = `/@${nickname}`;
  };

  const handleLangToggle = () => {
    setLang(prev => prev === 'ko' ? 'en' : 'ko');
  };

  if (loading && feedItems.length === 0) {
    return (
      <div className="luminary-theme luminary-loading" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="feed-spinner"></div>
      </div>
    );
  }

  return (
    <div className="luminary-theme">
      {/* Language Toggle */}
      <button className="luminary-lang-toggle" onClick={handleLangToggle}>
        {t.language}
      </button>

      {/* Sidebar (Desktop) */}
      <aside className="luminary-sidebar">
        <div className="luminary-logo">
          <span className="luminary-logo-text">LUMINARY</span>
          <span className="luminary-tagline">{t.tagline}</span>
        </div>

        <nav className="luminary-nav">
          <a href="#/feed" className="luminary-nav-link active">
            <span className="material-symbols-outlined">home</span>
            <span>{t.home}</span>
          </a>
          <a href="#/ccas" className="luminary-nav-link">
            <span className="material-symbols-outlined">groups</span>
            <span>{t.ccas}</span>
          </a>
          <a href="#/ranking" className="luminary-nav-link">
            <span className="material-symbols-outlined">trophy</span>
            <span>{t.ranking}</span>
          </a>
          <a href="#/notice" className="luminary-nav-link">
            <span className="material-symbols-outlined">campaign</span>
            <span>{t.live}</span>
          </a>
        </nav>

        {user && following.length > 0 && (
          <div className="luminary-nav-section">
            <h4 style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 16 }}>{t.following}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ccas.filter(c => following.includes(c.id)).slice(0, 5).map(cca => (
                <a key={cca.id} onClick={() => goToProfile(cca.nickname || cca.name)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
                  <img src={cca.image} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{cca.nickname || cca.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="luminary-main">
        {/* Hero Section */}
        {heroCCA && (
          <section className="luminary-hero">
            <img src={heroCCA.image} alt={heroCCA.nickname} className="luminary-hero-img" />
            <div className="luminary-hero-content">
              <span className="luminary-hero-badge">{t.heroBadge}</span>
              <h2 className="luminary-hero-title">{heroCCA.nickname || heroCCA.name}</h2>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--luminary-gold)', fontWeight: 700 }}>#{heroCCA.venueName}</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{heroCCA.rating}% Love Rating</span>
              </div>
              <button 
                onClick={() => goToProfile(heroCCA.nickname || heroCCA.name)}
                style={{ marginTop: 12, backgroundColor: '#fff', color: '#000', border: 'none', padding: '10px 24px', borderRadius: 12, fontWeight: 800, cursor: 'pointer', width: 'fit-content' }}
              >
                View Profile
              </button>
            </div>
          </section>
        )}

        {/* Trending Section */}
        <section style={{ marginBottom: 48 }}>
          <div className="luminary-section-header">
            <h3 className="luminary-section-title">{t.trending}</h3>
            <a href="#/ccas" style={{ fontSize: 12, fontWeight: 700, color: 'var(--luminary-gold)', textDecoration: 'none' }}>{t.ccas} →</a>
          </div>
          <div className="luminary-trending-scroll">
            {ccas.slice(0, 10).map(cca => (
              <a key={cca.id} onClick={() => goToProfile(cca.nickname || cca.name)} className="luminary-cca-card">
                <img src={cca.image} alt="" className="luminary-cca-avatar" />
                <div className="luminary-cca-info">
                  <div className="luminary-cca-name">{cca.nickname || cca.name}</div>
                  <div className="luminary-cca-branch">{cca.venueName}</div>
                </div>
                <button 
                  onClick={(e) => toggleFollow(cca.id, e)}
                  style={{
                    backgroundColor: following.includes(cca.id) ? 'transparent' : 'var(--luminary-gold)',
                    border: following.includes(cca.id) ? '1px solid #444' : 'none',
                    color: following.includes(cca.id) ? '#888' : '#000',
                    width: '100%', padding: '6px 0', borderRadius: 8, fontSize: 11, fontWeight: 800
                  }}
                >
                  {following.includes(cca.id) ? t.following_btn : t.follow}
                </button>
              </a>
            ))}
          </div>
        </section>

        {/* Home Feed */}
        <section>
          <div className="luminary-section-header">
            <h3 className="luminary-section-title">{t.latest}</h3>
          </div>
          {feedItems.length > 0 ? (
            <div className="luminary-feed-grid">
              {feedItems.map((item, idx) => (
                <article key={item.id} className="luminary-feed-card">
                  <img src={item.url} alt="" className="luminary-feed-media" onClick={() => goToProfile(item.ccaNickname || item.ccaName)} />
                  <div className="luminary-feed-content">
                    <div className="luminary-feed-header">
                      <img src={item.ccaImage} alt="" className="luminary-feed-avatar" onClick={() => goToProfile(item.ccaNickname || item.ccaName)} />
                      <div>
                        <div className="luminary-feed-username" onClick={() => goToProfile(item.ccaNickname || item.ccaName)}>{item.ccaNickname || item.ccaName}</div>
                        <div className="luminary-feed-time">{item.venueName} · {item.date.split('T')[0]}</div>
                      </div>
                    </div>
                    <p className="luminary-feed-caption">{item.caption}</p>
                    <div style={{ display: 'flex', gap: 16, marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
                      <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>favorite</span>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{item.likes}</span>
                      </button>
                      <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chat_bubble</span>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{item.commentsCount}</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 0', opacity: 0.5 }}>
              <p>{t.no_posts}</p>
            </div>
          )}
        </section>
      </main>

      {/* Mobile Tabbar */}
      <nav className="luminary-tabbar">
        <a href="#/feed" className="luminary-tabbar-item active">
          <span className="material-symbols-outlined">home</span>
          <span className="luminary-tabbar-label">{t.home}</span>
        </a>
        <a href="#/ccas" className="luminary-tabbar-item">
          <span className="material-symbols-outlined">groups</span>
          <span className="luminary-tabbar-label">{t.ccas}</span>
        </a>
        <a href="#/ranking" className="luminary-tabbar-item">
          <span className="material-symbols-outlined">trophy</span>
          <span className="luminary-tabbar-label">{t.ranking}</span>
        </a>
        <a href="#/mypage" className="luminary-tabbar-item">
          <span className="material-symbols-outlined">person</span>
          <span className="luminary-tabbar-label">Profile</span>
        </a>
      </nav>
    </div>
  );
};

export default CCAFeed;
