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
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [commentModal, setCommentModal] = useState<{
    isOpen: boolean;
    galleryId: string;
    comments: any[];
    loading: boolean;
  }>({ isOpen: false, galleryId: '', comments: [], loading: false });
  const [newComment, setNewComment] = useState('');
  const [expandedCaptions, setExpandedCaptions] = useState<Record<string, boolean>>({});
  const [commentPreviews, setCommentPreviews] = useState<Record<string, any[]>>({});

  // Subscription Modal State
  const [subModal, setSubModal] = useState<{
    isOpen: boolean;
    ccaId: string;
    ccaName: string;
    cost: number;
  }>({ isOpen: false, ccaId: '', ccaName: '', cost: 0 });
  
  // Unfollow Modal State
  const [unfollowModal, setUnfollowModal] = useState<{
    isOpen: boolean;
    ccaId: string;
    ccaName: string;
  }>({ isOpen: false, ccaId: '', ccaName: '' });

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiService.getFeed(1, 100, user?.id);
      setAllFeedItems(data.items || []);
      setFeedItems(data.items || []);

      // 최근 댓글 2개 프리뷰(최대 20개 포스트만 선로딩)
      try {
        const previewTargets = (data.items || []).slice(0, 20);
        const pairs = await Promise.all(
          previewTargets.map(async (it: any) => {
            const list = await apiService.getGalleryComments(it.id, { limit: 2 });
            // API는 최신순 DESC로 내려오므로, UI에서는 오래된→최신 순으로 보여주기 위해 reverse
            return { id: it.id, comments: (list || []).slice().reverse() };
          })
        );
        const map: Record<string, any[]> = {};
        pairs.forEach(p => { map[p.id] = p.comments; });
        setCommentPreviews(map);
      } catch {}
      
      const ccas = await apiService.getCCAs();
      // Only show CCAs who are actually checked in (isWorking === true)
      const workingCCAs = ccas.filter((c: any) => c.isWorking === true);
      setOnDutyCCAs(workingCCAs.slice(0, 10));

      if (user?.id) {
        const [subs, ccaFollows, feedData] = await Promise.all([
          apiService.getSubscriptions(user.id),
          apiService.checkCCAFollow(user.id, ''),
          apiService.getFeed(1, 100, user.id)
        ]);
        setSubscribedIds(subs);
        setFollowingCCAIds(ccaFollows.followedIds || []);
        // Get already liked IDs from feed data if available
        const liked = (feedData.items || [])
          .filter((item: any) => item.isLiked)
          .map((item: any) => item.id);
        setLikedIds(liked);
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

  const handleFollow = async (e: React.MouseEvent, ccaId: string, ccaName: string) => {
    e.stopPropagation();
    if (!user) {
      handleNavigate('/feed');
      return;
    }
    
    // 이미 팔로우 중이라면 취소 확인 모달 띄우기
    if (followingCCAIds.includes(ccaId)) {
      setUnfollowModal({ isOpen: true, ccaId, ccaName });
      return;
    }
    
    const result = await apiService.toggleCCAFollow(user.id, ccaId);
    if (result.isFollowing) {
      setFollowingCCAIds(prev => [...prev, ccaId]);
    }
  };

  const confirmUnfollow = async () => {
    if (!user || !unfollowModal.ccaId) return;
    const result = await apiService.toggleCCAFollow(user.id, unfollowModal.ccaId);
    if (!result.isFollowing) {
      setFollowingCCAIds(prev => prev.filter(id => id !== unfollowModal.ccaId));
    }
    setUnfollowModal({ isOpen: false, ccaId: '', ccaName: '' });
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
        if ((result as any).cost) {
          updateUser({ points: (user.points || 0) - (result as any).cost });
        }
        setSubModal(prev => ({ ...prev, isOpen: false }));
        alert('구독이 완료되었습니다!');
      } else {
        alert((result as any).error || '구독에 실패했습니다.');
      }
    } catch (err) {
      alert('오류가 발생했습니다.');
    }
  };

  const goToProfile = (nickname: string) => {
    handleNavigate(`/@${nickname}`);
  };

  const shouldShowMoreCaption = (caption?: string) => {
    if (!caption) return false;
    return caption.length > 120 || caption.split('\n').length > 3;
  };

  const toggleCaption = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    setExpandedCaptions(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleLike = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (!user) {
      handleNavigate('/feed');
      return;
    }

    const isCurrentlyLiked = likedIds.includes(itemId);
    
    // Optimistic UI update
    if (isCurrentlyLiked) {
      setLikedIds(prev => prev.filter(id => id !== itemId));
      setFeedItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, likes: Math.max(0, (item.likes || 0) - 1) } : item
      ));
    } else {
      setLikedIds(prev => [...prev, itemId]);
      setFeedItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, likes: (item.likes || 0) + 1 } : item
      ));
    }

    try {
      await apiService.toggleGalleryLike(itemId, user.id);
    } catch (err) {
      console.error('Like error:', err);
      // Revert if failed (optional, usually ignored for likes for better UX)
    }
  };

  const handleCommentClick = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (!user) {
      handleNavigate('/feed');
      return;
    }

    setCommentModal({ isOpen: true, galleryId: itemId, comments: [], loading: true });
    
    try {
      const comments = await apiService.getGalleryComments(itemId);
      setCommentModal(prev => ({ ...prev, comments, loading: false }));
    } catch (err) {
      console.error('Fetch comments error:', err);
      setCommentModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim() || !commentModal.galleryId) return;

    const content = newComment.trim();
    
    try {
      const result = await apiService.createGalleryComment({
        galleryId: commentModal.galleryId,
        authorId: user.id,
        authorName: user.nickname || user.realName || '익명 사용자',
        authorImage: user.profileImage,
        content
      });

      if (result.success) {
        setNewComment('');
        const updatedComments = await apiService.getGalleryComments(commentModal.galleryId);
        setCommentModal(prev => ({ ...prev, comments: updatedComments }));

        const nextCount = (result as any).commentsCount ?? updatedComments.length;
        setFeedItems(prev => prev.map(item =>
          item.id === commentModal.galleryId ? { ...item, commentsCount: nextCount } : item
        ));
        setAllFeedItems(prev => prev.map(item =>
          item.id === commentModal.galleryId ? { ...item, commentsCount: nextCount } : item
        ));

        // 프리뷰(최근 2개) 갱신
        const preview = (updatedComments || []).slice(0, 2).slice().reverse();
        setCommentPreviews(prev => ({ ...prev, [commentModal.galleryId]: preview }));
      } else {
        alert(result.error || '댓글 등록에 실패했습니다.');
      }
    } catch (err) {
      console.error('Add comment error:', err);
      alert('오류가 발생했습니다.');
    }
  };

  const handleShare = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: `${item.ccaNickname || item.ccaName}님의 포스트`,
        text: item.caption,
        url: window.location.href,
      }).catch(() => {});
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('링크가 클립보드에 복사되었습니다.');
    }
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
              {item.caption && (
                <div className="ft-post-body">
                  <div
                    className={`ft-post-caption-text ${expandedCaptions[item.id] ? 'expanded' : 'collapsed'}`}
                  >
                    {item.caption}
                  </div>
                  {shouldShowMoreCaption(item.caption) && (
                    <button
                      className="ft-post-caption-more"
                      onClick={(e) => toggleCaption(e, item.id)}
                    >
                      {expandedCaptions[item.id] ? '접기' : '더 보기..'}
                    </button>
                  )}
                </div>
              )}

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
                        onClick={(e) => handleFollow(e, item.ccaId, item.ccaNickname || item.ccaName)}
                        className="ft-follow-pill"
                        style={{
                          background: followingCCAIds.includes(item.ccaId) ? 'transparent' : 'var(--ft-primary)',
                          color: followingCCAIds.includes(item.ccaId) ? 'var(--ft-text-secondary)' : '#fff',
                          border: followingCCAIds.includes(item.ccaId) ? '1px solid var(--ft-border)' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          height: '32px',
                          lineHeight: '1',
                        }}
                      >
                        {followingCCAIds.includes(item.ccaId) ? '팔로잉' : '팔로우'}
                        <span style={{ fontSize: '11px', opacity: 0.8, marginLeft: '2px' }}>{item.followersCount || 0}</span>
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

              <div className="ft-post-actions ft-feed-actionbar">
                <button
                  className={`ft-post-action ft-feed-action ${likedIds.includes(item.id) ? 'liked' : ''}`}
                  onClick={(e) => handleLike(e, item.id)}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ color: likedIds.includes(item.id) ? '#ff3040' : 'inherit', fontVariationSettings: likedIds.includes(item.id) ? "'FILL' 1" : "''" }}
                  >
                    favorite
                  </span>
                  <span className={`ft-feed-action-count ${likedIds.includes(item.id) ? 'liked' : ''}`}>
                    {item.likes || 0}
                  </span>
                </button>

                <button className="ft-post-action ft-feed-action" onClick={(e) => handleCommentClick(e, item.id)}>
                  <span className="material-symbols-outlined">chat_bubble_outline</span>
                  <span className="ft-feed-action-count">{item.commentsCount || 0}</span>
                </button>

                <button className="ft-post-action ft-feed-action" onClick={(e) => handleShare(e, item)}>
                  <span className="material-symbols-outlined">share</span>
                </button>

                <div className="ft-post-action-spacer" />
              </div>

              {(item.commentsCount || 0) > 0 && (
                <div className="ft-post-comments-preview">
                  {(commentPreviews[item.id] || []).map((c: any) => (
                    <div key={c.id} className="ft-post-comment-row" onClick={(e) => handleCommentClick(e, item.id)}>
                      <span className="ft-post-comment-author">{c.authorName}</span>
                      <span className="ft-post-comment-content">{c.content}</span>
                    </div>
                  ))}
                  {(item.commentsCount || 0) > 2 && (
                    <button className="ft-post-comments-more" onClick={(e) => handleCommentClick(e, item.id)}>
                      댓글 {item.commentsCount}개 모두 보기
                    </button>
                  )}
                </div>
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

      {/* Unfollow Confirmation Modal */}
      {unfollowModal.isOpen && (
        <div className="ft-login-overlay" onClick={() => setUnfollowModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="ft-login-modal" onClick={e => e.stopPropagation()} style={{ padding: '30px', maxWidth: '350px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: 60, height: 60, borderRadius: '50%', background: '#fff5f5', 
                margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' 
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#e03131' }}>person_remove</span>
              </div>
              <h2 style={{ fontSize: 18, marginBottom: 8 }}>팔로우 취소</h2>
              <p style={{ color: 'var(--ft-text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
                <strong>{unfollowModal.ccaName}</strong> 님의 팔로우를 <br /> 취소하시겠습니까?
              </p>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="ft-secondary-btn" onClick={() => setUnfollowModal(prev => ({ ...prev, isOpen: false }))} style={{ flex: 1 }}>아니오</button>
                <button 
                  className="ft-primary-btn" 
                  onClick={confirmUnfollow} 
                  style={{ flex: 1, background: '#e03131' }}
                >
                  네, 취소합니다
                </button>
              </div>
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

      {/* Comment Modal */}
      {commentModal.isOpen && (
        <div className="ft-login-overlay" onClick={() => setCommentModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="ft-login-modal" onClick={e => e.stopPropagation()} style={{ 
            padding: 0, 
            width: '100%', 
            maxWidth: '500px', 
            height: '80vh', 
            display: 'flex', 
            flexDirection: 'column',
            borderRadius: '24px 24px 0 0',
            position: 'absolute',
            bottom: 0
          }}>
            <div className="ft-notif-header" style={{ padding: '20px', borderBottom: '1px solid var(--ft-border)' }}>
              <span>댓글</span>
              <button onClick={() => setCommentModal(prev => ({ ...prev, isOpen: false }))} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {commentModal.loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                  <div className="ft-spinner"></div>
                </div>
              ) : commentModal.comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ft-text-tertiary)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.2, marginBottom: 16 }}>chat</span>
                  <p>첫 댓글을 남겨보세요!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {commentModal.comments.map((comment: any) => (
                    <div key={comment.id} style={{ display: 'flex', gap: 12 }}>
                      <img 
                        src={comment.authorImage || `https://ui-avatars.com/api/?name=${comment.authorName}`} 
                        alt="" 
                        style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 13 }}>{comment.authorName}</span>
                          <span style={{ fontSize: 11, color: 'var(--ft-text-tertiary)' }}>{timeAgo(comment.createdAt)}</span>
                        </div>
                        <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ft-text)' }}>{comment.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: '16px', borderTop: '1px solid var(--ft-border)', display: 'flex', gap: 12, alignItems: 'center' }}>
              <img 
                src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.nickname}`} 
                alt="" 
                style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
              />
              <div style={{ flex: 1, position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder="댓글 추가..." 
                  className="ft-input" 
                  style={{ margin: 0, padding: '10px 16px', paddingRight: '50px', fontSize: 14, borderRadius: '20px' }}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <button 
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  style={{ 
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: newComment.trim() ? 'var(--ft-primary)' : 'var(--ft-text-muted)',
                    fontWeight: 700, fontSize: 14, cursor: 'pointer'
                  }}
                >
                  게시
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeedHome;
