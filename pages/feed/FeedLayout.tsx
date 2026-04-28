import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

import { apiService } from '../../services/apiService';
import { CCA } from '../../types';
import FeedHome from './FeedHome';
import FeedExplore from './FeedExplore';
import FeedSearch from './FeedSearch';
import FeedMessages from './FeedMessages';
import FeedMembership from './FeedMembership';
import FeedSettings from './FeedSettings';
import './FeedLayout.css';

const NAV_ITEMS = [
  { path: '/feed', icon: 'home', label: '홈' },
  { path: '/explore', icon: 'explore', label: '탐색' },
  { path: '/messages', icon: 'send', label: '메시지' },
  { path: '/search', icon: 'search', label: '검색' },
  { path: '/membership', icon: 'workspace_premium', label: '멤버십' },
];

const THEME_KEY = 'ft-theme';
type Theme = 'dark' | 'light';

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {}
  return 'dark';
}

const getPageComponent = (pathname: string, theme: Theme, toggleTheme: () => void) => {
  switch (pathname) {
    case '/explore': return <FeedExplore />;
    case '/search': return <FeedSearch />;
    case '/messages': return <FeedMessages />;
    case '/membership': return <FeedMembership />;
    case '/settings': return <FeedSettings theme={theme} toggleTheme={toggleTheme} />;
    case '/':
    case '/feed':
    default:
      return <FeedHome />;
  }
};

const FeedLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isGuest, setIsGuest] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(!user && !isGuest);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [recoCCAs, setRecoCCAs] = useState<CCA[]>([]);

  const openLoginModal = () => setShowLoginModal(true);
  const closeLoginModal = () => setShowLoginModal(false);

  const handleNavigate = (path: string) => {
    if (!user && !isGuest) {
      openLoginModal();
      return;
    }
    // Guest can only go to home (feed) or stay on current page
    if (isGuest && path !== '/feed' && path !== '/settings') {
      openLoginModal();
      return;
    }
    navigate(path);
  };

  useEffect(() => {
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
  }, [theme]);

  useEffect(() => {
    const loadReco = async () => {
      try {
        const data = await apiService.getCCAs();
        setRecoCCAs(data.slice(0, 5));
      } catch (e) { console.error(e); }
    };
    loadReco();
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const isActive = (path: string) => {
    if (path === '/feed') return location.pathname === '/' || location.pathname === '/feed';
    return location.pathname === path;
  };

  const isDark = theme === 'dark';

  return (
    <>
      <div className={`ft-app ${isDark ? 'ft-dark' : ''}`}>
        
        {/* ═══ PC Sidebar ═══ */}
        <aside className="ft-sidebar-pc">
          <div className="ft-side-logo" onClick={() => navigate('/feed')}>
            <div className="ft-side-logo-icon">L</div>
            <div className="ft-side-logo-text">LUMINARY</div>
          </div>

          <nav className="ft-side-nav">
            {NAV_ITEMS.map(item => (
              <button
                key={item.path}
                className={`ft-side-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => handleNavigate(item.path)}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
            <button className={`ft-side-item ${location.pathname === '/settings' ? 'active' : ''}`} onClick={() => handleNavigate('/settings')}>
              <span className="material-symbols-outlined">person</span>
              <span>프로필</span>
            </button>
          </nav>

          <div className="ft-side-footer">
            <button className="ft-side-item" onClick={toggleTheme}>
              <span className="material-symbols-outlined">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
              <span>테마 변경</span>
            </button>
          </div>
        </aside>

        {/* ═══ Main Body ═══ */}
        <div className={`ft-main-container ${showLoginModal ? 'ft-blur' : ''}`}>
          
          {/* Center: Content */}
          <div className="ft-center-col">
            {getPageComponent(location.pathname, theme, toggleTheme)}
          </div>

          {/* Right: Recommendations */}
          <aside className="ft-right-col">
            <div className="ft-right-profile">
              <div className="ft-right-avatar">
                <img src={user?.profileImage || "https://ui-avatars.com/api/?name=" + (user?.nickname || "U")} alt="" />
              </div>
              <div className="ft-right-user-info">
                <div className="ft-right-username">{user?.nickname || "Guest"}</div>
                <div className="ft-right-name">{user?.realName || "Luminary Member"}</div>
              </div>
              <button className="ft-switch-btn" onClick={() => navigate('/settings')}>전환</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ft-text-secondary)' }}>추천 크리에이터</div>
              <div style={{ fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>모두 보기</div>
            </div>

            {recoCCAs.map(cca => (
              <div key={cca.id} className="ft-reco-item">
                <div className="ft-reco-avatar">
                  <img src={cca.image} alt="" />
                </div>
                <div className="ft-reco-info">
                  <div className="ft-reco-name">{cca.nickname || cca.name}</div>
                  <div className="ft-reco-sub">최근 활동 중</div>
                </div>
                <button className="ft-follow-btn" onClick={() => navigate(`/@${cca.nickname || cca.name}`)}>팔로우</button>
              </div>
            ))}

            <div style={{ marginTop: 30, fontSize: 11, color: 'var(--ft-text-tertiary)', lineHeight: 1.6 }}>
              도움말 · 약관 · 개인정보처리방침 · Luminary Verified
              <br /><br />
              © 2026 LUMINARY
            </div>
          </aside>
        </div>

        {/* ═══ Floating Message ═══ */}
        <div className="ft-floating-msg" onClick={() => handleNavigate('/messages')}>
          <span className="material-symbols-outlined">send</span>
          <span style={{ fontWeight: 700, fontSize: 14, marginLeft: 4 }}>메시지</span>
        </div>

        {/* ═══ Mobile Tabbar ═══ */}
        <nav className="ft-tabbar">
          {NAV_ITEMS.map(item => (
            <button
              key={item.path}
              className={`ft-tabbar-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => handleNavigate(item.path)}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
            </button>
          ))}
        </nav>

      </div>
      {showLoginModal && (
        <div className="ft-login-overlay">
          <div className="ft-login-modal">
            <div className="ft-login-banner">가입하고 더 많은 콘텐츠를 자유롭게!</div>
            <h2>로그인</h2>
            <input type="email" placeholder="이메일" className="ft-input" />
            <input type="password" placeholder="비밀번호" className="ft-input" />
            <button className="ft-primary-btn" onClick={() => { /* placeholder login */ closeLoginModal(); }}>
              로그인
            </button>
            <button className="ft-secondary-btn" onClick={() => { /* placeholder register */ closeLoginModal(); }}>
              회원가입
            </button>
            <button className="ft-guest-btn" onClick={() => { setIsGuest(true); closeLoginModal(); }}>
              게스트로 구경하기
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FeedLayout;
