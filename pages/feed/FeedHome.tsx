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
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [onDutyCCAs, setOnDutyCCAs] = useState<CCA[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiService.getFeed(1, 30, user?.id);
      setFeedItems(data.items || []);
      
      // 출근 중인 CCA 데이터 (여기서는 상위 점수 순으로 임시 로드)
      const ccas = await apiService.getCCAs();
      setOnDutyCCAs(ccas.slice(0, 10));
    } catch (err) {
      console.error('Feed load error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const goToProfile = (nickname: string) => {
    handleNavigate(`/@${nickname}`);
  };

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleNavigate(window.location.pathname); // This will trigger the modal if guest
  };

  const onTabChange = (tab: 'all' | 'subscribed' | 'following') => {
    if (tab !== 'all') {
      handleNavigate(window.location.pathname);
      return;
    }
    setActiveTab(tab);
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
      {/* Feed Tabs */}
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
                  <div className="ft-post-author">
                    <span
                      className="ft-post-author-name"
                      onClick={() => goToProfile(item.ccaNickname || item.ccaName)}
                    >
                      {item.ccaNickname || item.ccaName}
                      <span style={{ color: 'var(--ft-primary)', fontSize: 14 }}>🔥</span>
                    </span>
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
                <div className="ft-post-media">
                  {item.type === 'video' ? (
                    <video src={item.url} controls preload="metadata" />
                  ) : (
                    <img src={item.url} alt="" loading="lazy" />
                  )}
                  {item.isSubscriberOnly && (
                    <div className="ft-post-media-badge">구독자 전용</div>
                  )}
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
    </>
  );
};

export default FeedHome;
