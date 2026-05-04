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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'subscribed' | 'following'>('all');
  const [allFeedItems, setAllFeedItems] = useState<any[]>([]);
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [onDutyCCAs, setOnDutyCCAs] = useState<CCA[]>([]);
  const [subscribedIds, setSubscribedIds] = useState<string[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiService.getFeed(1, 100, user?.id);
      setAllFeedItems(data.items || []);
      setFeedItems(data.items || []);
      
      const ccas = await apiService.getCCAs();
      setOnDutyCCAs(ccas.slice(0, 10));

      if (user?.id) {
        const subs = await apiService.getSubscriptions(user.id);
        setSubscribedIds(subs);
        const follows = await apiService.checkCCAFollow(user.id, '');
        setFollowingIds(follows.followedIds || []);
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
      setFeedItems(allFeedItems.filter(item => followingIds.includes(item.ccaId)));
    }
  };

  const handleSubscribe = async (e: React.MouseEvent, targetId: string) => {
    e.stopPropagation();
    if (!user) {
      handleNavigate('/feed'); // Triggers login modal
      return;
    }
    
    const result = await apiService.toggleSubscription(user.id, targetId);
    if (result.success) {
      if (result.isSubscribed) {
        setSubscribedIds(prev => [...prev, targetId]);
      } else {
        setSubscribedIds(prev => prev.filter(id => id !== targetId));
      }
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
        <button className={`ft-tab ${activeTab === 'subscribed' ? 'active' : ''}`} onClick={() => onTabChange('subscribed')}>구독</button>
        <button className={`ft-tab ${activeTab === 'following' ? 'active' : ''}`} onClick={() => onTabChange('following')}>팔로우</button>
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
                  <div className="ft-post-author" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      className="ft-post-author-name"
                      onClick={() => goToProfile(item.ccaNickname || item.ccaName)}
                    >
                      {item.ccaNickname || item.ccaName}
                      <span style={{ color: 'var(--ft-primary)', fontSize: 14, marginLeft: 4 }}>🔥</span>
                    </span>
                    {user?.id !== item.ccaId && (
                      <button 
                        className={`ft-follow-btn ${subscribedIds.includes(item.ccaId) ? 'subscribed' : ''}`}
                        onClick={(e) => handleSubscribe(e, item.ccaId)}
                        style={{ 
                          fontSize: 11, padding: '4px 10px', borderRadius: 12, 
                          background: subscribedIds.includes(item.ccaId) ? 'var(--ft-bg-tertiary)' : 'var(--ft-gradient)',
                          color: subscribedIds.includes(item.ccaId) ? 'var(--ft-text-secondary)' : '#fff',
                          border: 'none', fontWeight: 800, cursor: 'pointer'
                        }}
                      >
                        {subscribedIds.includes(item.ccaId) ? '구독 중' : '구독'}
                      </button>
                    )}
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
          <p>아직 등록된 포스트가 없습니다.</p>
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
