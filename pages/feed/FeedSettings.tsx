import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface FeedSettingsProps {
  theme?: 'dark' | 'light';
  toggleTheme?: () => void;
}

const FeedSettings: React.FC<FeedSettingsProps> = ({ theme = 'dark', toggleTheme }) => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  // Modal States
  const [activeModal, setActiveModal] = React.useState<string | null>(null);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Form States
  const [editNickname, setEditNickname] = React.useState(user?.nickname || '');
  const [editRealName, setEditRealName] = React.useState(user?.realName || '');
  const [subscriptionCost, setSubscriptionCost] = React.useState(0);
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [message, setMessage] = React.useState({ text: '', type: '' });

  const handleLogout = () => {
    logout();
    navigate('/feed');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setIsUpdating(true);
      try {
        const result = await apiService.updateUser({ id: user.id, profile_image: base64String });
        if (result.success) {
          updateUser({ profileImage: base64String });
          setMessage({ text: '프로필 이미지가 변경되었습니다.', type: 'success' });
        } else {
          alert('이미지 업로드에 실패했습니다.');
        }
      } catch (err) {
        alert('오류가 발생했습니다.');
      } finally {
        setIsUpdating(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsUpdating(true);
    try {
      const result = await apiService.updateUser({ 
        id: user.id, 
        nickname: editNickname,
        real_name: editRealName
      });
      if (result.success) {
        updateUser({ nickname: editNickname, realName: editRealName });
        setMessage({ text: '프로필이 수정되었습니다.', type: 'success' });
        setTimeout(() => setActiveModal(null), 1500);
      } else {
        setMessage({ text: result.error || '수정에 실패했습니다.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: '오류가 발생했습니다.', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!user || !newPassword) return;
    if (newPassword !== confirmPassword) {
      setMessage({ text: '비밀번호가 일치하지 않습니다.', type: 'error' });
      return;
    }
    setIsUpdating(true);
    try {
      const result = await apiService.updateUser({ id: user.id, password: newPassword });
      if (result.success) {
        setMessage({ text: '비밀번호가 성공적으로 변경되었습니다.', type: 'success' });
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setActiveModal(null), 1500);
      } else {
        setMessage({ text: result.error || '변경에 실패했습니다.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: '오류가 발생했습니다.', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateSubscriptionCost = async () => {
    if (!user) return;
    setIsUpdating(true);
    try {
      const ccas = await apiService.getCCAs();
      const myCCA = ccas.find((c: any) => c.nickname === user.nickname);
      
      if (!myCCA) {
        setMessage({ text: '크리에이터 계정을 찾을 수 없습니다.', type: 'error' });
        return;
      }

      const result = await apiService.updateCCA(myCCA.id, { subscription_cost: subscriptionCost });
      if (result.success) {
        setMessage({ text: '구독료가 설정되었습니다.', type: 'success' });
        setTimeout(() => setActiveModal(null), 1500);
      } else {
        setMessage({ text: '저장에 실패했습니다.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: '오류가 발생했습니다.', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  React.useEffect(() => {
    if (activeModal === 'creator' && user) {
      apiService.getCCAs().then(ccas => {
        const myCCA = ccas.find((c: any) => c.nickname === user.nickname);
        if (myCCA) setSubscriptionCost(myCCA.subscriptionCost || 0);
      });
    }
  }, [activeModal, user]);

  const menuItems = [
    { id: 'profile', icon: 'person', label: '프로필 수정', desc: '닉네임, 프로필 이미지 변경' },
    { id: 'billing', icon: 'account_balance_wallet', label: '충전 및 결제', desc: '포인트 충전 및 사용 내역' },
    { id: 'creator', icon: 'stars', label: '구독료 설정', desc: '내 채널의 월간 구독 금액 설정' },
    { id: 'notifications', icon: 'notifications', label: '알림 설정', desc: '푸시 알림 및 이메일 설정' },
    { id: 'password', icon: 'lock', label: '비밀번호 변경', desc: '계정 보안 설정' },
    { id: 'language', icon: 'translate', label: '언어 설정', desc: '한국어 / English' },
    { id: 'help', icon: 'help', label: '도움말', desc: 'FAQ 및 고객지원' },
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
          <div 
            className="ft-sidebar-avatar-placeholder" 
            style={{ width: 64, height: 64, flexShrink: 0, overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
            onClick={() => fileInputRef.current?.click()}
          >
            {user?.profileImage ? (
              <img src={user.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: 32 }}>person</span>
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
              <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 20 }}>photo_camera</span>
            </div>
          </div>
          <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
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
              onClick={() => {
                if (item.id === 'profile') { setEditNickname(user?.nickname || ''); setEditRealName(user?.realName || ''); }
                setActiveModal(item.id);
                setMessage({ text: '', type: '' });
              }}
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

      {/* Modals */}
      {activeModal && (
        <div className="ft-login-overlay" onClick={() => setActiveModal(null)}>
          <div className="ft-login-modal" onClick={e => e.stopPropagation()} style={{ padding: 0 }}>
            <div className="ft-login-banner" style={{ position: 'relative' }}>
              {menuItems.find(m => m.id === activeModal)?.label}
              <button 
                onClick={() => setActiveModal(null)}
                style={{
                  position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
                  width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', cursor: 'pointer', transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>
            
            <div style={{ padding: '0 30px 30px' }}>
              {message.text && (
                <div style={{ 
                  padding: 12, borderRadius: 12, marginBottom: 20, fontSize: 13, fontWeight: 700, textAlign: 'center',
                  background: message.type === 'error' ? '#fff5f5' : '#f0fff4',
                  color: message.type === 'error' ? '#e03131' : '#2f855a',
                  border: `1px solid ${message.type === 'error' ? '#ffc9c9' : '#c6f6d5'}`
                }}>
                  {message.text}
                </div>
              )}

              {activeModal === 'profile' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--ft-text-tertiary)', marginBottom: 8, display: 'block' }}>닉네임</label>
                    <input 
                      type="text" className="ft-input" value={editNickname} 
                      onChange={e => setEditNickname(e.target.value)} 
                      style={{ marginBottom: 0 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--ft-text-tertiary)', marginBottom: 8, display: 'block' }}>실명</label>
                    <input 
                      type="text" className="ft-input" value={editRealName} 
                      onChange={e => setEditRealName(e.target.value)} 
                      style={{ marginBottom: 0 }}
                    />
                  </div>
                  <button className="ft-primary-btn" onClick={handleUpdateProfile} disabled={isUpdating}>
                    {isUpdating ? '저장 중...' : '변경사항 저장'}
                  </button>
                </div>
              )}

              {activeModal === 'billing' && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: 13, color: 'var(--ft-text-tertiary)', marginBottom: 20 }}>
                    보유 포인트: <span style={{ fontWeight: 800, color: 'var(--ft-primary)', fontSize: 18 }}>{user?.points || 0} P</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                    {[5000, 10000, 30000, 50000].map(amt => (
                      <button key={amt} className="ft-secondary-btn" style={{ margin: 0, padding: '12px 0' }}>
                        {amt.toLocaleString()} P
                      </button>
                    ))}
                  </div>
                  <button className="ft-primary-btn" style={{ background: '#000' }}>결제 수단 등록</button>
                  <p style={{ fontSize: 11, color: 'var(--ft-text-muted)', marginTop: 16 }}>* 실제 결제 기능은 현재 연동 준비 중입니다.</p>
                </div>
              )}

              {activeModal === 'creator' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--ft-text-tertiary)', marginBottom: 8, display: 'block' }}>월간 구독료 (Point)</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="number" className="ft-input" value={subscriptionCost} 
                        onChange={e => setSubscriptionCost(parseInt(e.target.value) || 0)} 
                        style={{ marginBottom: 0, paddingRight: 40 }}
                        placeholder="0"
                      />
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, fontSize: 13, color: 'var(--ft-text-tertiary)' }}>P</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--ft-text-muted)', marginTop: 8 }}>유저들이 내 채널을 1개월간 구독할 때 지불할 금액을 설정합니다.</p>
                  </div>
                  <button className="ft-primary-btn" onClick={handleUpdateSubscriptionCost} disabled={isUpdating}>
                    {isUpdating ? '저장 중...' : '구독료 저장'}
                  </button>
                </div>
              )}

              {activeModal === 'password' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--ft-text-tertiary)', marginBottom: 8, display: 'block' }}>새 비밀번호</label>
                    <input 
                      type="password" className="ft-input" value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      style={{ marginBottom: 0 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--ft-text-tertiary)', marginBottom: 8, display: 'block' }}>비밀번호 확인</label>
                    <input 
                      type="password" className="ft-input" value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      style={{ marginBottom: 0 }}
                    />
                  </div>
                  <button className="ft-primary-btn" onClick={handleUpdatePassword} disabled={isUpdating}>
                    {isUpdating ? '변경 중...' : '비밀번호 변경'}
                  </button>
                </div>
              )}

              {(activeModal === 'notifications' || activeModal === 'language' || activeModal === 'help') && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--ft-text-muted)', marginBottom: 16 }}>construction</span>
                  <div style={{ fontWeight: 700, color: 'var(--ft-text-secondary)' }}>이 기능은 준비 중입니다.</div>
                  <div style={{ fontSize: 13, color: 'var(--ft-text-tertiary)', marginTop: 8 }}>메인 페이지의 마이페이지에서 동일한 기능을 이용하실 수 있습니다.</div>
                  <button className="ft-secondary-btn" style={{ width: '100%', marginTop: 24 }} onClick={() => setActiveModal(null)}>닫기</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeedSettings;
