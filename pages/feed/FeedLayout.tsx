import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import FeedHome from './FeedHome';
import FeedExplore from './FeedExplore';
import FeedSearch from './FeedSearch';
import FeedMessages from './FeedMessages';
import FeedMembership from './FeedMembership';
import FeedSettings from './FeedSettings';
import './FeedLayout.css';

// ─── Nav & Page Config ──────────────────────
const NAV_ITEMS = [
  { path: '/feed', icon: 'home', label: '피드' },
  { path: '/explore', icon: 'explore', label: '탐색' },
  { path: '/messages', icon: 'send', label: '메시지' },
  { path: '/search', icon: 'search', label: '검색' },
  { path: '/membership', icon: 'workspace_premium', label: '멤버십' },
];

const PAGE_TITLES: Record<string, string> = {
  '/': '피드',
  '/feed': '피드',
  '/explore': '탐색',
  '/messages': '메시지',
  '/search': '검색',
  '/membership': '멤버십',
  '/settings': '설정',
};

// ─── Theme ──────────────────────────────────
const THEME_KEY = 'ft-theme';
type Theme = 'dark' | 'light';

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {}
  return 'dark';
}

// ─── Page Router ────────────────────────────
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

// ═══════════════════════════════════════════════
// LUMINARY — Original Layout
// Icon Rail (left) + Top Bar + Content Center
// ═══════════════════════════════════════════════
const FeedLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const isActive = (path: string) => {
    if (path === '/feed') return location.pathname === '/' || location.pathname === '/feed';
    return location.pathname === path;
  };

  const isDark = theme === 'dark';
  const pageTitle = PAGE_TITLES[location.pathname] || '피드';

  return (
    <div className={`ft-app ${isDark ? 'ft-dark' : ''}`}>

      {/* ═══ Icon Rail (Desktop) ═══ */}
      <aside className="ft-rail">
        <div className="ft-rail-logo" onClick={() => navigate('/feed')}>L</div>

        <nav className="ft-rail-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.path}
              className={`ft-rail-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              data-tooltip={item.label}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
            </button>
          ))}
        </nav>

        <div className="ft-rail-bottom">
          <button className="ft-rail-theme" onClick={toggleTheme} data-tooltip={isDark ? '라이트 모드' : '다크 모드'}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          <button
            className="ft-rail-avatar"
            onClick={() => navigate('/settings')}
            data-tooltip="설정"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>person</span>
          </button>
        </div>
      </aside>

      {/* ═══ Top Bar ═══ */}
      <header className="ft-topbar">
        <div className="ft-topbar-title">{pageTitle}</div>
        <div className="ft-topbar-actions">
          <button className="ft-topbar-btn" onClick={() => navigate('/search')}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>search</span>
          </button>
          <button className="ft-topbar-btn">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>notifications</span>
          </button>
          {user ? (
            <div
              className="ft-rail-avatar"
              onClick={() => navigate('/settings')}
              style={{ width: 34, height: 34, cursor: 'pointer' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person</span>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '7px 16px',
                background: 'var(--ft-gradient)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--ft-radius-full)',
                fontWeight: 700, fontSize: 12,
              }}
            >
              로그인
            </button>
          )}
        </div>
      </header>

      {/* ═══ Main Content ═══ */}
      <main className="ft-body">
        <div className="ft-content">
          {getPageComponent(location.pathname, theme, toggleTheme)}
        </div>
      </main>

      {/* ═══ Mobile Tabbar ═══ */}
      <nav className="ft-tabbar">
        {[
          { path: '/feed', icon: 'home', label: '피드' },
          { path: '/explore', icon: 'explore', label: '탐색' },
          { path: '/search', icon: 'search', label: '검색' },
          { path: '/messages', icon: 'send', label: '메시지' },
          { path: '/settings', icon: 'person', label: '마이' },
        ].map(item => (
          <button
            key={item.path}
            className={`ft-tabbar-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="ft-tabbar-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default FeedLayout;
