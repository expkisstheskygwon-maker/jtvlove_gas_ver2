import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { CCA, MediaItem } from '../types';
import './CCALinkInBio.css';

interface CCALinkInBioProps {
  forcedUsername?: string;
}

// Grade config
const GRADE_CONFIG: Record<string, { label: string; icon: string }> = {
  STAR: { label: 'STAR', icon: '⭐' },
  ACE: { label: 'ACE', icon: '💎' },
  PRO: { label: 'PRO', icon: '🔥' },
  RISING: { label: 'RISING', icon: '🌱' },
  NEW: { label: 'NEW', icon: '🆕' },
  CUTE: { label: 'CUTE', icon: '💕' },
};

function getVisitorId(): string {
  let vid = localStorage.getItem('lib_visitor_id');
  if (!vid) {
    vid = 'v_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    localStorage.setItem('lib_visitor_id', vid);
  }
  return vid;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return `${Math.floor(diffDay / 7)}w`;
}

const CCALinkInBio: React.FC<CCALinkInBioProps> = ({ forcedUsername }) => {
  const params = useParams();
  const navigate = useNavigate();
  const username = forcedUsername || params.username;

  const { user } = useAuth();
  const [cca, setCca] = useState<CCA | null>(null);
  const [gallery, setGallery] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Upload State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'photo' | 'video'>('photo');
  const [caption, setCaption] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Hearts
  const [heartCount, setHeartCount] = useState(0);
  const [isHearted, setIsHearted] = useState(false);

  // Follow
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  // Views
  const [todayViews, setTodayViews] = useState(0);

  // Request Modal State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestForm, setRequestForm] = useState({
    customerName: '',
    customerContact: '',
    customerNote: '',
    preferredDate: new Date().toISOString().split('T')[0],
    preferredTime: '20:00',
    groupSize: 1
  });

  // Lightbox
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [touchStartX, setTouchStartX] = useState(0);

  // Gallery tab
  const [galleryTab, setGalleryTab] = useState<'grid' | 'info'>('grid');

  // Attendance state
  const [isWorking, setIsWorking] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Story highlights states
  const [storyOpen, setStoryOpen] = useState(false);
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [storyPlaying, setStoryPlaying] = useState(false);
  const [heartPopped, setHeartPopped] = useState(false);

  useEffect(() => {
    if (!storyOpen || !storyPlaying || gallery.length === 0) return;
    
    const interval = 30; // ms
    const step = (interval / 3500) * 100; // 3.5s total slide time
    
    const timer = setInterval(() => {
      setStoryProgress(prev => {
        if (prev >= 100) {
          if (activeStoryIdx < gallery.length - 1) {
            setActiveStoryIdx(curr => curr + 1);
            return 0;
          } else {
            setStoryOpen(false);
            setStoryPlaying(false);
            return 0;
          }
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [storyOpen, storyPlaying, activeStoryIdx, gallery.length]);

  const handlePrevStory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStoryProgress(0);
    if (activeStoryIdx > 0) {
      setActiveStoryIdx(prev => prev - 1);
    } else {
      setActiveStoryIdx(0);
    }
  };

  const handleNextStory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStoryProgress(0);
    if (activeStoryIdx < gallery.length - 1) {
      setActiveStoryIdx(prev => prev + 1);
    } else {
      setStoryOpen(false);
      setStoryPlaying(false);
    }
  };

  const handleOpenStory = () => {
    if (gallery.length === 0) return;
    setActiveStoryIdx(0);
    setStoryProgress(0);
    setStoryOpen(true);
    setStoryPlaying(true);
  };

  // ─── Fetch Data ───
  useEffect(() => {
    const fetchData = async () => {
      if (!username) return;
      setLoading(true);
      try {
        const [ccaData, galleryData] = await Promise.all([
          apiService.getCCAByNickname(username),
          apiService.getGallery(username)
        ]);
        setCca(ccaData);
        setGallery(Array.isArray(galleryData) ? galleryData : []);
        if (ccaData) {
          setHeartCount(ccaData.likesCount || 0);
          setTodayViews(ccaData.viewsCount || 0);
          setIsWorking(ccaData.isWorking || false);
          setFollowersCount((ccaData as any).followersCount || 0);
        }
      } catch (err) {
        console.error("Fetch data error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [username]);

  // Handle auto-open upload modal from query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search || window.location.hash.split('?')[1]);
    if (params.get('upload') === 'true' && user?.ccaId === cca?.id) {
      setShowUploadModal(true);
      // Clean up URL to prevent re-opening
      const newUrl = window.location.href.split('?')[0];
      window.history.replaceState({}, '', newUrl);
    }
  }, [user?.ccaId, cca?.id]);

  // Record view
  useEffect(() => {
    if (!cca?.id) return;
    const key = `lib_view_${cca.id}`;
    const lastView = sessionStorage.getItem(key);
    const now = Date.now();
    if (lastView && now - parseInt(lastView) < 30 * 60 * 1000) return;
    sessionStorage.setItem(key, String(now));
    fetch(`/api/cca-views`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cca_id: cca.id, visitor_id: getVisitorId() })
    }).then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.todayViews !== undefined) setTodayViews(data.todayViews);
      }).catch(() => { });
  }, [cca?.id]);

  // Load heart status and follow status
  useEffect(() => {
    if (!cca?.id) return;
    const userId = getVisitorId();
    apiService.getCCALikes(cca.id, userId).then(data => {
      setHeartCount(data.count || 0);
      setIsHearted(data.liked || false);
    }).catch(() => { });

    // Also check follow status (requires a logged in user realistically but we can try if there's user context, or just skip if we must use actual users. I'll use localStorage user info if available, otherwise assume not followed)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        apiService.checkCCAFollow(parsed.id, cca.id).then(res => setIsFollowing(res.isFollowing));
      } catch (e) {}
    }
  }, [cca?.id]);

  const showToastMsg = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      showToastMsg('Link copied! ✨');
    }).catch(() => {
      showToastMsg('Failed to copy link.');
    });
  };

  const handleToggleHeart = async () => {
    if (!cca?.id) return;
    setHeartPopped(true);
    setTimeout(() => setHeartPopped(false), 300);
    const visitorId = getVisitorId();
    try {
      const result = await apiService.toggleCCALike(cca.id, visitorId);
      setIsHearted(result.liked);
      setHeartCount(result.count);
    } catch {
      setIsHearted(!isHearted);
      setHeartCount(prev => isHearted ? prev - 1 : prev + 1);
    }
  };

  const handleOpenRequestModal = () => {
    const storedUser = localStorage.getItem('user');
    let initialName = '';
    let initialContact = '';
    
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        initialName = parsed.nickname || parsed.realName || '';
        initialContact = parsed.phone || '';
      } catch (e) {}
    }

    setRequestForm(prev => ({
      ...prev,
      customerName: initialName,
      customerContact: initialContact
    }));
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async () => {
    if (!cca || !requestForm.customerName) {
      showToastMsg('이름을 입력해주세요.');
      return;
    }
    
    setRequestSubmitting(true);
    try {
      const storedUser = localStorage.getItem('user');
      let userId = '';
      if (storedUser) {
        try { userId = JSON.parse(storedUser).id; } catch(e) {}
      }

      const result = await apiService.createCCARequest({
        cca_id: cca.id,
        venue_id: (cca as any).venueId || '',
        cca_name: cca.nickname || cca.name,
        venue_name: (cca as any).venueName || '',
        customer_name: requestForm.customerName,
        customer_contact: requestForm.customerContact,
        customer_note: requestForm.customerNote,
        preferred_date: requestForm.preferredDate,
        preferred_time: requestForm.preferredTime,
        group_size: requestForm.groupSize,
        user_id: userId
      });

      if (result.success) {
        setRequestSuccess(true);
        setTimeout(() => {
          setShowRequestModal(false);
          setRequestSuccess(false);
          setRequestForm({
            customerName: '',
            customerContact: '',
            customerNote: '',
            preferredDate: new Date().toISOString().split('T')[0],
            preferredTime: '20:00',
            groupSize: 1
          });
        }, 2500);
      } else {
        showToastMsg('요청 실패: ' + (result.error || '알 수 없는 오류'));
      }
    } catch (err) {
      console.error(err);
      showToastMsg('요청 중 오류가 발생했습니다.');
    } finally {
      setRequestSubmitting(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!cca?.id) return;
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      showToastMsg('로그인이 필요합니다.');
      return;
    }
    try {
      const parsed = JSON.parse(storedUser);
      setIsFollowing(!isFollowing); // Optimistic UI
      const result = await apiService.toggleCCAFollow(parsed.id, cca.id);
      setIsFollowing(result.isFollowing);
      if (result.isFollowing) showToastMsg('팔로우했습니다!');
    } catch {
      setIsFollowing(!isFollowing); // Revert
    }
  };

  const handleAttendanceToggle = async () => {
    if (!cca?.id || !user?.ccaId) return;
    setAttendanceLoading(true);
    try {
      const action = isWorking ? 'check_out' : 'check_in';
      const response = await fetch('/api/cca-portal/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ccaId: cca.id,
          venueId: (cca as any).venueId,
          action
        })
      });

      const result = await response.json();
      if (result.success) {
        setIsWorking(!isWorking);
        showToastMsg(isWorking ? '퇴근했습니다.' : '출근했습니다.');
        // Refresh CCA data to get updated status
        const updatedCca = await apiService.getCCAByNickname(username || '');
        if (updatedCca) {
          setCca(updatedCca);
          setIsWorking(updatedCca.isWorking || false);
        }
      } else {
        showToastMsg('오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('Attendance error:', err);
      showToastMsg('오류가 발생했습니다.');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const goToFeed = () => {
    navigate('/feed');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (uploadType === 'photo' && !selectedFile) {
      showToastMsg('사진을 선택해주세요.');
      return;
    }
    if (uploadType === 'video' && !videoUrl) {
      showToastMsg('비디오 링크를 입력해주세요.');
      return;
    }

    setIsUploading(true);
    try {
      let url = '';
      if (uploadType === 'photo' && selectedFile) {
        url = await apiService.uploadImage(selectedFile, 'gallery') || '';
      } else {
        url = videoUrl;
      }

      if (!url) throw new Error("업로드 실패: URL을 생성하지 못했습니다.");

      const result = await apiService.createGalleryItem({
        ccaId: cca?.id || '',
        type: uploadType,
        url,
        caption
      });

      if (result.success) {
        setShowUploadModal(false);
        setCaption('');
        setVideoUrl('');
        setSelectedFile(null);
        setPreviewUrl(null);
        showToastMsg('성공적으로 업로드되었습니다! ✨');
        // Refresh gallery
        const updatedGallery = await apiService.getGallery(cca?.id || '');
        setGallery(updatedGallery);
      } else {
        showToastMsg('업로드 실패: ' + result.error);
      }
    } catch (err: any) {
      showToastMsg('오류: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const isOwner = user?.ccaId === cca?.id;

  // Lightbox controls
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
    document.body.style.overflow = '';
  };

  const goToNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % gallery.length);
  }, [lightboxIndex, gallery.length]);

  const goToPrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + gallery.length) % gallery.length);
  }, [lightboxIndex, gallery.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, goToNext, goToPrev]);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
  };

  const gradeConfig = cca?.grade ? GRADE_CONFIG[cca.grade] || GRADE_CONFIG.NEW : GRADE_CONFIG.NEW;

  // ─── Loading ───
  if (loading) {
    return (
      <div className="lib-wrapper">
        <div className="lib-loading">
          <div className="lib-loading-spinner"></div>
          <span className="lib-loading-text">Loading Profile...</span>
        </div>
      </div>
    );
  }

  // ─── Not Found ───
  if (!cca) {
    return (
      <div className="lib-wrapper">
        <div className="lib-error">
          <span className="material-symbols-outlined" style={{ fontSize: 48 }}>person_off</span>
          <p style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em' }}>CCA not found</p>
          <button onClick={goToFeed} style={{
            marginTop: 12, padding: '10px 24px', background: '#eebd2b', color: '#1b180d',
            borderRadius: 12, border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer',
            fontFamily: 'Manrope, sans-serif'
          }}>
            Go to Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lib-wrapper luminary-theme">
      <div className="lib-container">
        {/* Header */}
        <header className="lib-header">
          <span className="lib-header-username">
            {cca.nickname || cca.name}
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#eebd2b' }}>verified</span>
          </span>
          <div className="lib-header-actions">
            {isOwner && (
              <button className="lib-header-btn" onClick={() => setShowUploadModal(true)} style={{ color: 'var(--luminary-gold)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>add_circle</span>
              </button>
            )}
            <button className="lib-header-btn" onClick={handleCopyLink} aria-label="Copy Link">
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>share</span>
            </button>
            <button className="lib-header-btn" onClick={goToFeed} aria-label="Feed">
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>grid_view</span>
            </button>
          </div>
        </header>

        {/* Profile Section */}
        <section className="lib-profile">
          <div className="lib-profile-row">
            {/* Avatar */}
            <div className="lib-profile-avatar-container">
              <div 
                className={`lib-profile-avatar-ring ${gallery.length > 0 ? 'active' : ''}`}
                onClick={() => gallery.length > 0 && handleOpenStory()}
              >
                <img
                  src={cca.image || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200'}
                  alt={cca.name}
                  className="lib-profile-avatar"
                />
              </div>

              {/* Online Dot */}
              {isWorking && <span className="lib-status-online-dot"></span>}

              <span className={`lib-profile-avatar-badge ${cca.grade || 'NEW'}`}>
                {gradeConfig.label}
              </span>
            </div>

            {/* Stats */}
            <div className="lib-profile-stats">
              <div className="lib-profile-stat">
                <span className="lib-profile-stat-value">{gallery.length}</span>
                <span className="lib-profile-stat-label">Posts</span>
              </div>
              <button 
                className={`lib-profile-stat ${heartPopped ? 'lib-pop-active' : ''}`} 
                onClick={handleToggleHeart} 
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}
              >
                <span className="lib-profile-stat-value" style={isHearted ? { color: '#ef4444' } : {}}>
                  {heartCount.toLocaleString()}
                </span>
                <span className="lib-profile-stat-label">{isHearted ? '❤️ Hearts' : 'Hearts'}</span>
              </button>
              <div className="lib-profile-stat">
                <span className="lib-profile-stat-value">{followersCount.toLocaleString()}</span>
                <span className="lib-profile-stat-label">Followers</span>
              </div>
              <div className="lib-profile-stat">
                <span className="lib-profile-stat-value">{todayViews.toLocaleString()}</span>
                <span className="lib-profile-stat-label">Views</span>
              </div>
            </div>
          </div>

          <div className="lib-profile-info">
            <div className="lib-profile-name">{cca.nickname || cca.name}</div>
            <div className="lib-profile-venue">
              <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#eebd2b' }}>location_on</span>
              {(cca as any).venueName || 'Venue'}
              {cca.score !== undefined && (
                <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 900, color: '#eebd2b' }}>
                  Score: {cca.score}
                </span>
              )}
            </div>

            {(cca.description || cca.oneLineStory) && (
              <div className="lib-profile-bio">
                {cca.description || cca.oneLineStory}
              </div>
            )}

            {/* Info Chips */}
            <div className="lib-profile-info-chips">
              {cca.mbti && (
                <span className="lib-profile-chip">
                  <span className="material-symbols-outlined">psychology</span>
                  {cca.mbti}
                </span>
              )}
              {cca.zodiac && (
                <span className="lib-profile-chip">
                  <span className="material-symbols-outlined">auto_awesome</span>
                  {cca.zodiac}
                </span>
              )}
              {cca.height && (
                <span className="lib-profile-chip">
                  <span className="material-symbols-outlined">height</span>
                  {cca.height}
                </span>
              )}
              {cca.languages && cca.languages.length > 0 && (
                <span className="lib-profile-chip">
                  <span className="material-symbols-outlined">translate</span>
                  {cca.languages.join(', ')}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="lib-profile-actions">
              {isOwner && (
                <button
                  className="lib-profile-action-btn"
                  onClick={handleAttendanceToggle}
                  disabled={attendanceLoading}
                  style={{
                    background: isWorking ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                    color: isWorking ? '#ef4444' : '#22c55e',
                    border: `1px solid ${isWorking ? '#ef4444' : '#22c55e'}`
                  }}
                >
                  <span className="material-symbols-outlined">
                    {isWorking ? 'logout' : 'login'}
                  </span>
                  {attendanceLoading ? '처리 중...' : (isWorking ? '퇴근하기' : '출근하기')}
                </button>
              )}
              <button
                className={`lib-profile-action-btn ${isFollowing ? 'secondary' : 'primary'}`}
                onClick={handleFollowToggle}
                style={!isFollowing ? { background: '#eebd2b', color: '#1b180d' } : {}}
              >
                <span className="material-symbols-outlined">{isFollowing ? 'person_remove' : 'person_add'}</span>
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              <button className="lib-profile-action-btn secondary" onClick={handleOpenRequestModal}>
                <span className="material-symbols-outlined">calendar_month</span>
                Request
              </button>
              <button className="lib-profile-action-btn secondary" onClick={() => {
                if (cca) window.location.href = `https://jtvstar.com/#/ccas/${cca.id}`;
              }}>
                <span className="material-symbols-outlined">badge</span>
                Full Profile
              </button>
            </div>
          </div>
        </section>

        {/* Gallery Tabs */}
        <div className="lib-gallery-tabs">
          <button
            className={`lib-gallery-tab ${galleryTab === 'grid' ? 'active' : ''}`}
            onClick={() => setGalleryTab('grid')}
          >
            <span className="material-symbols-outlined">grid_on</span>
          </button>
          <button
            className={`lib-gallery-tab ${galleryTab === 'info' ? 'active' : ''}`}
            onClick={() => setGalleryTab('info')}
          >
            <span className="material-symbols-outlined">person</span>
          </button>
        </div>

        {/* Gallery Grid or Info */}
        {galleryTab === 'grid' ? (
          gallery.length > 0 ? (
            <div className="lib-gallery-grid">
              {gallery.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="lib-gallery-item"
                  onClick={() => openLightbox(idx)}
                >
                  <img src={item.url} alt={item.caption || ''} loading="lazy" />
                  {item.type === 'video' && (
                    <div className="lib-gallery-video-badge">
                      <span className="material-symbols-outlined">play_circle</span>
                    </div>
                  )}
                  <div className="lib-gallery-item-overlay">
                    <span>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>favorite</span>
                      {item.likes || 0}
                    </span>
                    <span>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chat_bubble</span>
                      {item.commentsCount || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="lib-gallery-empty">
              <span className="material-symbols-outlined">add_photo_alternate</span>
              <p>No posts yet</p>
            </div>
          )
        ) : (
          /* Info Tab */
          <div style={{ padding: '24px 20px 100px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {cca.mbti && (
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 4 }}>MBTI</div>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>{cca.mbti}</div>
                </div>
              )}
              {cca.zodiac && (
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 4 }}>Zodiac</div>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>{cca.zodiac}</div>
                </div>
              )}
              {cca.height && (
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 4 }}>Height</div>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>{cca.height}</div>
                </div>
              )}
              {cca.languages && cca.languages.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 4 }}>Languages</div>
                  <div style={{ fontSize: 14, fontWeight: 900 }}>{cca.languages.join(', ')}</div>
                </div>
              )}
              {cca.drinking && (
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 4 }}>Drinking</div>
                  <div style={{ fontSize: 14, fontWeight: 900 }}>{cca.drinking}</div>
                </div>
              )}
              {cca.smoking && (
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 4 }}>Smoking</div>
                  <div style={{ fontSize: 14, fontWeight: 900 }}>{cca.smoking}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom padding for fixed footer */}
        <div style={{ paddingBottom: 70 }}></div>

        {/* Bottom Navigation */}
        <nav className="lib-feed-link">
          <button className="lib-feed-tab" onClick={goToFeed}>
            <span className="material-symbols-outlined">home</span>
            <span className="lib-feed-tab-label">Feed</span>
          </button>
          <button className="lib-feed-tab active">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
            <span className="lib-feed-tab-label">Profile</span>
          </button>
          <button className="lib-feed-tab" onClick={() => { navigate('/'); }}>
            <span className="material-symbols-outlined">language</span>
            <span className="lib-feed-tab-label">Main Site</span>
          </button>
        </nav>

        {/* Toast */}
        {showToast && (
          <div className="lib-toast">{toastMessage}</div>
        )}

        {/* Lightbox */}
        {lightboxIndex !== null && gallery[lightboxIndex] && (
          <div
            className="lib-lightbox"
            onClick={closeLightbox}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <button className="lib-lightbox-close" onClick={closeLightbox}>
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="lib-lightbox-counter">
              {lightboxIndex + 1} / {gallery.length}
            </div>

            <div className="lib-lightbox-header" onClick={e => e.stopPropagation()}>
              <img src={cca.image} alt="" className="lib-lightbox-avatar" />
              <span className="lib-lightbox-author">{cca.nickname || cca.name}</span>
            </div>

            <div className="lib-lightbox-media" onClick={e => e.stopPropagation()}>
              {gallery[lightboxIndex].type === 'video' ? (
                <video src={gallery[lightboxIndex].url} controls autoPlay />
              ) : (
                <img src={gallery[lightboxIndex].url} alt={gallery[lightboxIndex].caption || ''} />
              )}
            </div>

            {gallery[lightboxIndex].caption && (
              <div className="lib-lightbox-footer" onClick={e => e.stopPropagation()}>
                <span style={{ fontSize: 13, fontWeight: 800, marginRight: 6 }}>{cca.nickname || cca.name}</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{gallery[lightboxIndex].caption}</span>
              </div>
            )}

            {gallery.length > 1 && (
              <>
                <button className="lib-lightbox-nav lib-lightbox-prev" onClick={e => { e.stopPropagation(); goToPrev(); }}>
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button className="lib-lightbox-nav lib-lightbox-next" onClick={e => { e.stopPropagation(); goToNext(); }}>
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Nomination Request Modal */}
        {showRequestModal && (
          <div className="lib-modal-overlay" onClick={() => !requestSubmitting && setShowRequestModal(false)}>
            <div className="lib-modal-content" onClick={e => e.stopPropagation()}>
              {requestSuccess ? (
                <div className="lib-modal-success">
                  <div className="lib-modal-success-icon">
                    <span className="material-symbols-outlined">check_circle</span>
                  </div>
                  <h3>요청 완료!</h3>
                  <p>{cca.nickname || cca.name}님에게 지명 요청이 전달되었습니다.</p>
                </div>
              ) : (
                <>
                  <div className="lib-modal-header">
                    <div className="lib-modal-title">
                      <h3>지명 요청</h3>
                      <p>{cca.nickname || cca.name} · {(cca as any).venueName}</p>
                    </div>
                    <button className="lib-modal-close" onClick={() => setShowRequestModal(false)}>
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>

                  <div className="lib-modal-body">
                    <div className="lib-form-group">
                      <label>예약자 이름 *</label>
                      <input
                        type="text"
                        value={requestForm.customerName}
                        onChange={e => setRequestForm({ ...requestForm, customerName: e.target.value })}
                        placeholder="성함을 입력해주세요"
                      />
                    </div>

                    <div className="lib-form-row">
                      <div className="lib-form-group">
                        <label>날짜</label>
                        <input
                          type="date"
                          value={requestForm.preferredDate}
                          onChange={e => setRequestForm({ ...requestForm, preferredDate: e.target.value })}
                        />
                      </div>
                      <div className="lib-form-group">
                        <label>시간</label>
                        <select
                          value={requestForm.preferredTime}
                          onChange={e => setRequestForm({ ...requestForm, preferredTime: e.target.value })}
                        >
                          {Array.from({ length: 12 }, (_, i) => {
                            const h = (18 + i) % 24;
                            const time = `${h.toString().padStart(2, '0')}:00`;
                            return <option key={time} value={time}>{time}</option>;
                          })}
                        </select>
                      </div>
                    </div>

                    <div className="lib-form-group">
                      <label>인원</label>
                      <input
                        type="number"
                        min="1"
                        value={requestForm.groupSize}
                        onChange={e => setRequestForm({ ...requestForm, groupSize: parseInt(e.target.value) || 1 })}
                      />
                    </div>

                    <div className="lib-form-group">
                      <label>메모 (선택사항)</label>
                      <textarea
                        rows={3}
                        value={requestForm.customerNote}
                        onChange={e => setRequestForm({ ...requestForm, customerNote: e.target.value })}
                        placeholder="추가 요청사항을 적어주세요..."
                      />
                    </div>
                  </div>

                  <div className="lib-modal-footer">
                    <button
                      className="lib-modal-submit-btn"
                      onClick={handleSubmitRequest}
                      disabled={requestSubmitting || !requestForm.customerName}
                    >
                      {requestSubmitting ? '전송 중...' : '지명 요청 보내기'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="lib-modal-overlay" onClick={() => !isUploading && setShowUploadModal(false)}>
            <div className="lib-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
              <div className="lib-modal-header">
                <div className="lib-modal-title">
                  <h3>콘텐츠 업로드</h3>
                  <p>나의 새로운 소식을 전해보세요</p>
                </div>
                <button className="lib-modal-close" onClick={() => setShowUploadModal(false)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="lib-modal-body">
                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                  <button 
                    onClick={() => setUploadType('photo')}
                    style={{
                      flex: 1, padding: '12px', borderRadius: 12, border: 'none',
                      background: uploadType === 'photo' ? 'var(--luminary-gold)' : 'rgba(255,255,255,0.05)',
                      color: uploadType === 'photo' ? '#000' : '#fff', fontWeight: 800, fontSize: 12
                    }}
                  >사진</button>
                  <button 
                    onClick={() => setUploadType('video')}
                    style={{
                      flex: 1, padding: '12px', borderRadius: 12, border: 'none',
                      background: uploadType === 'video' ? 'var(--luminary-gold)' : 'rgba(255,255,255,0.05)',
                      color: uploadType === 'video' ? '#000' : '#fff', fontWeight: 800, fontSize: 12
                    }}
                  >비디오</button>
                </div>

                {uploadType === 'photo' ? (
                  <label style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    width: '100%', aspectRatio: '1/1', background: 'rgba(255,255,255,0.03)',
                    borderRadius: 16, border: '2px dashed rgba(255,255,255,0.1)', cursor: 'pointer',
                    overflow: 'hidden', marginBottom: 20
                  }}>
                    {previewUrl ? (
                      <img src={previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: 40, opacity: 0.3 }}>add_a_photo</span>
                        <span style={{ fontSize: 12, opacity: 0.5, marginTop: 8 }}>사진 선택하기</span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                  </label>
                ) : (
                  <div className="lib-form-group" style={{ marginBottom: 20 }}>
                    <label>비디오 링크 (유튜브 등)</label>
                    <input 
                      type="text" 
                      placeholder="https://youtube.com/watch?v=..." 
                      value={videoUrl}
                      onChange={e => setVideoUrl(e.target.value)}
                    />
                  </div>
                )}

                <div className="lib-form-group">
                  <label>캡션 (내용)</label>
                  <textarea 
                    rows={4} 
                    placeholder="팬들에게 전할 말을 적어주세요..."
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                  />
                </div>
              </div>

              <div className="lib-modal-footer">
                <button 
                  className="lib-modal-submit-btn" 
                  onClick={handleUpload}
                  disabled={isUploading}
                  style={{ background: 'var(--ft-gradient)', color: '#fff' }}
                >
                  {isUploading ? '업로드 중...' : '게시하기'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Sticky CTA Panel */}
        {!isOwner && (
          <div className="lib-sticky-cta-mobile md:hidden">
            <button
              onClick={handleFollowToggle}
              className={`lib-sticky-cta-btn ${isFollowing ? 'secondary' : 'primary'}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                {isFollowing ? 'person_remove' : 'person_add'}
              </span>
              {isFollowing ? 'Following' : 'Follow'}
            </button>
            <button
              onClick={handleOpenRequestModal}
              className="lib-sticky-cta-btn primary"
              style={{ background: 'var(--luminary-gold)', color: '#000' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>calendar_month</span>
              Request
            </button>
          </div>
        )}

        {/* Story Player Modal */}
        {storyOpen && gallery.length > 0 && (
          <div className="ft-story-player-overlay" onClick={() => { setStoryOpen(false); setStoryPlaying(false); }}>
            <div className="ft-story-player-container" onClick={e => e.stopPropagation()}>
              
              {/* Progress Bars */}
              <div className="ft-story-progress-container">
                {gallery.map((_, idx) => (
                  <div key={idx} className="ft-story-progress-bar">
                    <div 
                      className={`ft-story-progress-bar-fill ${idx < activeStoryIdx ? 'completed' : ''}`}
                      style={{
                        width: idx === activeStoryIdx ? `${storyProgress}%` : idx < activeStoryIdx ? '100%' : '0%'
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Header */}
              <div className="ft-story-player-header">
                <img src={cca.image} alt="" className="ft-story-player-avatar" />
                <span className="ft-story-player-name">{cca.nickname || cca.name}</span>
                <button className="ft-story-player-close" onClick={() => { setStoryOpen(false); setStoryPlaying(false); }}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Media Wrapper */}
              <div className="ft-story-player-media-wrapper">
                {gallery[activeStoryIdx].type === 'video' ? (
                  <video src={gallery[activeStoryIdx].url} autoPlay playsInline muted className="ft-story-player-media" />
                ) : (
                  <img src={gallery[activeStoryIdx].url} alt="" className="ft-story-player-media" />
                )}

                {/* Navigation click zones */}
                <div className="ft-story-player-nav prev" onClick={handlePrevStory} />
                <div className="ft-story-player-nav next" onClick={handleNextStory} />
              </div>

              {/* Caption */}
              {gallery[activeStoryIdx].caption && (
                <div className="ft-story-player-caption">
                  {gallery[activeStoryIdx].caption}
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CCALinkInBio;
