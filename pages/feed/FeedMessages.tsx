import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';

interface Message {
  id: string;
  sender_id: string;
  sender_type: string;
  sender_name: string;
  receiver_id: string;
  receiver_type: string;
  receiver_name: string;
  content: string;
  is_read: number;
  created_at: string;
}

interface Conversation {
  participantId: string;
  participantName: string;
  lastMessage: Message;
  unreadCount: number;
}

const FeedMessages: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<{ id: string, name: string } | null>(null);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'subscribed' | 'following'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [subscribedIds, setSubscribedIds] = useState<string[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const loadConversations = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [received, sent, subs, follows] = await Promise.all([
        apiService.getMessages({ receiverId: user.id, receiverType: 'user', limit: 100 }),
        apiService.getMessages({ senderId: user.id, senderType: 'user', limit: 100 }),
        apiService.getSubscriptions(user.id),
        apiService.getUserFollowing(user.id)
      ]);

      setSubscribedIds(subs);
      setFollowingIds(follows);
      
      const allMessages = [...received, ...sent].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const groups: Record<string, Conversation> = {};
      allMessages.forEach(msg => {
        const isMeSender = msg.sender_id === user.id;
        const otherId = isMeSender ? msg.receiver_id : msg.sender_id;
        const otherName = isMeSender ? msg.receiver_name : msg.sender_name;

        if (!groups[otherId]) {
          groups[otherId] = {
            participantId: otherId,
            participantName: otherName || '알 수 없는 사용자',
            lastMessage: msg,
            unreadCount: (!isMeSender && msg.is_read === 0) ? 1 : 0
          };
        } else if (!isMeSender && msg.is_read === 0) {
          groups[otherId].unreadCount++;
        }
      });

      const convs = Object.values(groups);
      setConversations(convs);
      setFilteredConversations(convs);
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredConversations(conversations);
    } else if (activeTab === 'subscribed') {
      setFilteredConversations(conversations.filter(c => subscribedIds.includes(c.participantId)));
    } else if (activeTab === 'following') {
      setFilteredConversations(conversations.filter(c => followingIds.includes(c.participantId)));
    }
  }, [activeTab, conversations, subscribedIds, followingIds]);

  const openChat = async (participantId: string, participantName: string) => {
    if (!user) return;
    setSelectedUser({ id: participantId, name: participantName });
    setChatLoading(true);
    try {
      const received = await apiService.getMessages({ receiverId: user.id, receiverType: 'user', senderId: participantId, senderType: 'user' });
      const sent = await apiService.getMessages({ senderId: user.id, senderType: 'user', receiverId: participantId, receiverType: 'user' });
      
      const history = [...received, ...sent].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      setChatHistory(history);

      // Mark as read
      const unread = received.filter(m => m.is_read === 0);
      for (const m of unread) {
        await apiService.markMessageRead(m.id);
      }
      loadConversations(); // Update list unread counts
    } catch (err) {
      console.error('Failed to load chat history', err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !selectedUser || !newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage('');

    try {
      const result = await apiService.sendMessage({
        sender_id: user.id,
        sender_type: 'user',
        sender_name: user.nickname || user.realName,
        receiver_id: selectedUser.id,
        receiver_type: 'user',
        receiver_name: selectedUser.name,
        content: content
      });

      if (result.success) {
        // Add to local history immediately for responsiveness
        const tempMsg: Message = {
          id: result.id || crypto.randomUUID(),
          sender_id: user.id,
          sender_type: 'user',
          sender_name: user.nickname || user.realName || '',
          receiver_id: selectedUser.id,
          receiver_type: 'user',
          receiver_name: selectedUser.name,
          content: content,
          is_read: 0,
          created_at: new Date().toISOString()
        };
        setChatHistory(prev => [...prev, tempMsg]);
        loadConversations();
      }
    } catch (err) {
      alert('메시지 전송에 실패했습니다.');
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await apiService.searchMessageRecipients(query, 'user');
      setSearchResults(results.filter(r => r.id !== user?.id));
    } catch (err) {
      console.error('Search failed', err);
    }
  };

  if (!user) {
    return (
      <div className="ft-msg-empty">
        <span className="material-symbols-outlined">lock</span>
        <h3>로그인이 필요합니다</h3>
        <p>메시지 기능을 이용하려면 로그인해주세요.</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="ft-page-header" style={{ flexShrink: 0 }}>
        <div className="ft-page-title">
          <span>메시지</span>
          <div className="ft-page-title-icon" onClick={() => setSearchQuery('')}>
            <span className="material-symbols-outlined">edit_square</span>
          </div>
        </div>
        <div className="ft-tabs">
          <button className={`ft-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>전체</button>
          <button className={`ft-tab ${activeTab === 'subscribed' ? 'active' : ''}`} onClick={() => setActiveTab('subscribed')}>구독</button>
          <button className={`ft-tab ${activeTab === 'following' ? 'active' : ''}`} onClick={() => setActiveTab('following')}>팔로우</button>
        </div>
      </div>

      {/* Conversation List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 20px' }}>
        {/* Modern Search Bar */}
        <div style={{ padding: '0 16px 16px' }}>
          <div className="ft-search-modern-wrapper" style={{ height: 44, borderRadius: 12 }}>
            <span className="material-symbols-outlined ft-search-icon" style={{ fontSize: 18 }}>search</span>
            <input 
              type="text" 
              className="ft-search-input-modern"
              placeholder="대화 상대 검색" 
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              style={{ fontSize: 14 }}
            />
          </div>
        </div>

        {searchQuery.length >= 2 && (
          <div style={{ padding: '0 16px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ft-primary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>검색 결과</div>
            {searchResults.map(res => (
              <div 
                key={res.id} 
                className="ft-msg-item-modern" 
                onClick={() => { setSearchQuery(''); openChat(res.id, res.nickname || res.realName); }}
              >
                <div className="ft-msg-avatar-modern">
                  <img src={res.profileImage || `https://ui-avatars.com/api/?name=${res.nickname || res.realName}&background=random`} alt="" />
                </div>
                <div className="ft-msg-body-modern">
                  <div className="ft-msg-name-modern">{res.nickname || res.realName}</div>
                  <div className="ft-msg-sub-modern">새로운 대화를 시작해보세요</div>
                </div>
              </div>
            ))}
            {searchResults.length === 0 && <div style={{ padding: 20, textAlign: 'center', fontSize: 14, color: 'var(--ft-text-tertiary)' }}>일치하는 사용자가 없습니다.</div>}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div className="ft-spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="ft-msg-empty-modern">
            <div className="ft-msg-empty-icon-wrapper">
              <span className="material-symbols-outlined">forum</span>
            </div>
            <h3>대화가 없습니다</h3>
            <p>친구들과 자유롭게 대화를 나누어 보세요.</p>
            <button className="ft-primary-btn" style={{ marginTop: 20, padding: '10px 24px', borderRadius: 12 }} onClick={() => handleSearch(' ')}>
              친구 찾기
            </button>
          </div>
        ) : (
          <div className="ft-conversations-container">
            {filteredConversations.map(conv => (
              <div key={conv.participantId} className={`ft-msg-item-modern ${conv.unreadCount > 0 ? 'unread' : ''}`} onClick={() => openChat(conv.participantId, conv.participantName)}>
                <div className="ft-msg-avatar-modern">
                  <img src={`https://ui-avatars.com/api/?name=${conv.participantName}&background=random`} alt="" />
                  {conv.unreadCount > 0 && <div className="ft-unread-badge-modern" />}
                </div>
                <div className="ft-msg-body-modern">
                  <div className="ft-msg-top-modern">
                    <span className="ft-msg-name-modern">{conv.participantName}</span>
                    <span className="ft-msg-time-modern">
                      {new Date(conv.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="ft-msg-preview-modern">{conv.lastMessage.content}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Room Overlay */}
      {selectedUser && (
        <div className="ft-chat-room-modern">
          <div className="ft-chat-header-modern">
            <button className="ft-chat-back-btn" onClick={() => setSelectedUser(null)}>
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="ft-chat-user-info-modern">
              <div className="ft-chat-avatar-small">
                <img src={`https://ui-avatars.com/api/?name=${selectedUser.name}&background=random`} alt="" />
              </div>
              <div className="ft-chat-name-modern">{selectedUser.name}</div>
            </div>
            <button className="ft-chat-action-btn">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>

          <div className="ft-chat-body-modern">
            {chatLoading ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <div className="ft-spinner"></div>
              </div>
            ) : (
              <div className="ft-messages-flow">
                {chatHistory.length === 0 && (
                  <div className="ft-chat-start-hint">
                    대화의 시작입니다. 매너 있는 대화를 나누어 주세요.
                  </div>
                )}
                {chatHistory.map((msg, idx) => {
                  const isMe = msg.sender_id === user.id;
                  return (
                    <div key={msg.id || idx} className={`ft-msg-bubble-wrapper ${isMe ? 'me' : 'other'}`}>
                      {!isMe && (
                        <div className="ft-bubble-avatar">
                          <img src={`https://ui-avatars.com/api/?name=${msg.sender_name}&background=random`} alt="" />
                        </div>
                      )}
                      <div className="ft-msg-bubble-content">
                        <div className="ft-bubble-text">{msg.content}</div>
                        <div className="ft-bubble-time">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          <div className="ft-chat-footer-modern">
            <div className="ft-chat-input-wrapper-modern">
              <button className="ft-chat-util-btn">
                <span className="material-symbols-outlined">add_circle</span>
              </button>
              <form className="ft-chat-form-modern" onSubmit={handleSendMessage}>
                <input 
                  type="text" 
                  className="ft-chat-input-modern" 
                  placeholder="메시지를 입력하세요..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />
                <button 
                  type="submit"
                  className={`ft-chat-send-btn ${newMessage.trim() ? 'active' : ''}`}
                  disabled={!newMessage.trim()}
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedMessages;
