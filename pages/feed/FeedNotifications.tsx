import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';

// Use 'any' for notification items since the API may return snake_case fields
// and types beyond what the strict UserNotification interface defines.
const FeedNotifications: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
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

  const isUnread = (notif: any): boolean => {
    return notif.is_read === 0 || notif.is_read === false || notif.isRead === false;
  };

  const handleNotifClick = async (notif: any) => {
    if (isUnread(notif)) {
      await apiService.markNotificationRead(notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: 1, isRead: true } : n));
    }

    // Logic for redirection based on type or content
    if (notif.type === 'private') {
      navigate('/secret');
    } else if (notif.type === 'follow') {
      navigate('/feed'); 
    } else if (notif.type === 'subscription') {
      navigate('/membership');
    } else {
      navigate('/feed');
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    const success = await apiService.markAllNotificationsRead(user.id);
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1, isRead: true })));
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
                className={`ft-notification-page-item ${isUnread(n) ? 'unread' : ''}`}
                onClick={() => handleNotifClick(n)}
              >
                <div className="ft-notif-page-icon">
                  <span className="material-symbols-outlined">
                    {n.type === 'private' ? 'lock' : n.type === 'follow' ? 'person_add' : n.type === 'subscription' ? 'stars' : 'notifications'}
                  </span>
                </div>
                <div className="ft-notif-page-info">
                  <div className="ft-notif-page-title">{n.title}</div>
                  <div className="ft-notif-page-content">{n.content}</div>
                  <div className="ft-notif-page-time">{new Date(n.created_at || n.createdAt).toLocaleString()}</div>
                </div>
                {isUnread(n) && <div className="ft-unread-dot" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default FeedNotifications;
