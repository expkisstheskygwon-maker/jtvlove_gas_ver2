import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement | null>(null);
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
  const [unlockedPostIds, setUnlockedPostIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ft_unlocked_post_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [carouselIndices, setCarouselIndices] = useState<Record<string, number>>({});
  const [tipModal, setTipModal] = useState<{
    isOpen: boolean;
    post: any | null;
    amount: string;
    submitting: boolean;
    success: boolean;
  }>({ isOpen: false, post: null, amount: '100', submitting: false, success: false });

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

  // Post Option Menu Modal State
  const [postMenuModal, setPostMenuModal] = useState<{
    isOpen: boolean;
    post: any | null;
  }>({ isOpen: false, post: null });

  // Report Modal State
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    post: any | null;
    reason: string;
    submitting: boolean;
  }>({ isOpen: false, post: null, reason: '', submitting: false });

  // Bookmarked Post IDs State
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  const loadFeed = useCallback(async (pageNum = 1, isAppend = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const data = await apiService.getFeed(pageNum, 10, user?.id);
      let hiddenIds: string[] = [];
      try {
        const storedHidden = localStorage.getItem('ft_hidden_post_ids');
        if (storedHidden) hiddenIds = JSON.parse(storedHidden);
      } catch (e) {}

      const newItemsRaw = (data.items || []).filter((item: any) => !hiddenIds.includes(item.id));
      
      const newItems = newItemsRaw.map((item: any, idx: number) => {
        let updatedItem = { ...item };
        
        // 1. Carousel Mocking: Every 3rd photo post gets 3 images
        if (item.type === 'photo' && idx % 3 === 0) {
          const carouselImages = [
            item.url,
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600',
            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600'
          ];
          updatedItem.url = carouselImages.join(',');
        }
        
        // 2. Paid Lock Mocking: Every 4th post is marked as paid content (200 points)
        if (idx % 4 === 1) {
          updatedItem.isPaid = true;
          updatedItem.pricePoints = 200;
        }
        
        return updatedItem;
      });
      
      if (isAppend) {
        setAllFeedItems(prev => [...prev, ...newItems]);
        setFeedItems(prev => {
          const combined = [...prev, ...newItems];
          // 탭 필터링 적용
          if (activeTab === 'subscribed') {
            return combined.filter(item => subscribedIds.includes(item.ccaId));
          } else if (activeTab === 'following') {
            return combined.filter(item => followingCCAIds.includes(item.ccaId));
          }
          return combined;
        });
      } else {
        setAllFeedItems(newItems);
        setFeedItems(newItems);
      }
      
      setHasMore(data.hasMore);
      setPage(pageNum);

      // API에서 내려온 recentComments를 프리뷰 맵에 저장
      const map: Record<string, any[]> = {};
      newItems.forEach((it: any) => {
        if (it.recentComments) {
          map[it.id] = it.recentComments.slice().reverse();
        }
      });
      setCommentPreviews(prev => ({ ...prev, ...map }));
      
      // 초기 로딩 시에만 CCA 목록 및 사용자 정보 로드
      if (pageNum === 1) {
        const ccas = await apiService.getCCAs();
        const workingCCAs = ccas.filter((c: any) => c.isWorking === true);
        setOnDutyCCAs(workingCCAs.slice(0, 10));

        if (user?.id) {
          const [subs, ccaFollows] = await Promise.all([
            apiService.getSubscriptions(user.id),
            apiService.checkCCAFollow(user.id, '')
          ]);
          setSubscribedIds(subs);
          setFollowingCCAIds(ccaFollows.followedIds || []);
          
          const liked = newItems
            .filter((item: any) => item.isLiked)
            .map((item: any) => item.id);
          setLikedIds(prev => [...new Set([...prev, ...liked])]);
        }
      } else if (user?.id) {
        // 추가 로딩 시 좋아요 상태만 업데이트
        const liked = newItems
          .filter((item: any) => item.isLiked)
          .map((item: any) => item.id);
        setLikedIds(prev => [...new Set([...prev, ...liked])]);
      }
    } catch (err) {
      console.error('Feed load error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user?.id, activeTab, subscribedIds, followingCCAIds]);

  useEffect(() => { 
    loadFeed(1, false); 
    if (user?.id) {
      try {
        const saved = localStorage.getItem(`ft_bookmarks_${user.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setBookmarkedIds(parsed.map((p: any) => p.id));
        }
      } catch (e) {
        console.error('Load bookmarks error:', e);
      }
    }
  }, [user?.id]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      loadFeed(page + 1, true);
    }
  }, [loadingMore, hasMore, loading, page, loadFeed]);

  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          handleLoadMore();
        }
      },
      { rootMargin: '150px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loading, handleLoadMore]);

  const handleUnlockPost = async (postId: string, price: number) => {
    if (!user) {
      openLoginModal();
      return;
    }
    const currentPoints = user.points || 0;
    if (currentPoints < price) {
      alert(`포인트가 부족합니다. (필요 포인트: ${price}P / 보유 포인트: ${currentPoints}P)`);
      return;
    }
    
    updateUser({ points: currentPoints - price });
    const newUnlocked = [...unlockedPostIds, postId];
    setUnlockedPostIds(newUnlocked);
    try {
      localStorage.setItem('ft_unlocked_post_ids', JSON.stringify(newUnlocked));
    } catch {}
    alert('콘텐츠가 성공적으로 해제되었습니다!');
  };

  const handleCarouselScroll = (postId: string, e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollPos = target.scrollLeft;
    const width = target.clientWidth;
    if (width > 0) {
      const activeIdx = Math.round(scrollPos / width);
      setCarouselIndices(prev => ({ ...prev, [postId]: activeIdx }));
    }
  };

  const handleCarouselArrowClick = (postId: string, direction: 'prev' | 'next', totalSlides: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    const track = btn.parentElement?.querySelector('.ft-carousel-track') as HTMLDivElement;
    if (track) {
      const width = track.clientWidth;
      const currentIdx = carouselIndices[postId] || 0;
      let nextIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
      if (nextIdx < 0) nextIdx = 0;
      if (nextIdx >= totalSlides) nextIdx = totalSlides - 1;
      
      track.scrollTo({
        left: nextIdx * width,
        behavior: 'smooth'
      });
      setCarouselIndices(prev => ({ ...prev, [postId]: nextIdx }));
    }
  };

  const handleSendTip = async () => {
    if (!user) {
      openLoginModal();
      return;
    }
    const amountNum = parseInt(tipModal.amount);
    if (!amountNum || amountNum <= 0) {
      alert('올바른 팁 금액을 입력해 주세요.');
      return;
    }
    const currentPoints = user.points || 0;
    if (currentPoints < amountNum) {
      alert(`포인트가 부족합니다. (필요 포인트: ${amountNum}P / 보유 포인트: ${currentPoints}P)`);
      return;
    }
    
    setTipModal(prev => ({ ...prev, submitting: true }));
    try {
      updateUser({ points: currentPoints - amountNum });
      await new Promise(resolve => setTimeout(resolve, 800));
      setTipModal(prev => ({ ...prev, submitting: false, success: true }));
    } catch (err) {
      alert('오류가 발생했습니다.');
      setTipModal(prev => ({ ...prev, submitting: false }));
    }
  };

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

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('정말 이 포스트를 삭제하시겠습니까?')) return;
    try {
      const result = await apiService.deleteGalleryPost(postId);
      if (result && result.success) {
        alert('포스트가 삭제되었습니다.');
        setFeedItems(prev => prev.filter(item => item.id !== postId));
        setAllFeedItems(prev => prev.filter(item => item.id !== postId));
        setPostMenuModal({ isOpen: false, post: null });
      } else {
        alert('포스트 삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('Delete post error:', err);
      alert('오류가 발생했습니다.');
    }
  };

  const handleToggleBookmark = (item: any) => {
    if (!user) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }
    try {
      const key = `ft_bookmarks_${user.id}`;
      const saved = localStorage.getItem(key);
      let list: any[] = saved ? JSON.parse(saved) : [];
      const isExist = list.some((p: any) => p.id === item.id);
      
      if (isExist) {
        list = list.filter((p: any) => p.id !== item.id);
        alert('즐겨찾기에서 해제되었습니다.');
      } else {
        list.push({
          id: item.id,
          url: item.url,
          type: item.type,
          caption: item.caption,
          ccaNickname: item.ccaNickname || item.ccaName,
          ccaImage: item.ccaImage,
          date: item.date,
          ccaId: item.ccaId
        });
        alert('즐겨찾기에 추가되었습니다.');
      }
      
      localStorage.setItem(key, JSON.stringify(list));
      setBookmarkedIds(list.map((p: any) => p.id));
      setPostMenuModal({ isOpen: false, post: null });
    } catch (e) {
      console.error('Toggle bookmark error:', e);
    }
  };

  const handleHidePost = (postId: string) => {
    try {
      const stored = localStorage.getItem('ft_hidden_post_ids');
      let hiddenIds: string[] = stored ? JSON.parse(stored) : [];
      if (!hiddenIds.includes(postId)) {
        hiddenIds.push(postId);
        localStorage.setItem('ft_hidden_post_ids', JSON.stringify(hiddenIds));
      }
      
      // Filter out immediately from active states
      setFeedItems(prev => prev.filter(item => item.id !== postId));
      setAllFeedItems(prev => prev.filter(item => item.id !== postId));
      
      alert('포스트가 숨김 처리되었습니다.');
      setPostMenuModal({ isOpen: false, post: null });
    } catch (e) {
      console.error('Hide post error:', e);
    }
  };

  const handleReportSubmit = async () => {
    if (!user) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }
    if (!reportModal.post || !reportModal.reason) {
      alert('신고 사유를 선택해주세요.');
      return;
    }
    
    setReportModal(prev => ({ ...prev, submitting: true }));
    try {
      const result = await apiService.reportGalleryPost(
        reportModal.post.id,
        user.id,
        reportModal.reason
      );
      if (result && result.success) {
        alert('신고가 정상 접수되었습니다. 관리자 검토 후 신속히 조치하겠습니다.');
        setReportModal({ isOpen: false, post: null, reason: '', submitting: false });
      } else {
        alert('신고 접수에 실패했습니다.');
      }
    } catch (e) {
      console.error('Report post error:', e);
      alert('오류가 발생했습니다.');
    } finally {
      setReportModal(prev => ({ ...prev, submitting: false }));
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="ft-post" style={{ opacity: 0.5 }}>
              <div className="ft-post-header">
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--ft-bg-tertiary)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: 100, height: 14, background: 'var(--ft-bg-tertiary)', borderRadius: 4, marginBottom: 6 }} />
                  <div style={{ width: 60, height: 10, background: 'var(--ft-bg-tertiary)', borderRadius: 4 }} />
                </div>
              </div>
              <div style={{ width: '100%', aspectRatio: '1/1', background: 'var(--ft-bg-tertiary)' }} />
            </div>
          ))}
        </div>
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
                <button className="ft-post-more" onClick={() => setPostMenuModal({ isOpen: true, post: item })}>
                  <span className="material-symbols-outlined">more_horiz</span>
                </button>
              </div>

              {/* Media rendering (Carousel or Single, locked or unlocked) */}
              {item.url && (() => {
                const urls = item.url ? item.url.split(',') : [];
                const isLocked = item.isPaid && !unlockedPostIds.includes(item.id) && !subscribedIds.includes(item.ccaId);
                const unlockPrice = item.pricePoints || 200;
                
                if (isLocked) {
                  return (
                    <div className="ft-post-media locked" style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px' }}>
                      <img 
                        src={urls[0]} 
                        alt="" 
                        style={{ filter: 'blur(20px)', width: '100%', aspectRatio: '1/1', objectFit: 'cover', transform: 'scale(1.1)' }}
                      />
                      <div className="ft-post-lock-overlay" style={{
                        position: 'absolute', inset: 0, 
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', color: '#fff', padding: 20, textAlign: 'center'
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#eebd2b', marginBottom: '12px', fontVariationSettings: "'FILL' 1" }}>lock</span>
                        <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '6px' }}>프리미엄 미디어 콘텐츠</h4>
                        <p style={{ fontSize: '12px', color: '#ccc', marginBottom: '16px' }}>이 콘텐츠는 잠겨 있습니다. 포인트 또는 구독을 통해 해제해 보세요.</p>
                        <button 
                          className="ft-primary-btn" 
                          style={{ margin: 0, padding: '10px 20px', fontSize: '13px', borderRadius: '10px', boxShadow: 'none' }}
                          onClick={() => handleUnlockPost(item.id, unlockPrice)}
                        >
                          해제하기 - {unlockPrice} 포인트
                        </button>
                      </div>
                    </div>
                  );
                }

                // Unlocked media
                if (urls.length > 1) {
                  const activeIdx = carouselIndices[item.id] || 0;
                  return (
                    <div className="ft-carousel-container" style={{ position: 'relative' }}>
                      <div 
                        className="ft-carousel-track hide-scrollbar" 
                        onScroll={(e) => handleCarouselScroll(item.id, e)}
                        style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollBehavior: 'smooth' }}
                      >
                        {urls.map((slideUrl, idx) => (
                          <div key={idx} className="ft-carousel-slide" style={{ flex: '0 0 100%', width: '100%', scrollSnapAlign: 'start' }}>
                            {item.type === 'video' ? (
                              <video src={slideUrl} controls preload="metadata" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} />
                            ) : (
                              <img 
                                src={slideUrl} 
                                alt="" 
                                loading="lazy" 
                                onClick={() => setExpandedImage(slideUrl)}
                                style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', cursor: 'pointer' }}
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Navigation arrows */}
                      {activeIdx > 0 && (
                        <button 
                          className="ft-carousel-arrow prev" 
                          onClick={(e) => handleCarouselArrowClick(item.id, 'prev', urls.length, e)}
                          style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_left</span>
                        </button>
                      )}
                      {activeIdx < urls.length - 1 && (
                        <button 
                          className="ft-carousel-arrow next" 
                          onClick={(e) => handleCarouselArrowClick(item.id, 'next', urls.length, e)}
                          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_right</span>
                        </button>
                      )}

                      {/* Carousel Indicator Dots */}
                      <div className="ft-carousel-dots" style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', gap: 6, background: 'rgba(0,0,0,0.4)', padding: '4px 8px', borderRadius: 10 }}>
                        {urls.map((_, idx) => (
                          <div 
                            key={idx} 
                            className={`ft-carousel-dot ${idx === activeIdx ? 'active' : ''}`} 
                            style={{ width: 6, height: 6, borderRadius: '50%', background: idx === activeIdx ? 'var(--ft-primary)' : 'rgba(255,255,255,0.4)' }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                }

                // Single Media
                return (
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
                );
              })()}

              {/* Action Bar (sit below media, but above caption text) */}
              <div className="ft-post-actions ft-feed-actionbar" style={{ marginTop: '12px', marginBottom: '8px' }}>
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

                {/* Send Tip Button */}
                <button 
                  className="ft-post-action ft-feed-action" 
                  onClick={() => setTipModal({ isOpen: true, post: item, amount: '100', submitting: false, success: false })}
                >
                  <span className="material-symbols-outlined" style={{ color: '#eebd2b' }}>paid</span>
                  <span className="ft-feed-action-count" style={{ color: '#eebd2b', fontWeight: 700 }}>팁 보내기</span>
                </button>

                <button className="ft-post-action ft-feed-action" style={{ marginLeft: 'auto' }} onClick={(e) => handleShare(e, item)}>
                  <span className="material-symbols-outlined">share</span>
                </button>

                <div className="ft-post-action-spacer" />
              </div>

              {/* Caption Text (moved directly below actions) */}
              {item.caption && (
                <div className="ft-post-body" style={{ marginTop: '0px', paddingTop: '0px', marginBottom: '12px' }}>
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

          {/* Infinite Scroll target and loader indicator */}
          <div ref={observerTarget} style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
            {loadingMore && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div className="ft-spinner-sm"></div>
                <span style={{ fontSize: '14px', color: '#888' }}>로딩 중...</span>
              </div>
            )}
            {!hasMore && feedItems.length > 0 && (
              <span style={{ fontSize: '13px', color: '#aaa', letterSpacing: '0.5px' }}>모든 게시물을 불러왔습니다.</span>
            )}
          </div>
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

      {/* Post Option Menu Bottom Sheet Modal */}
      {postMenuModal.isOpen && postMenuModal.post && (
        <div className="ft-login-overlay" onClick={() => setPostMenuModal({ isOpen: false, post: null })}>
          <div className="ft-login-modal" onClick={e => e.stopPropagation()} style={{ 
            padding: 0, 
            width: '100%', 
            maxWidth: '450px', 
            borderRadius: '24px 24px 0 0',
            position: 'absolute',
            bottom: 0,
            animation: 'slide-up 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.1)'
          }}>
            {/* Header/Grabber */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: '40px', height: '4px', background: 'var(--ft-border-light)', borderRadius: '2px' }} />
            </div>

            <div style={{ padding: '12px 20px 24px' }}>
              {/* Menu items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {user && (user.id === postMenuModal.post.ccaId || user.role === 'super_admin') ? (
                  <>
                    {/* Delete action */}
                    <button 
                      onClick={() => handleDeletePost(postMenuModal.post.id)}
                      style={{
                        width: '100%',
                        padding: '16px',
                        background: 'none',
                        border: 'none',
                        color: '#ff6b6b',
                        fontSize: '15px',
                        fontWeight: '700',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        borderRadius: '12px',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,107,107,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                      포스트 삭제하기
                    </button>
                  </>
                ) : (
                  <>
                    {/* Others actions */}
                    <button 
                      onClick={() => { setReportModal({ isOpen: true, post: postMenuModal.post, reason: '', submitting: false }); setPostMenuModal({ isOpen: false, post: null }); }}
                      style={{
                        width: '100%',
                        padding: '16px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--ft-text)',
                        fontSize: '15px',
                        fontWeight: '700',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        borderRadius: '12px',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--ft-bg-tertiary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#ff6b6b' }}>report</span>
                      신고하기
                    </button>

                    <button 
                      onClick={() => handleHidePost(postMenuModal.post.id)}
                      style={{
                        width: '100%',
                        padding: '16px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--ft-text)',
                        fontSize: '15px',
                        fontWeight: '700',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        borderRadius: '12px',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--ft-bg-tertiary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>visibility_off</span>
                      안보이기
                    </button>

                    <button 
                      onClick={() => handleToggleBookmark(postMenuModal.post)}
                      style={{
                        width: '100%',
                        padding: '16px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--ft-text)',
                        fontSize: '15px',
                        fontWeight: '700',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        borderRadius: '12px',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--ft-bg-tertiary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px', color: bookmarkedIds.includes(postMenuModal.post.id) ? '#daa520' : 'var(--ft-text)' }}>
                        {bookmarkedIds.includes(postMenuModal.post.id) ? 'bookmark_added' : 'bookmark'}
                      </span>
                      {bookmarkedIds.includes(postMenuModal.post.id) ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                    </button>

                    <button 
                      onClick={() => { setPostMenuModal({ isOpen: false, post: null }); goToProfile(postMenuModal.post.ccaNickname || postMenuModal.post.ccaName); }}
                      style={{
                        width: '100%',
                        padding: '16px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--ft-text)',
                        fontSize: '15px',
                        fontWeight: '700',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        borderRadius: '12px',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--ft-bg-tertiary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>account_circle</span>
                      프로필 보기
                    </button>
                  </>
                )}

                {/* Cancel button */}
                <button 
                  onClick={() => setPostMenuModal({ isOpen: false, post: null })}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: 'var(--ft-bg-tertiary)',
                    border: 'none',
                    color: 'var(--ft-text-secondary)',
                    fontSize: '15px',
                    fontWeight: '700',
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: '16px',
                    marginTop: '12px',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Post Bottom Sheet Modal */}
      {reportModal.isOpen && reportModal.post && (
        <div className="ft-login-overlay" onClick={() => setReportModal({ isOpen: false, post: null, reason: '', submitting: false })}>
          <div className="ft-login-modal" onClick={e => e.stopPropagation()} style={{ 
            padding: 0, 
            width: '100%', 
            maxWidth: '450px', 
            borderRadius: '24px 24px 0 0',
            position: 'absolute',
            bottom: 0,
            animation: 'slide-up 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.1)'
          }}>
            {/* Header/Grabber */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: '40px', height: '4px', background: 'var(--ft-border-light)', borderRadius: '2px' }} />
            </div>

            <div style={{ padding: '12px 20px 24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '16px', textAlign: 'center' }}>신고 사유 선택</h3>
              <p style={{ fontSize: '13px', color: 'var(--ft-text-secondary)', marginBottom: '20px', textAlign: 'center' }}>
                이 포스트를 신고하는 구체적인 이유를 선택해 주세요.
              </p>

              {/* Reason choices */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '20px' }}>
                {[
                  '부적절한 이미지 또는 동영상',
                  '스팸, 홍보 또는 광고',
                  '권리 침해 (저작권/초상권)',
                  '괴롭힘, 명예훼손 또는 혐오 발언',
                  '기타 사유'
                ].map((r) => (
                  <button 
                    key={r}
                    onClick={() => setReportModal(prev => ({ ...prev, reason: r }))}
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      background: reportModal.reason === r ? 'rgba(238, 189, 43, 0.1)' : 'var(--ft-bg-tertiary)',
                      border: reportModal.reason === r ? '1px solid var(--ft-primary)' : '1px solid transparent',
                      color: reportModal.reason === r ? 'var(--ft-primary)' : 'var(--ft-text)',
                      fontSize: '14px',
                      fontWeight: '700',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderRadius: '12px',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>{r}</span>
                    {reportModal.reason === r && (
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => setReportModal({ isOpen: false, post: null, reason: '', submitting: false })}
                  style={{
                    flex: 1,
                    padding: '16px',
                    background: 'var(--ft-bg-tertiary)',
                    border: 'none',
                    color: 'var(--ft-text-secondary)',
                    fontSize: '15px',
                    fontWeight: '700',
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: '16px',
                    transition: 'opacity 0.2s'
                  }}
                >
                  취소
                </button>
                <button 
                  onClick={handleReportSubmit}
                  disabled={reportModal.submitting || !reportModal.reason}
                  style={{
                    flex: 1,
                    padding: '16px',
                    background: 'var(--ft-gradient)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: '700',
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: '16px',
                    transition: 'opacity 0.2s',
                    opacity: (!reportModal.reason || reportModal.submitting) ? 0.5 : 1
                  }}
                >
                  {reportModal.submitting ? '제출 중...' : '신고 완료'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Tip Modal */}
      {tipModal.isOpen && tipModal.post && (
        <div className="ft-login-overlay" onClick={() => setTipModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="ft-login-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '360px', padding: '24px 20px', borderRadius: '24px' }}>
            {tipModal.success ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '64px', color: '#4caf50', marginBottom: '16px' }}>check_circle</span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>팁 전송 완료!</h3>
                <p style={{ fontSize: '14px', color: 'var(--ft-text-secondary)', marginBottom: '24px' }}>
                  {tipModal.post.ccaNickname || tipModal.post.ccaName}님에게 {tipModal.amount}P 팁을 전송했습니다.
                </p>
                <button 
                  className="ft-primary-btn" 
                  style={{ width: '100%', margin: 0 }} 
                  onClick={() => setTipModal({ isOpen: false, post: null, amount: '100', submitting: false, success: false })}
                >
                  확인
                </button>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '4px', textAlign: 'center' }}>팁 보내기</h3>
                <p style={{ fontSize: '13px', color: 'var(--ft-text-secondary)', textAlign: 'center', marginBottom: '20px' }}>
                  {tipModal.post.ccaNickname || tipModal.post.ccaName}님에게 감사의 팁을 보내보세요.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '16px' }}>
                  {['100', '200', '500', '1000'].map(val => (
                    <button 
                      key={val}
                      onClick={() => setTipModal(prev => ({ ...prev, amount: val }))}
                      style={{
                        flex: '1 0 40%',
                        padding: '12px',
                        borderRadius: '12px',
                        border: tipModal.amount === val ? '2px solid var(--ft-primary)' : '1px solid var(--ft-border)',
                        background: tipModal.amount === val ? 'rgba(238, 189, 43, 0.08)' : 'var(--ft-bg-tertiary)',
                        color: tipModal.amount === val ? 'var(--ft-primary)' : 'var(--ft-text)',
                        fontWeight: '700',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {val} P
                    </button>
                  ))}
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--ft-text-tertiary)', fontWeight: '700', display: 'block', marginBottom: '6px' }}>직접 입력</label>
                  <input 
                    type="number"
                    placeholder="보낼 팁 입력 (P)"
                    value={tipModal.amount}
                    onChange={(e) => setTipModal(prev => ({ ...prev, amount: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
                      border: '1px solid var(--ft-border)',
                      background: 'var(--ft-bg-tertiary)',
                      color: 'var(--ft-text)',
                      fontSize: '14px',
                      fontWeight: '700',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--ft-text-tertiary)', marginTop: '8px', textAlign: 'right' }}>
                    보유 포인트: <span style={{ fontWeight: '800', color: 'var(--ft-text)' }}>{user?.points || 0} P</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    className="ft-secondary-btn" 
                    style={{ flex: 1, margin: 0, padding: '14px', borderRadius: '12px' }}
                    onClick={() => setTipModal({ isOpen: false, post: null, amount: '100', submitting: false, success: false })}
                  >
                    취소
                  </button>
                  <button 
                    className="ft-primary-btn" 
                    style={{ flex: 2, margin: 0, padding: '14px', borderRadius: '12px' }}
                    onClick={handleSendTip}
                    disabled={tipModal.submitting || !tipModal.amount}
                  >
                    {tipModal.submitting ? '전송 중...' : '보내기'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FeedHome;
