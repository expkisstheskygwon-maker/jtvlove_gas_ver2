import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import { CCA } from '../../types';

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}시간 전`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  return `${Math.floor(diffDay / 7)}주 전`;
}

interface FeedHomeProps {
  handleNavigate: (path: string) => void;
}

const FeedHome: React.FC<FeedHomeProps> = ({ handleNavigate }) => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'subscribed' | 'following'>('all');
  const [allFeedItems, setAllFeedItems] = useState<any[]>([]);
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [onDutyCCAs, setOnDutyCCAs] = useState<CCA[]>([]);
  const [subscribedIds, setSubscribedIds] = useState<string[]>([]);
  const [followingCCAIds, setFollowingCCAIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  // Subscription Modal State
  const [subModal, setSubModal] = useState<{
    isOpen: boolean;
    ccaId: string;
    ccaName: string;
    cost: number;
  }>({ isOpen: false, ccaId: '', ccaName: '', cost: 0 });

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiService.getFeed(1, 100, user?.id);
      setAllFeedItems(data.items || []);
      setFeedItems(data.items || []);
      
      const ccas = await apiService.getCCAs();
      setOnDutyCCAs(ccas.slice(0, 10));

      if (user?.id) {
        const [subs, ccaFollows] = await Promise.all([
          apiService.getSubscriptions(user.id),
          apiService.checkCCAFollow(user.id, '')
        ]);
        setSubscribedIds(subs);
        setFollowingCCAIds(ccaFollows.followedIds || []);
      }
    } catch (err) {
      console.error('Feed load error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const onTabChange = (tab: 'all' | 'subscribed' | 'following') => {
    setActiveTab(tab);
    if (tab === 'all') {
      setFeedItems(allFeedItems);
    } else if (tab === 'subscribed') {
      setFeedItems(allFeedItems.filter(item => subscribedIds.includes(item.ccaId)));
    } else if (tab === 'following') {
      setFeedItems(allFeedItems.filter(item => followingCCAIds.includes(item.ccaId)));
    }
  };

  const handleFollow = async (e: React.MouseEvent, ccaId: string) => {
    e.stopPropagation();
    if (!user) {
      handleNavigate('/feed');
      return;
    }
    
    const result = await apiService.toggleCCAFollow(user.id, ccaId);
    if (result.isFollowing) {
      setFollowingCCAIds(prev => [...prev, ccaId]);
    } else {
      setFollowingCCAIds(prev => prev.filter(id => id !== ccaId));
    }
  };

  const handleSubscribeClick = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (!user) {
      handleNavigate('/feed');
      return;
    }
    setSubModal({
      isOpen: true,
      ccaId: item.ccaId,
      ccaName: item.ccaNickname || item.ccaName,
      cost: item.subscriptionCost || 0
    });
  };

  const confirmSubscription = async () => {
    if (!user || !subModal.ccaId) return;
    try {
      const result = await apiService.toggleSubscription(user.id, subModal.ccaId);
      if (result.success) {
        setSubscribedIds(prev => [...prev, subModal.ccaId]);
        // Update user points locally if possible, or just let them refresh
        if (result.cost) {
          updateUser({ points: (user.points || 0) - result.cost });
        }
        setSubModal(prev => ({ ...prev, isOpen: false }));
        alert('구독이 완료되었습니다!');
      } else {
        alert(result.error || '구독에 실패했습니다.');
      }
    } catch (err) {
      alert('오류가 발생했습니다.');
    }
  };

  const goToProfile = (nickname: string) => {
    handleNavigate(`/@${nickname}`);
  };

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleNavigate(window.location.pathname);
  };

  return (
    <>
      {/* ═══ On-Duty Stories ═══ */}
      <div className="ft-stories">
        {onDutyCCAs.map(cca => (
          <div key={cca.id} className="ft-story" onClick={() => goToProfile(cca.nickname || cca.name)}>
            <div className="ft-story-ring">
              <img src={cca.image} className="ft-story-img" alt="" />
            </div>
            <div className="ft-story-name">{cca.nickname || cca.name}</div>
          </div>
        ))}
      </div>

      {/* Tabs (Feed filter) */}
      <div className="ft-tabs">
        <button className={`ft-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => onTabChange('all')}>전체</button>
        <button className={`ft-tab ${activeTab === 'following' ? 'active' : ''}`} onClick={() => onTabChange('following')}>팔로우</button>
        <button className={`ft-tab ${activeTab === 'subscribed' ? 'active' : ''}`} onClick={() => onTabChange('subscribed')}>구독</button>
      </div>

      {/* Feed Posts */}
      {loading ? (
        <div className="ft-loading"><div className="ft-spinner"></div></div>
      ) : feedItems.length > 0 ? (
        <div>
          {feedItems.map((item) => (
            <article key={item.id} className="ft-post">
              <div className="ft-post-header">
                <img
                  src={item.ccaImage || 'https://ui-avatars.com/api/?name=' + (item.ccaNickname || 'U')}
                  alt=""
                  className="ft-post-avatar"
                  onClick={() => goToProfile(item.ccaNickname || item.ccaName)}
                />
                <div className="ft-post-meta">
                  <div className="ft-post-author" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      className="ft-post-author-name"
                      onClick={() => goToProfile(item.ccaNickname || item.ccaName)}
                      style={{ flex: 1, minWidth: 0 }}
                    >
                      {item.ccaNickname || item.ccaName}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={(e) => handleFollow(e, item.ccaId)}
                        className="ft-follow-pill"
                        style={{
                          background: followingCCAIds.includes(item.ccaId) ? 'transparent' : 'var(--ft-primary)',
                          color: followingCCAIds.includes(item.ccaId) ? 'var(--ft-text-secondary)' : '#fff',
                          border: followingCCAIds.includes(item.ccaId) ? '1px solid var(--ft-border)' : 'none',
                        }}
                      >
                        {followingCCAIds.includes(item.ccaId) ? '팔로잉' : '팔로우'}
                      </button>
                      {!subscribedIds.includes(item.ccaId) && (
                        <button
                          onClick={(e) => handleSubscribeClick(e, item)}
                          className="ft-follow-pill"
                          style={{
                            background: 'var(--ft-gradient)',
                            color: '#fff',
                            border: 'none',
                          }}
                        >
                          구독
                        </button>
                      )}
                      {subscribedIds.includes(item.ccaId) && (
                        <button
                          className="ft-follow-pill"
                          style={{
                            background: 'rgba(255,215,0,0.1)',
                            color: '#daa520',
                            border: '1px solid #daa520',
                            cursor: 'default'
                          }}
                        >
                          구독 중
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="ft-post-time">{timeAgo(item.date)}</div>
                </div>
                <button className="ft-post-more">
                  <span className="material-symbols-outlined">more_horiz</span>
                </button>
              </div>

              {item.caption && (
                <div className="ft-post-body">{item.caption}</div>
              )}

              {item.url && (
                <div className="ft-post-media" style={{ position: 'relative' }}>
                  {item.type === 'video' ? (
                    <video src={item.url} controls preload="metadata" />
                  ) : (
                    <img 
                      src={item.url} 
                      alt="" 
                      loading="lazy" 
                      onClick={() => setExpandedImage(item.url)}
                      style={{ cursor: 'pointer' }}
                    />
                  )}
                  {item.isSubscriberOnly && (
                    <div className="ft-post-media-badge">구독자 전용</div>
                  )}
                  {/* Watermark overlay */}
                  <div style={{
                    position: 'absolute',
                    bottom: 12,
                    left: 12,
                    background: 'rgba(0,0,0,0.4)',
                    padding: '4px 8px',
                    borderRadius: 4,
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: 12,
                    fontWeight: 600,
                    pointerEvents: 'none',
                    letterSpacing: '0.5px',
                    backdropFilter: 'blur(4px)'
                  }}>
                    @{item.ccaNickname || item.ccaName}
                  </div>
                </div>
              )}

              <div className="ft-post-actions">
                <button className="ft-post-action" onClick={handleAction}>
                  <span className="material-symbols-outlined">favorite</span>
                </button>
                <button className="ft-post-action" onClick={handleAction}>
                  <span className="material-symbols-outlined">chat_bubble_outline</span>
                </button>
                <button className="ft-post-action" onClick={handleAction}>
                  <span className="material-symbols-outlined">send</span>
                </button>
                <div className="ft-post-action-spacer" />
                <button className="ft-post-action" onClick={handleAction}>
                  <span className="material-symbols-outlined">bookmark</span>
                </button>
              </div>

              {item.likes > 0 && (
                <div className="ft-post-likes">좋아요 {item.likes}개</div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="ft-empty">
          <span className="material-symbols-outlined">dynamic_feed</span>
          <p>
            {activeTab === 'following' ? '팔로우한 CCA의 포스트가 없습니다.' :
             activeTab === 'subscribed' ? '구독한 CCA의 포스트가 없습니다.' :
             '아직 등록된 포스트가 없습니다.'}
          </p>
        </div>
      )}

      {/* Subscription Confirmation Modal */}
      {subModal.isOpen && (
        <div className="ft-login-overlay" onClick={() => setSubModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="ft-login-modal" onClick={e => e.stopPropagation()} style={{ padding: '30px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: 70, height: 70, borderRadius: '50%', background: 'var(--ft-gradient)', 
                margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' 
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#fff' }}>stars</span>
              </div>
              <h2 style={{ marginBottom: 8 }}>{subModal.ccaName} 구독하기</h2>
              <p style={{ color: 'var(--ft-text-secondary)', fontSize: 14, marginBottom: 24 }}>
                구독하시면 모든 독점 콘텐츠와 비공개 포스트를 <br /> 1개월간 자유롭게 이용하실 수 있습니다.
              </p>
              
              <div style={{ 
                background: 'var(--ft-bg-tertiary)', padding: '20px', borderRadius: 16, marginBottom: 30,
                border: '1px solid var(--ft-border)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: 'var(--ft-text-tertiary)' }}>구독 기간</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>30일 (1개월)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: 'var(--ft-text-tertiary)' }}>결제 금액</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--ft-primary)' }}>{subModal.cost.toLocaleString()} P</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="ft-secondary-btn" onClick={() => setSubModal(prev => ({ ...prev, isOpen: false }))}>취소</button>
                <button className="ft-primary-btn" onClick={confirmSubscription} style={{ flex: 2 }}>지금 구독하기</button>
              </div>
              
              {user && (
                <div style={{ marginTop: 16, fontSize: 11, color: 'var(--ft-text-muted)' }}>
                  현재 보유 포인트: {user.points?.toLocaleString() || 0} P
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {expandedImage && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 99999,
            display: 'flex', justifyContent: 'center', alignItems: 'center'
          }}
          onClick={() => setExpandedImage(null)}
        >
          <img src={expandedImage} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }} />
          <button 
            onClick={() => setExpandedImage(null)}
            style={{
              position: 'absolute', top: 20, right: 20, 
              background: 'none', border: 'none', color: '#fff', 
              fontSize: 32, cursor: 'pointer'
            }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}
    </>
  );
};

export default FeedHome;
