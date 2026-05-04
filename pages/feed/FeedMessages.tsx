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
        apiService.checkCCAFollow(user.id, '')
      ]);

      setSubscribedIds(subs);
      setFollowingIds(follows.followedIds || []);
      
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
          id: result.id,
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
    <div style={{ position: 'relative', height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="ft-page-header">
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
      <div style={{ overflowY: 'auto', height: 'calc(100% - 100px)' }}>
        {/* Search Input */}
        <div className="ft-search-bar" style={{ margin: '0 16px 16px' }}>
          <span className="material-symbols-outlined">search</span>
          <input 
            type="text" 
            placeholder="대화 상대 검색" 
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>

        {searchQuery.length >= 2 && (
          <div style={{ padding: '0 16px 16px', borderBottom: '1px solid var(--ft-border)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ft-text-tertiary)', marginBottom: 8 }}>검색 결과</div>
            {searchResults.map(res => (
              <div 
                key={res.id} 
                className="ft-msg-item" 
                style={{ padding: '10px 0', border: 'none' }}
                onClick={() => { setSearchQuery(''); openChat(res.id, res.nickname || res.realName); }}
              >
                <div className="ft-sidebar-avatar-placeholder" style={{ width: 40, height: 40 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>person</span>
                </div>
                <div className="ft-msg-info">
                  <div className="ft-msg-name">{res.nickname || res.realName}</div>
                </div>
              </div>
            ))}
            {searchResults.length === 0 && <div style={{ fontSize: 13, color: 'var(--ft-text-tertiary)' }}>검색 결과가 없습니다.</div>}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--ft-text-tertiary)' }}>로딩 중...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="ft-msg-empty">
            <span className="material-symbols-outlined">chat_bubble</span>
            <p>아직 대화 내역이 없습니다.<br/>새로운 대화를 시작해보세요!</p>
          </div>
        ) : (
          filteredConversations.map(conv => (
            <div key={conv.participantId} className="ft-msg-item" onClick={() => openChat(conv.participantId, conv.participantName)}>
              <div style={{ position: 'relative' }}>
                <div className="ft-sidebar-avatar-placeholder" style={{ width: 48, height: 48 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 24 }}>person</span>
                </div>
                {conv.unreadCount > 0 && (
                  <div className="ft-msg-unread-dot">{conv.unreadCount}</div>
                )}
              </div>
              <div className="ft-msg-info">
                <div className="ft-msg-name">
                  {conv.participantName}
                  <span style={{ color: 'var(--ft-accent)', fontSize: 12 }}>✨</span>
                </div>
                <div className="ft-msg-preview">{conv.lastMessage.content}</div>
              </div>
              <div className="ft-msg-time">
                {new Date(conv.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Chat Room Overlay */}
      {selectedUser && (
        <div className="ft-chat-room">
          <div className="ft-chat-header">
            <button 
              onClick={() => setSelectedUser(null)}
              style={{ background: 'none', border: 'none', color: 'var(--ft-text)', cursor: 'pointer' }}
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="ft-sidebar-avatar-placeholder" style={{ width: 36, height: 36 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person</span>
            </div>
            <div style={{ fontWeight: 700, flex: 1 }}>{selectedUser.name}</div>
            <span className="material-symbols-outlined" style={{ color: 'var(--ft-text-tertiary)', cursor: 'pointer' }}>info</span>
          </div>

          <div className="ft-chat-body">
            {chatLoading ? (
              <div style={{ textAlign: 'center', color: 'var(--ft-text-tertiary)', padding: 20 }}>대화 내용을 불러오는 중...</div>
            ) : (
              chatHistory.map((msg, idx) => (
                <div key={msg.id || idx} className={`ft-bubble ${msg.sender_id === user.id ? 'me' : 'other'}`}>
                  {msg.content}
                  <div style={{ 
                    fontSize: 10, opacity: 0.7, marginTop: 4, 
                    textAlign: msg.sender_id === user.id ? 'right' : 'left' 
                  }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          <form className="ft-chat-input-area" onSubmit={handleSendMessage}>
            <span className="material-symbols-outlined" style={{ color: 'var(--ft-text-tertiary)', cursor: 'pointer' }}>image</span>
            <input 
              type="text" 
              className="ft-input" 
              style={{ marginBottom: 0, borderRadius: 24, padding: '10px 20px' }}
              placeholder="메시지 보내기..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
            />
            <button 
              type="submit"
              disabled={!newMessage.trim()}
              style={{ 
                background: 'none', border: 'none', 
                color: newMessage.trim() ? 'var(--ft-primary)' : 'var(--ft-text-muted)',
                cursor: newMessage.trim() ? 'pointer' : 'default'
              }}
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default FeedMessages;
