import React from 'react';

const FeedMembership: React.FC = () => {
  return (
    <>
      <div className="ft-page-header">
        <div className="ft-page-title">
          <span>멤버십</span>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {/* Premium Plan */}
        <div className="ft-membership-card" style={{
          background: 'linear-gradient(135deg, var(--ft-primary), var(--ft-accent))',
          color: '#fff', border: 'none'
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>Premium</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>JTVLOVE Premium</div>
          <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 16 }}>모든 크리에이터의 독점 콘텐츠를 무제한으로 즐기세요</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 16 }}>
            <span style={{ fontSize: 28, fontWeight: 900 }}>₩9,900</span>
            <span style={{ fontSize: 13, opacity: 0.7 }}>/월</span>
          </div>
          <button style={{
            background: '#fff', color: 'var(--ft-primary)',
            border: 'none', borderRadius: 'var(--ft-radius-md)',
            padding: '12px 24px', fontWeight: 800, fontSize: 14,
            width: '100%', cursor: 'pointer'
          }}>
            프리미엄 시작하기
          </button>
        </div>

        {/* Features */}
        <div className="ft-membership-card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>프리미엄 혜택</div>
          {[
            { icon: 'lock_open', text: '구독자 전용 콘텐츠 열람' },
            { icon: 'chat', text: '크리에이터에게 DM 보내기' },
            { icon: 'workspace_premium', text: '프로필 뱃지 부여' },
            { icon: 'favorite', text: '무제한 좋아요 및 북마크' },
            { icon: 'notifications_active', text: '새 콘텐츠 알림 우선 수신' },
          ].map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0',
              borderBottom: i < 4 ? '1px solid var(--ft-border-light)' : 'none'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--ft-primary)' }}>{f.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default FeedMembership;
