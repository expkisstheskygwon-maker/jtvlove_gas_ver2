import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

import { apiService } from '../../services/apiService';
import { CCA, UserNotification } from '../../types';
import FeedHome from './FeedHome';
import FeedExplore from './FeedExplore';
import FeedSearch from './FeedSearch';
import FeedMessages from './FeedMessages';
import FeedMembership from './FeedMembership';
import FeedSettings from './FeedSettings';
import FeedNotifications from './FeedNotifications';
import FeedProfile from './FeedProfile';
import FeedSecret from './FeedSecret';
import './FeedLayout.css';

const NAV_ITEMS = [
  { path: '/feed', icon: 'home', label: '홈' },
  { path: '/explore', icon: 'explore', label: '탐색' },
  { path: '/secret', icon: 'lock', label: '비밀대화' },
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

const getPageComponent = (pathname: string, theme: Theme, toggleTheme: () => void, handleNavigate: (path: string) => void) => {
  switch (pathname) {
    case '/explore': return <FeedExplore />;
    case '/search': return <FeedSearch />;
    case '/messages': return <FeedMessages />;
    case '/membership': return <FeedMembership />;
    case '/secret': return <FeedSecret />;
    case '/settings': return <FeedSettings theme={theme} toggleTheme={toggleTheme} />;
    case '/notifications': return <FeedNotifications />;
    default:
      if (pathname.startsWith('/@')) {
        const username = pathname.substring(2);
        return <FeedProfile forcedUsername={username} />;
      }
      return <FeedHome handleNavigate={handleNavigate} />;
  }
};

const FeedLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [isGuest, setIsGuest] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(!user && !isGuest);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [recoCCAs, setRecoCCAs] = useState<CCA[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [showEmptyBubble, setShowEmptyBubble] = useState(false);

  // Sync login modal state with user auth status
  useEffect(() => {
    if (user) {
      setShowLoginModal(false);
    }
  }, [user]);

  // Login Form State
  const [loginTab, setLoginTab] = useState<'general' | 'star'>('general');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // CCA Login Step-by-Step
  const [ccaStep, setCcaStep] = useState<'enter_nickname' | 'select_cca' | 'enter_password'>('enter_nickname');
  const [ccaNickname, setCcaNickname] = useState('');
  const [matchedCCAs, setMatchedCCAs] = useState<CCA[]>([]);
  const [selectedCca, setSelectedCca] = useState<CCA | null>(null);
  const [ccaPassword, setCcaPassword] = useState('');

  const openLoginModal = () => setShowLoginModal(true);
  const closeLoginModal = () => {
    setShowLoginModal(false);
    setLoginError('');
  };

  const handleModalLogin = async () => {
    if (!email || !password) {
      setLoginError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');

    try {
      const result = await apiService.login({ email, password });
      if (result.success && result.user) {
        const userData = typeof result.user === 'string' ? JSON.parse(result.user) : result.user;
        login(userData);
        closeLoginModal();
      } else {
        setLoginError(result.error || '로그인에 실패했습니다.');
      }
    } catch (err: any) {
      setLoginError(err.message || '오류가 발생했습니다.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCcaSearch = async () => {
    if (!ccaNickname.trim()) return;
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const allCCAs = await apiService.getCCAs();
      const matches = allCCAs.filter(c => (c.nickname || c.name || '').toUpperCase() === ccaNickname.toUpperCase().trim());
      if (matches.length > 0) {
        setMatchedCCAs(matches);
        if (matches.length === 1) {
          setSelectedCca(matches[0]);
          setCcaStep('enter_password');
        } else {
          setCcaStep('select_cca');
        }
      } else {
        setLoginError('입력하신 닉네임의 STAR를 찾을 수 없습니다.');
      }
    } catch (err: any) {
      setLoginError('검색 중 오류가 발생했습니다.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCcaLogin = async () => {
    if (!selectedCca || !ccaPassword) return;
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const result = await apiService.login({ ccaId: selectedCca.id, password: ccaPassword });
      if (result.success && result.user) {
        const userData = typeof result.user === 'string' ? JSON.parse(result.user) : result.user;
        login({ ...userData, ccaId: selectedCca.id });
        closeLoginModal();
      } else {
        setLoginError(result.error || '비밀번호가 일치하지 않습니다.');
      }
    } catch (err: any) {
      setLoginError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const resetCcaFlow = () => {
    setCcaStep('enter_nickname');
    setSelectedCca(null);
    setMatchedCCAs([]);
    setCcaPassword('');
    setLoginError('');
  };

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
        const [data, settings] = await Promise.all([
          apiService.getCCAs(),
          apiService.getSiteSettings()
        ]);
        // Filter to only show live CCAs (isWorking === true)
        const liveCCAs = data.filter((c: any) => (c as any).isWorking === true);
        setRecoCCAs(liveCCAs.slice(0, 5));
        if (settings) setSiteSettings(settings);
      } catch (e) { console.error(e); }
    };
    loadReco();
  }, []);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiService.getNotifications(user.id);
      setNotifications(data);
      setUnreadNotifCount(data.filter((n: any) => n.is_read === 0 || n.is_read === false).length);
    } catch (e) { console.error(e); }
  }, [user]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Auto-search CCA nickname when typing (Debounce)
  useEffect(() => {
    if (loginTab === 'star' && ccaStep === 'enter_nickname' && ccaNickname.length >= 2) {
      const timer = setTimeout(() => {
        handleCcaSearch();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [ccaNickname, loginTab, ccaStep]);

  const handleNotificationButtonClick = () => {
    if (!user && !isGuest) {
      openLoginModal();
      return;
    }
    if (notifications.length > 0) {
      navigate('/notifications');
    } else {
      setShowEmptyBubble(true);
      setTimeout(() => setShowEmptyBubble(false), 2000);
    }
  };

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
          <div className="ft-side-logo" onClick={() => navigate('/feed')} style={{ cursor: 'pointer' }}>
            <div className="ft-side-logo-emblem">
              {siteSettings?.emblem_url ? (
                <img src={siteSettings.emblem_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <div style={{ width: 36, height: 36, background: 'var(--ft-gradient)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>J</span>
                </div>
              )}
            </div>
            <div className="ft-side-logo-full">
              {siteSettings?.logo_url ? (
                <img src={siteSettings.logo_url} alt="JTVLOVE" style={{ height: 30, objectFit: 'contain' }} />
              ) : (
                <span style={{ fontWeight: 800, fontSize: 20 }}>JTVLOVE</span>
              )}
            </div>
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
              <span className="material-symbols-outlined">settings</span>
              <span>설정</span>
            </button>

            {user?.ccaId && (
              <button
                className="ft-side-item"
                onClick={() => handleNavigate(`/@${user.nickname}?upload=true`)}
                style={{ marginTop: 16, background: 'var(--ft-gradient)', color: '#fff', borderRadius: 14, boxShadow: '0 4px 15px rgba(238, 189, 43, 0.3)' }}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                <span style={{ fontWeight: 800 }}>업로드</span>
              </button>
            )}
          </nav>

          <div className="ft-side-footer">
            <div className="ft-nav-notif">
              <button
                className={`ft-side-item ${location.pathname === '/notifications' ? 'active' : ''}`}
                onClick={handleNotificationButtonClick}
              >
                <span className="material-symbols-outlined">notifications</span>
                <span>알림</span>
                {unreadNotifCount > 0 && (
                  <div className="ft-notif-badge">
                    {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                  </div>
                )}
              </button>

              {showEmptyBubble && (
                <div className="ft-empty-bubble">
                  새로운 알림이 없습니다
                </div>
              )}
            </div>
            {user?.ccaId && (
              <button
                className="ft-side-item"
                onClick={() => handleNavigate(`/@${user.nickname}`)}
              >
                <span className="material-symbols-outlined">account_circle</span>
                <span>내 프로필</span>
              </button>
            )}
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
            {getPageComponent(location.pathname, theme, toggleTheme, handleNavigate)}
          </div>

          {/* Right: Recommendations */}
          <aside className="ft-right-col">
            <div className="ft-right-profile">
              <div className="ft-right-avatar">
                <img src={user?.profileImage || "https://ui-avatars.com/api/?name=" + (user?.nickname || "U")} alt="" />
              </div>
              <div className="ft-right-user-info">
                <div className="ft-right-username">{user?.nickname || "Guest"}</div>
                <div className="ft-right-name">{user?.realName || "JTVLOVE Member"}</div>
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
                <button className="ft-follow-btn" onClick={() => handleNavigate(`/@${cca.nickname || cca.name}`)}>팔로우</button>
              </div>
            ))}

            <div style={{ marginTop: 30, fontSize: 11, color: 'var(--ft-text-tertiary)', lineHeight: 1.6 }}>
              도움말 · 약관 · 개인정보처리방침 · JTVLOVE Verified
              <br /><br />
              © 2026 JTVLOVE
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
          <button
            className={`ft-tabbar-item ${location.pathname === '/notifications' ? 'active' : ''}`}
            onClick={handleNotificationButtonClick}
            style={{ position: 'relative' }}
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadNotifCount > 0 && (
              <div className="ft-notif-badge" style={{ top: -2, right: -2, left: 'auto' }}>
                {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
              </div>
            )}
          </button>
        </nav>

      </div>
      {showLoginModal && (
        <div className="ft-login-overlay">
          <div className="ft-login-modal">
            <div className="ft-login-banner">가입하고 더 많은 콘텐츠를 자유롭게!</div>
            
            {/* Login Tabs */}
            <div className="ft-login-tabs">
              <button 
                className={`ft-login-tab ${loginTab === 'general' ? 'active' : ''}`}
                onClick={() => { setLoginTab('general'); setLoginError(''); }}
              >일반 유저</button>
              <button 
                className={`ft-login-tab ${loginTab === 'star' ? 'active' : ''}`}
                onClick={() => { setLoginTab('star'); resetCcaFlow(); }}
              >STAR (CCA)</button>
            </div>

            {loginError && <div className="ft-login-error">{loginError}</div>}

            {loginTab === 'general' ? (
              <div className="animate-fade-in">
                <input 
                  type="email" 
                  placeholder="이메일" 
                  className="ft-input" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleModalLogin()}
                />
                <input 
                  type="password" 
                  placeholder="비밀번호" 
                  className="ft-input" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleModalLogin()}
                />
                <button 
                  className="ft-primary-btn" 
                  onClick={handleModalLogin}
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? '로그인 중...' : '로그인'}
                </button>
              </div>
            ) : (
              /* STAR Login Flow */
              <div className="animate-fade-in">
                {ccaStep === 'enter_nickname' && (
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      placeholder="STAR 닉네임 (대문자)" 
                      className="ft-input" 
                      value={ccaNickname}
                      onChange={(e) => setCcaNickname(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleCcaSearch()}
                      autoFocus
                    />
                    {isLoggingIn && (
                      <div style={{ position: 'absolute', right: 15, top: 18 }}>
                        <div className="ft-spinner-sm"></div>
                      </div>
                    )}
                    <p style={{ fontSize: 11, color: 'var(--ft-text-tertiary)', textAlign: 'center', marginTop: -10, marginBottom: 20 }}>닉네임을 입력하면 자동으로 검색합니다.</p>
                  </div>
                )}

                {ccaStep === 'select_cca' && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 12, color: 'var(--ft-text-secondary)', marginBottom: 10 }}>본인의 프로필을 선택해주세요:</p>
                    <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {matchedCCAs.map(cca => (
                        <button 
                          key={cca.id}
                          className="ft-cca-select-item"
                          onClick={() => { setSelectedCca(cca); setCcaStep('enter_password'); setLoginError(''); }}
                        >
                          <img src={cca.image} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: 13, fontWeight: 800 }}>{cca.nickname}</div>
                            <div style={{ fontSize: 10, color: 'var(--ft-text-tertiary)' }}>{cca.venueName}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <button className="ft-guest-btn" onClick={resetCcaFlow} style={{ marginTop: 12 }}>다시 검색하기</button>
                  </div>
                )}

                {ccaStep === 'enter_password' && selectedCca && (
                  <>
                    <div className="ft-cca-selected-info">
                      <img src={selectedCca.image} alt="" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 14, fontWeight: 900 }}>{selectedCca.nickname}</div>
                        <div style={{ fontSize: 11, color: 'var(--ft-text-tertiary)' }}>{selectedCca.venueName}</div>
                      </div>
                    </div>
                    <input 
                      type="password" 
                      placeholder="비밀번호" 
                      className="ft-input" 
                      value={ccaPassword}
                      onChange={(e) => setCcaPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCcaLogin()}
                      autoFocus
                    />
                    <button 
                      className="ft-primary-btn" 
                      onClick={handleCcaLogin}
                      disabled={isLoggingIn || !ccaPassword}
                    >
                      {isLoggingIn ? '로그인 중...' : '로그인'}
                    </button>
                    <button className="ft-guest-btn" onClick={resetCcaFlow} style={{ marginTop: 12 }}>다른 STAR로 로그인</button>
                  </>
                )}
              </div>
            )}

            <button 
              className="ft-secondary-btn" 
              onClick={() => {
                if (loginTab === 'star') {
                  window.location.href = 'https://jtvstar.com/#/cca-portal/welcome';
                } else {
                  navigate('/register');
                }
              }}
            >
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
