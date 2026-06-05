import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';

interface FeedProfileProps {
  forcedUsername?: string;
}

const FeedProfile: React.FC<FeedProfileProps> = ({ forcedUsername }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [cca, setCca] = useState<any>(null);
  const [gallery, setGallery] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'bookmarks'>('posts');
  const [loading, setLoading] = useState(true);
  const [heartCount, setHeartCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [todayViews, setTodayViews] = useState(0);
  const [isWorking, setIsWorking] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<any | null>(null);
  const [activeMediaIdx, setActiveMediaIdx] = useState(0);

  useEffect(() => {
    setActiveMediaIdx(0);
  }, [lightboxMedia]);
 
  // Story highlights states
  const [storyOpen, setStoryOpen] = useState(false);
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [storyPlaying, setStoryPlaying] = useState(false);

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

  useEffect(() => {
    const currentUsername = forcedUsername || window.location.hash.replace('#/@', '');
    setUsername(currentUsername);
  }, [forcedUsername]);

  useEffect(() => {
    const fetchData = async () => {
      if (!username) return;
      setLoading(true);
      try {
        let ccaData = await apiService.getCCAByNickname(username) as any;
        let galleryData: any[] = [];

        if (ccaData) {
          galleryData = await apiService.getGallery(username);
        } else if (user && user.nickname === username) {
          // Mock profile object for general user viewing their own profile
          ccaData = {
            id: user.id,
            nickname: user.nickname,
            name: user.realName || '일반 회원',
            image: user.profileImage || `https://ui-avatars.com/api/?name=${user.nickname || 'U'}`,
            likesCount: 0,
            viewsCount: 0,
            isWorking: false,
            isGeneralUser: true
          };
        }

        setCca(ccaData);
        setGallery(Array.isArray(galleryData) ? galleryData : []);

        if (ccaData) {
          setHeartCount(ccaData.likesCount || 0);
          setTodayViews(ccaData.viewsCount || 0);
          setIsWorking(ccaData.isWorking || false);
          setFollowersCount(ccaData.followersCount || 0);

          if (ccaData.isGeneralUser) {
            setActiveTab('bookmarks');
          } else {
            setActiveTab('posts');
          }
        }
      } catch (err) {
        console.error("Fetch data error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [username, user]);

  // Load Bookmarks on Mount/User change
  useEffect(() => {
    if (user?.id) {
      try {
        const saved = localStorage.getItem(`ft_bookmarks_${user.id}`);
        if (saved) {
          setBookmarks(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Load bookmarks error:', e);
      }
    }
  }, [user?.id, username]);

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
        const updatedCca = await apiService.getCCAByNickname(username || '');
        if (updatedCca) {
          setCca(updatedCca);
          setIsWorking(updatedCca.isWorking || false);
        }
      }
    } catch (err) {
      console.error('Attendance error:', err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const isOwner = user && (user.ccaId === cca?.id || user.nickname === username);

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ color: 'var(--ft-text-secondary)' }}>로딩 중...</div>
      </div>
    );
  }

  if (!cca) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ color: 'var(--ft-text-secondary)' }}>프로필을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <div className="ft-profile-card">
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <div 
              onClick={handleOpenStory}
              className="relative" 
              style={{ 
                display: 'inline-block', 
                marginBottom: 16,
                cursor: gallery.length > 0 ? 'pointer' : 'default'
              }}
            >
              <div 
                className={gallery.length > 0 ? 'ft-story-ring-active' : ''}
                style={gallery.length > 0 ? { padding: '3px', borderRadius: '50%' } : {}}
              >
                <img
                  src={cca.image}
                  alt={cca.name}
                  style={{ 
                    width: 120, 
                    height: 120, 
                    borderRadius: '50%', 
                    objectFit: 'cover', 
                    border: gallery.length > 0 ? '4px solid var(--ft-bg)' : 'none',
                    display: 'block'
                  }}
                />
              </div>
              
              {/* Online Badge */}
              {(!cca.isGeneralUser || isWorking) && (
                <span className="ft-status-online-dot" style={{ bottom: '4px', right: '4px' }}></span>
              )}
            </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>{cca.nickname || cca.name}</h2>
          <div style={{ fontSize: 14, color: 'var(--ft-text-tertiary)', marginBottom: 16 }}>
            @{cca.nickname || 'user'}
          </div>

          <div className="ft-profile-stats-bar">
            {!cca.isGeneralUser ? (
              <>
                <div className="ft-profile-stat">
                  <div className="ft-profile-stat-val">{gallery.length}</div>
                  <div className="ft-profile-stat-lab">Posts</div>
                </div>
                <div className="ft-profile-stat">
                  <div className="ft-profile-stat-val">{followersCount.toLocaleString()}</div>
                  <div className="ft-profile-stat-lab">Followers</div>
                </div>
                <div className="ft-profile-stat">
                  <div className="ft-profile-stat-val">{todayViews.toLocaleString()}</div>
                  <div className="ft-profile-stat-lab">Views</div>
                </div>
              </>
            ) : (
              <div className="ft-profile-stat" style={{ width: '100%' }}>
                <div className="ft-profile-stat-val">{bookmarks.length}</div>
                <div className="ft-profile-stat-lab">즐겨찾기한 콘텐츠</div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
            {!isOwner && !cca.isGeneralUser && (
              <button
                onClick={() => navigate(`/secret?ccaId=${cca.id}`)}
                style={{
                  padding: '12px 24px',
                  borderRadius: 'var(--ft-radius-md)',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: 14,
                  background: 'var(--ft-gradient)',
                  color: '#fff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 15px rgba(232, 82, 122, 0.3)'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>lock</span>
                비밀대화
              </button>
            )}

            {isOwner && !cca.isGeneralUser && (
              <button
                onClick={handleAttendanceToggle}
                disabled={attendanceLoading}
                style={{
                  padding: '12px 24px',
                  borderRadius: 'var(--ft-radius-md)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 14,
                  background: isWorking ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                  color: isWorking ? '#ef4444' : '#22c55e',
                  border: `1px solid ${isWorking ? '#ef4444' : '#22c55e'}`
                }}
              >
                {attendanceLoading ? '처리 중...' : (isWorking ? '퇴근하기' : '출근하기')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--ft-border)', marginTop: 24, marginBottom: 16 }}>
        {!cca.isGeneralUser && (
          <button 
            onClick={() => setActiveTab('posts')}
            style={{
              flex: 1,
              padding: '12px',
              background: 'none',
              border: 'none',
              color: activeTab === 'posts' ? 'var(--ft-primary)' : 'var(--ft-text-secondary)',
              borderBottom: activeTab === 'posts' ? '2px solid var(--ft-primary)' : '2px solid transparent',
              fontWeight: 800,
              fontSize: 15,
              cursor: 'pointer'
            }}
          >
            갤러리
          </button>
        )}
        {isOwner && (
          <button 
            onClick={() => setActiveTab('bookmarks')}
            style={{
              flex: 1,
              padding: '12px',
              background: 'none',
              border: 'none',
              color: activeTab === 'bookmarks' ? 'var(--ft-primary)' : 'var(--ft-text-secondary)',
              borderBottom: activeTab === 'bookmarks' ? '2px solid var(--ft-primary)' : '2px solid transparent',
              fontWeight: 800,
              fontSize: 15,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>bookmark</span>
            즐겨찾기 보관함
          </button>
        )}
      </div>

      {/* Gallery Posts Tab */}
      {activeTab === 'posts' && !cca.isGeneralUser && (
        <div style={{ marginTop: 12 }}>
          {gallery.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--ft-text-tertiary)' }}>
              게시물이 없습니다.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {gallery.map((item) => {
                const urls = item.url ? item.url.split(',') : [];
                const displayUrl = urls[0] || '';
                const isMultiImage = item.type === 'photo' && urls.length > 1;

                return (
                  <div 
                    key={item.id} 
                    onClick={() => setLightboxMedia(item)}
                    style={{ aspectRatio: '1/1', background: '#f0f0f0', borderRadius: 8, overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
                  >
                    {item.type === 'video' ? (
                      <video src={displayUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <img src={displayUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                    
                    {/* Multi Image Badge */}
                    {isMultiImage && (
                      <div style={{
                        position: 'absolute', top: 8, right: 8,
                        backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '50%',
                        width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', zIndex: 5
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>filter_none</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Bookmarks Tab */}
      {activeTab === 'bookmarks' && isOwner && (
        <div style={{ marginTop: 12 }}>
          {bookmarks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ft-text-tertiary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.2, marginBottom: 16 }}>bookmark</span>
              <p style={{ margin: 0, fontSize: 14 }}>즐겨찾기한 포스트가 없습니다.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {bookmarks.map((item) => {
                const urls = item.url ? item.url.split(',') : [];
                const displayUrl = urls[0] || '';
                const isMultiImage = item.type === 'photo' && urls.length > 1;

                return (
                  <div 
                    key={item.id} 
                    onClick={() => setLightboxMedia(item)}
                    style={{ aspectRatio: '1/1', background: 'var(--ft-bg-tertiary)', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
                  >
                    {item.type === 'video' ? (
                      <video src={displayUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <img src={displayUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                    
                    {/* Multi Image Badge */}
                    {isMultiImage && (
                      <div style={{
                        position: 'absolute', top: 8, right: 8,
                        backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '50%',
                        width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', zIndex: 5
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>filter_none</span>
                      </div>
                    )}

                    {/* Creator name overlay on hover */}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                      padding: '8px',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 700,
                      textAlign: 'center',
                      zIndex: 4
                    }}>
                      @{item.ccaNickname}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Mobile Sticky CTA Bar */}
      {!isOwner && !cca.isGeneralUser && (
        <div className="ft-sticky-cta-mobile md:hidden">
          <button
            onClick={() => navigate(`/secret?ccaId=${cca.id}`)}
            className="ft-sticky-cta-btn primary"
          >
            <span className="material-symbols-outlined">lock</span>
            비밀대화 시작하기
          </button>
        </div>
      )}

      {/* Media Lightbox with Carousel */}
      {lightboxMedia && (
        <div 
          className="ft-story-player-overlay" 
          onClick={() => setLightboxMedia(null)}
          style={{ zIndex: 99999 }}
        >
          <button 
            className="ft-story-player-close" 
            onClick={() => setLightboxMedia(null)}
            style={{ position: 'absolute', top: 20, right: 20, zIndex: 100000, background: 'rgba(0,0,0,0.5)', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}
          >
            <span className="material-symbols-outlined" style={{ color: '#fff' }}>close</span>
          </button>
          
          <div 
            className="ft-story-player-container" 
            onClick={e => e.stopPropagation()}
            style={{ background: '#000', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', maxWidth: '600px' }}
          >
            <div style={{ width: '100%', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              {lightboxMedia.type === 'video' ? (
                <video src={lightboxMedia.url} controls autoPlay style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              ) : (() => {
                const urls = lightboxMedia.url ? lightboxMedia.url.split(',') : [];
                return (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <img 
                      src={urls[activeMediaIdx]} 
                      alt="" 
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                    />
                    
                    {/* Navigation arrows */}
                    {urls.length > 1 && (
                      <>
                        {activeMediaIdx > 0 && (
                          <button 
                            onClick={() => setActiveMediaIdx(prev => prev - 1)}
                            style={{
                              position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                              background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', borderRadius: '50%',
                              width: 40, height: 40, display: 'flex', alignItems: 'center', justify_content: 'center', cursor: 'pointer', zIndex: 10
                            }}
                          >
                            <span className="material-symbols-outlined">chevron_left</span>
                          </button>
                        )}
                        {activeMediaIdx < urls.length - 1 && (
                          <button 
                            onClick={() => setActiveMediaIdx(prev => prev + 1)}
                            style={{
                              position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                              background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', borderRadius: '50%',
                              width: 40, height: 40, display: 'flex', alignItems: 'center', justify_content: 'center', cursor: 'pointer', zIndex: 10
                            }}
                          >
                            <span className="material-symbols-outlined">chevron_right</span>
                          </button>
                        )}
                        {/* Dots */}
                        <div style={{
                          position: 'absolute', bottom: 20, display: 'flex', gap: 6,
                          background: 'rgba(0,0,0,0.4)', padding: '4px 8px', borderRadius: 10, zIndex: 10
                        }}>
                          {urls.map((_, idx) => (
                            <div 
                              key={idx} 
                              style={{
                                width: 6, height: 6, borderRadius: '50%',
                                background: idx === activeMediaIdx ? 'var(--ft-primary)' : 'rgba(255,255,255,0.4)'
                              }}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
            
            {lightboxMedia.caption && (
              <div style={{ width: '100%', padding: '16px 20px', background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '13px', lineHeight: 1.4, textAlign: 'center', boxSizing: 'border-box' }}>
                {lightboxMedia.caption}
              </div>
            )}
          </div>
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
  );
};

export default FeedProfile;
