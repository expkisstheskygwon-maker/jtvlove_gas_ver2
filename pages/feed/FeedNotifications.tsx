import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import { UserNotification } from '../../types';

const FeedNotifications: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const data = await apiService.getNotifications(user.id);
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleNotifClick = async (notif: UserNotification) => {
    if (!notif.is_read) {
      await apiService.markNotificationRead(notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: 1 } : n));
    }

    // Logic for redirection based on type or content
    if (notif.type === 'private') {
      navigate('/messages');
    } else if (notif.type === 'follow') {
      // Assuming follow notification might contain the follower's nickname or ID
      // If we don't have it, we might just go to home or search
      navigate('/feed'); 
    } else if (notif.type === 'subscription') {
      navigate('/membership');
    } else {
      // Default fallback
      navigate('/feed');
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    const success = await apiService.markAllNotificationsRead(user.id);
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>로딩 중...</div>;
  }

  return (
    <>
      <div className="ft-page-header">
        <div className="ft-page-title" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <span>알림</span>
          {notifications.length > 0 && (
            <button 
              onClick={handleMarkAllRead}
              style={{ background: 'none', border: 'none', color: 'var(--ft-primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              모두 읽음
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '0 0 40px' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '100px 20px', textAlign: 'center', color: 'var(--ft-text-tertiary)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 64, opacity: 0.2, marginBottom: 16, display: 'block' }}>notifications_off</span>
            <div style={{ fontSize: 16, fontWeight: 700 }}>알림이 없습니다.</div>
            <p style={{ fontSize: 14, marginTop: 8 }}>새로운 소식이 생기면 이곳에 표시됩니다.</p>
          </div>
        ) : (
          <div className="ft-notification-list">
            {notifications.map(n => (
              <div 
                key={n.id} 
                className={`ft-notification-page-item ${!n.is_read ? 'unread' : ''}`}
                onClick={() => handleNotifClick(n)}
              >
                <div className="ft-notif-page-icon">
                  <span className="material-symbols-outlined">
                    {n.type === 'private' ? 'mail' : n.type === 'follow' ? 'person_add' : n.type === 'subscription' ? 'stars' : 'notifications'}
                  </span>
                </div>
                <div className="ft-notif-page-info">
                  <div className="ft-notif-page-title">{n.title}</div>
                  <div className="ft-notif-page-content">{n.content}</div>
                  <div className="ft-notif-page-time">{new Date(n.created_at).toLocaleString()}</div>
                </div>
                {!n.is_read && <div className="ft-unread-dot" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default FeedNotifications;
