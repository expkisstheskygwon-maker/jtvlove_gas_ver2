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

const FeedHome: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'subscribed' | 'following'>('all');
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiService.getFeed(1, 30, user?.id);
      setFeedItems(data.items || []);
    } catch (err) {
      console.error('Feed load error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const goToProfile = (nickname: string) => {
    window.location.hash = `/@${nickname}`;
  };

  return (
    <>
      {/* Header */}
      <div className="ft-page-header">
        <div className="ft-page-title">
          <span>피드</span>
          <div className="ft-page-title-icon">
            <span className="material-symbols-outlined">notifications</span>
          </div>
        </div>
        <div className="ft-tabs">
          <button className={`ft-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>전체</button>
          <button className={`ft-tab ${activeTab === 'subscribed' ? 'active' : ''}`} onClick={() => setActiveTab('subscribed')}>구독</button>
          <button className={`ft-tab ${activeTab === 'following' ? 'active' : ''}`} onClick={() => setActiveTab('following')}>팔로우</button>
        </div>
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

              {/* Body text */}
              {item.caption && (
                <div className="ft-post-body">{item.caption}</div>
              )}

              {/* Tags */}
              {item.venueName && (
                <div className="ft-post-tags">
                  <span className="ft-post-tag">#{item.venueName}</span>
                  <span className="ft-post-tag">#일상</span>
                </div>
              )}

              {/* Media */}
              {item.url && (
                <div className="ft-post-media">
                  {item.type === 'video' ? (
                    <video src={item.url} controls preload="metadata" />
                  ) : (
                    <img src={item.url} alt="" loading="lazy" />
                  )}
                  {item.isSubscriberOnly && (
                    <div className="ft-post-media-badge">구독자 무료</div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="ft-post-actions">
                <button className="ft-post-action">
                  <span className="material-symbols-outlined">favorite</span>
                </button>
                <button className="ft-post-action">
                  <span className="material-symbols-outlined">chat_bubble_outline</span>
                </button>
                <button className="ft-post-action">
                  <span className="material-symbols-outlined">redeem</span>
                  <span>{item.likes || 0}</span>
                </button>
                <div className="ft-post-action-spacer" />
                <button className="ft-post-action">
                  <span className="material-symbols-outlined">bookmark</span>
                </button>
              </div>

              {item.likes > 0 && (
                <div className="ft-post-likes">좋아요 {item.likes}</div>
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
