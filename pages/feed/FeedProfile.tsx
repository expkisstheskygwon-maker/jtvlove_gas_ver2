import React, { useState, useEffect, useCallback } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [heartCount, setHeartCount] = useState(0);
  const [isHearted, setIsHearted] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [todayViews, setTodayViews] = useState(0);
  const [isWorking, setIsWorking] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  useEffect(() => {
    const currentUsername = forcedUsername || window.location.hash.replace('#/@', '');
    setUsername(currentUsername);
  }, [forcedUsername]);

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

  const isOwner = user?.ccaId === cca?.id;

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
          <img
            src={cca.image}
            alt={cca.name}
            style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', marginBottom: 16 }}
          />
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>{cca.nickname || cca.name}</h2>
          <div style={{ fontSize: 14, color: 'var(--ft-text-tertiary)', marginBottom: 16 }}>
            @{cca.nickname || 'user'}
          </div>

          <div className="ft-profile-stats-bar">
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
          </div>

          {isOwner && (
            <button
              onClick={handleAttendanceToggle}
              disabled={attendanceLoading}
              style={{
                marginTop: 20,
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

      <div style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>갤러리</h3>
        {gallery.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--ft-text-tertiary)' }}>
            게시물이 없습니다.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {gallery.map((item) => (
              <div key={item.id} style={{ aspectRatio: '1/1', background: '#f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
                {item.type === 'video' ? (
                  <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <img src={item.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedProfile;
