import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface FeedSettingsProps {
  theme?: 'dark' | 'light';
  toggleTheme?: () => void;
}

const FeedSettings: React.FC<FeedSettingsProps> = ({ theme = 'dark', toggleTheme }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const handleLogout = () => {
    logout();
    navigate('/feed');
  };

  const menuItems = [
    { icon: 'person', label: '프로필 수정', desc: '닉네임, 프로필 이미지 변경' },
    { icon: 'notifications', label: '알림 설정', desc: '푸시 알림 및 이메일 설정' },
    { icon: 'lock', label: '비밀번호 변경', desc: '계정 보안 설정' },
    { icon: 'translate', label: '언어 설정', desc: '한국어 / English' },
    { icon: 'help', label: '도움말', desc: 'FAQ 및 고객지원' },
  ];

  return (
    <>
      <div className="ft-page-header">
        <div className="ft-page-title">
          <span>개인 설정</span>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {/* Profile Card */}
        <div className="ft-membership-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="ft-sidebar-avatar-placeholder" style={{ width: 64, height: 64, flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32 }}>person</span>
          </div>
          <div style={{ flex: 1 }}>
            {user ? (
              <>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{user.nickname || user.realName || 'User'}</div>
                <div style={{ fontSize: 13, color: 'var(--ft-text-tertiary)' }}>@{user.nickname || 'user'}</div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--ft-text-tertiary)' }}>로그인이 필요합니다</div>
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    marginTop: 8, padding: '8px 20px',
                    background: 'var(--ft-primary)', color: '#fff',
                    border: 'none', borderRadius: 'var(--ft-radius-sm)',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer'
                  }}
                >
                  로그인하기
                </button>
              </>
            )}
          </div>
        </div>

        {/* Theme Toggle Card */}
        <div className="ft-membership-card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>테마 설정</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {/* Dark */}
            <button
              onClick={() => isDark ? null : toggleTheme?.()}
              style={{
                flex: 1, padding: '16px 12px',
                background: isDark ? 'var(--ft-primary)' : 'var(--ft-bg-tertiary)',
                border: isDark ? '2px solid var(--ft-primary)' : '2px solid var(--ft-border)',
                borderRadius: 'var(--ft-radius-md)',
                color: isDark ? '#fff' : 'var(--ft-text-secondary)',
                fontWeight: 700, fontSize: 13,
                display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 8,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 28 }}>dark_mode</span>
              다크 모드
            </button>
            {/* Light */}
            <button
              onClick={() => !isDark ? null : toggleTheme?.()}
              style={{
                flex: 1, padding: '16px 12px',
                background: !isDark ? 'var(--ft-primary)' : 'var(--ft-bg-tertiary)',
                border: !isDark ? '2px solid var(--ft-primary)' : '2px solid var(--ft-border)',
                borderRadius: 'var(--ft-radius-md)',
                color: !isDark ? '#fff' : 'var(--ft-text-secondary)',
                fontWeight: 700, fontSize: 13,
                display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 8,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 28 }}>light_mode</span>
              라이트 모드
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <div className="ft-membership-card" style={{ padding: 0, overflow: 'hidden' }}>
          {menuItems.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 20px',
                borderBottom: i < menuItems.length - 1 ? '1px solid var(--ft-border-light)' : 'none',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--ft-bg-secondary)')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--ft-text-tertiary)' }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: 'var(--ft-text-tertiary)' }}>{item.desc}</div>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--ft-text-muted)' }}>chevron_right</span>
            </div>
          ))}
        </div>

        {/* Logout */}
        {user && (
          <button
            onClick={handleLogout}
            style={{
              width: '100%', marginTop: 16, padding: '14px',
              background: 'none', border: '1px solid var(--ft-border)',
              borderRadius: 'var(--ft-radius-md)',
              color: 'var(--ft-danger)', fontWeight: 700, fontSize: 14,
              cursor: 'pointer'
            }}
          >
            로그아웃
          </button>
        )}
      </div>
    </>
  );
};

export default FeedSettings;
