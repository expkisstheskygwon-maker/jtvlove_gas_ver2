import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const MOCK_MESSAGES = [
  { id: '1', name: '하나', handle: 'relelew', preview: '대답 안하네', time: '13분 전', unread: 0, avatar: '' },
  { id: '2', name: '이브', handle: 'eve_luv', preview: '기다렸자나야🧡🥰', time: '17분 전', unread: 1, avatar: '' },
];

const FeedMessages: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'subscribed' | 'following'>('all');

  return (
    <>
      <div className="ft-page-header">
        <div className="ft-page-title">
          <span>메시지</span>
          <div className="ft-page-title-icon">
            <span className="material-symbols-outlined">edit_square</span>
          </div>
        </div>
        <div className="ft-tabs">
          <button className={`ft-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>전체</button>
          <button className={`ft-tab ${activeTab === 'subscribed' ? 'active' : ''}`} onClick={() => setActiveTab('subscribed')}>구독</button>
          <button className={`ft-tab ${activeTab === 'following' ? 'active' : ''}`} onClick={() => setActiveTab('following')}>팔로우</button>
        </div>
      </div>

      {/* Search */}
      <div className="ft-search-bar">
        <span className="material-symbols-outlined">search</span>
        <input type="text" placeholder="대화 상대 검색" />
      </div>

      {!user ? (
        <div className="ft-empty">
          <span className="material-symbols-outlined">lock</span>
          <p>메시지를 보려면 로그인해주세요.</p>
        </div>
      ) : (
        <div>
          {MOCK_MESSAGES.map(msg => (
            <div key={msg.id} className="ft-msg-item">
              <div style={{ position: 'relative' }}>
                <div className="ft-sidebar-avatar-placeholder" style={{ width: 48, height: 48 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 24 }}>person</span>
                </div>
                {msg.unread > 0 && (
                  <div className="ft-msg-unread-dot">{msg.unread}</div>
                )}
              </div>
              <div className="ft-msg-info">
                <div className="ft-msg-name">
                  {msg.name}
                  <span style={{ color: 'var(--ft-accent)', fontSize: 12 }}>✨</span>
                </div>
                <div className="ft-msg-preview">{msg.preview}</div>
              </div>
              <div className="ft-msg-time">{msg.time}</div>
            </div>
          ))}
          {MOCK_MESSAGES.length === 0 && (
            <div className="ft-empty">
              <span className="material-symbols-outlined">chat</span>
              <p>아직 메시지가 없습니다.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default FeedMessages;
