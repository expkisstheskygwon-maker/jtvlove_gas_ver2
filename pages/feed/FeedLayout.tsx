import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import FeedHome from './FeedHome';
import FeedExplore from './FeedExplore';
import FeedSearch from './FeedSearch';
import FeedMessages from './FeedMessages';
import FeedMembership from './FeedMembership';
import FeedSettings from './FeedSettings';
import './FeedLayout.css';

const NAV_ITEMS = [
  { path: '/feed', icon: 'home', label: '피드' },
  { path: '/explore', icon: 'explore', label: '탐색' },
  { path: '/messages', icon: 'send', label: '메시지' },
  { path: '/search', icon: 'search', label: '검색' },
  { path: '/membership', icon: 'star', label: '멤버십' },
  { path: '/settings', icon: 'settings', label: '개인 설정' },
];

// 현재 경로에 따라 적절한 페이지 컴포넌트를 반환
const getPageComponent = (pathname: string) => {
  switch (pathname) {
    case '/explore': return <FeedExplore />;
    case '/search': return <FeedSearch />;
    case '/messages': return <FeedMessages />;
    case '/membership': return <FeedMembership />;
    case '/settings': return <FeedSettings />;
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

  const isActive = (path: string) => {
    if (path === '/feed') return location.pathname === '/' || location.pathname === '/feed';
    return location.pathname.startsWith(path);
  };

  const handleNav = (path: string) => {
    navigate(path);
  };

  return (
    <div className="ft-app">
      {/* Desktop Sidebar */}
      <aside className="ft-sidebar">
        <div className="ft-sidebar-logo">
          <div className="ft-sidebar-logo-icon">L</div>
          <span className="ft-sidebar-logo-text">LUMINARY</span>
        </div>

        {/* Profile */}
        <div className="ft-sidebar-profile">
          {user ? (
            <>
              <div className="ft-sidebar-avatar-placeholder">
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>person</span>
              </div>
              <div className="ft-sidebar-user-info">
                <div className="ft-sidebar-username">{user.nickname || user.realName || 'User'}</div>
                <div className="ft-sidebar-handle">@{user.nickname || 'user'}</div>
              </div>
            </>
          ) : (
            <button
              onClick={() => navigate('/login')}
              style={{
                width: '100%', padding: '10px 16px',
                background: 'var(--ft-primary)', color: '#fff',
                border: 'none', borderRadius: 'var(--ft-radius-md)',
                fontWeight: 700, fontSize: 13,
              }}
            >
              로그인
            </button>
          )}
        </div>

        {/* Nav Items */}
        <nav className="ft-sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.path}
              className={`ft-nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => handleNav(item.path)}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="ft-sidebar-footer">
          <div className="ft-sidebar-footer-links">
            <a className="ft-sidebar-footer-link" href="#">운영정책</a>
            <a className="ft-sidebar-footer-link" href="#">이용약관</a>
            <a className="ft-sidebar-footer-link" href="#">개인정보보호</a>
            <a className="ft-sidebar-footer-link" href="#">도움말</a>
          </div>
          <div className="ft-sidebar-copyright">©LUMINARY All Rights Reserved.</div>
        </div>
      </aside>

      {/* Main Content — pathname 기반 페이지 렌더링 */}
      <main className="ft-main">
        <div className="ft-content">
          {getPageComponent(location.pathname)}
        </div>
      </main>

      {/* Mobile Tabbar */}
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
            onClick={() => handleNav(item.path)}
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

