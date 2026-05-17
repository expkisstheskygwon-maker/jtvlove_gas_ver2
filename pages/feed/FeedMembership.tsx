import React from 'react';

const FeedMembership: React.FC = () => {
  return (
    <>
      <div className="ft-page-header">
        <div className="ft-page-title">
          <span>멤버십</span>
        </div>
      </div>

      <div style={{ padding: '0 20px 40px' }}>
        {/* Main Hero Plan */}
        <div className="ft-membership-hero-card" style={{
          background: 'var(--ft-gradient)',
          borderRadius: 32,
          padding: 40,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 32,
          boxShadow: '0 20px 40px rgba(232, 82, 122, 0.2)'
        }}>
          {/* Decorative background circle */}
          <div style={{
            position: 'absolute', top: -50, right: -50,
            width: 200, height: 200, borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)', filter: 'blur(40px)'
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>auto_awesome</span>
              <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5 }}>Ultimate Pass</span>
            </div>
            
            <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12, lineHeight: 1.2 }}>
              JTVLOVE<br />PREMIUM
            </h1>
            
            <p style={{ fontSize: 16, opacity: 0.9, marginBottom: 32, maxWidth: '80%', lineHeight: 1.5 }}>
              모든 크리에이터의 독점 콘텐츠와<br />
              프리미엄 기능을 제한 없이 즐겨보세요.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px 20px', borderRadius: 20, backdropFilter: 'blur(10px)' }}>
                <span style={{ fontSize: 24, fontWeight: 900 }}>₩9,900</span>
                <span style={{ fontSize: 14, opacity: 0.8, marginLeft: 4 }}>/ 월</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, background: '#fff', color: 'var(--ft-primary)', padding: '4px 12px', borderRadius: 10 }}>
                Best Value
              </div>
            </div>

            <button style={{
              background: '#fff', color: '#000',
              border: 'none', borderRadius: 20,
              padding: '18px 32px', fontWeight: 900, fontSize: 16,
              width: '100%', cursor: 'pointer',
              boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s'
            }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              멤버십 시작하기
            </button>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="ft-settings-section-title">프리미엄 독점 혜택</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 40 }}>
          {[
            { icon: 'lock_open', title: '독점 콘텐츠', desc: '구독자 전용 피드 열람' },
            { icon: 'chat_bubble', title: '다이렉트 메시지', desc: '크리에이터와 1:1 대화' },
            { icon: 'verified', title: '프리미엄 뱃지', desc: '프로필 전용 표식 부여' },
            { icon: 'download', title: '오프라인 저장', desc: '콘텐츠 소장 및 감상' },
            { icon: 'favorite', title: '무제한 후원', desc: '광고 없는 쾌적한 환경' },
            { icon: 'campaign', title: '우선 알림', desc: '새 소식 가장 먼저 수신' },
          ].map((f, i) => (
            <div key={i} style={{
              background: 'var(--ft-bg)',
              padding: 20,
              borderRadius: 24,
              border: '1px solid var(--ft-border-light)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
            }}>
              <div style={{ 
                width: 40, height: 40, borderRadius: 12, 
                background: 'var(--ft-primary-light)', color: 'var(--ft-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 12
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{f.icon}</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: 'var(--ft-text-tertiary)' }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Support Section */}
        <div style={{ 
          background: 'var(--ft-bg-tertiary)', 
          padding: 32, 
          borderRadius: 28, 
          textAlign: 'center',
          border: '1px dashed var(--ft-border)'
        }}>
          <div className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--ft-text-tertiary)', marginBottom: 16 }}>volunteer_activism</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>개별 크리에이터 후원</h3>
          <p style={{ fontSize: 14, color: 'var(--ft-text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
            좋아하는 크리에이터를 직접 구독하고<br />
            더욱 밀접하게 소통해보세요.
          </p>
          <button style={{
            background: 'var(--ft-text)', color: 'var(--ft-bg)',
            border: 'none', borderRadius: 16,
            padding: '12px 24px', fontWeight: 800, fontSize: 14,
            cursor: 'pointer'
          }}>
            크리에이터 찾기
          </button>
        </div>
      </div>
    </>
  );
};

export default FeedMembership;
