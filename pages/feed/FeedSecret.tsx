import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';

type Role = 'user' | 'cca';

interface SecretConversation {
  conversationId: string;
  fanId: string;
  fanName?: string;
  fanProfileImage?: string;
  ccaId: string;
  ccaName?: string;
  ccaImage?: string;
  lastMessage?: string;
  lastAt?: string;
  unreadCount?: number;
  isBlocked?: number;
  isSubscribed?: number;
  paidMessageCost?: number;
}

interface SecretMessage {
  id: string;
  conversation_id: string;
  sender_role: Role;
  sender_id: string;
  content: string;
  is_paid: number;
  price_points: number;
  created_at: string;
  read_at?: string | null;
}

const FeedSecret: React.FC = () => {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [role, setRole] = useState<Role>('user');
  const [conversations, setConversations] = useState<SecretConversation[]>([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<SecretConversation | null>(null);
  const [messages, setMessages] = useState<SecretMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const [newMessage, setNewMessage] = useState('');
  const [isPaid, setIsPaid] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const ccaIdFromQuery = searchParams.get('ccaId');

  const displayName = (c: SecretConversation) => {
    if (role === 'cca') return c.fanName || '알 수 없는 팬';
    return c.ccaName || '알 수 없는 CCA';
  };

  const displayImage = (c: SecretConversation) => {
    const src = role === 'cca' ? c.fanProfileImage : c.ccaImage;
    if (src) return src;
    const name = encodeURIComponent(displayName(c));
    return `https://ui-avatars.com/api/?name=${name}&background=random`;
  };

  const loadConversations = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiService.getSecretConversations(user.id);
      setRole(data.role);
      setConversations(data.conversations || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openChat = async (conv: SecretConversation) => {
    if (!user) return;
    setSelected(conv);
    setChatLoading(true);
    try {
      const res = await apiService.getSecretMessages(conv.conversationId, role, true);
      setMessages(res.messages || []);
      // 읽음 처리 후 뱃지 갱신
      await loadConversations();
    } catch (e) {
      console.error(e);
    } finally {
      setChatLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    if (!user) return;
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // 쿼리로 CCA 지정 시: 대화방 생성/진입 (팬 전용 UX)
  useEffect(() => {
    const run = async () => {
      if (!user) return;
      if (!ccaIdFromQuery) return;

      try {
        const convRes = await apiService.createSecretConversation(user.id, ccaIdFromQuery);
        if (!convRes?.conversationId) return;

        await loadConversations();
        const conv = conversations.find(c => c.conversationId === convRes.conversationId) ||
          { conversationId: convRes.conversationId, fanId: user.id, ccaId: ccaIdFromQuery };
        await openChat(conv);
      } finally {
        // URL 정리 (같은 CCA를 다시 눌렀을 때도 동작하도록)
        navigate('/secret', { replace: true });
      }
    };
    run();
    // conversations는 일부러 deps에서 제외(무한루프 방지)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ccaIdFromQuery, user?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const canSend = useMemo(() => {
    if (!user || !selected) return false;
    if (selected.isBlocked) return false;
    if (role === 'user' && selected.isSubscribed === 0) return false;
    return true;
  }, [role, selected, user]);

  const paidCost = useMemo(() => {
    const cost = Number(selected?.paidMessageCost || 0);
    return cost > 0 ? cost : 50;
  }, [selected?.paidMessageCost]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !selected) return;
    if (!newMessage.trim()) return;

    const text = newMessage.trim();
    setNewMessage('');

    try {
      const res = await apiService.sendSecretMessage({
        conversationId: selected.conversationId,
        fanId: selected.fanId,
        ccaId: selected.ccaId,
        senderRole: role,
        senderId: user.id,
        content: text,
        isPaid: role === 'user' ? isPaid : false,
        pricePoints: role === 'user' && isPaid ? paidCost : 0,
      });

      if (!res?.success) {
        alert(res?.error || '메시지 전송에 실패했습니다.');
        return;
      }

      // 포인트 잔액 UI 갱신 (유료 메시지일 때만)
      if (typeof res.remainingPoints === 'number') {
        updateUser({ points: res.remainingPoints });
      }

      // 즉시 UI 반영
      const temp: SecretMessage = {
        id: res.messageId,
        conversation_id: res.conversationId,
        sender_role: role,
        sender_id: user.id,
        content: text,
        is_paid: role === 'user' && isPaid ? 1 : 0,
        price_points: role === 'user' && isPaid ? paidCost : 0,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, temp]);
      await loadConversations();
    } catch (err: any) {
      const code = err?.code || err?.message;
      alert(code || '메시지 전송 중 오류가 발생했습니다.');
    }
  };

  const handleBlockToggle = async () => {
    if (!user || !selected) return;
    if (role !== 'cca') return;
    const next = selected.isBlocked ? 'unblock' : 'block';
    await apiService.blockSecretFan(selected.ccaId, selected.fanId, next);
    await loadConversations();
    setSelected(prev => prev ? { ...prev, isBlocked: prev.isBlocked ? 0 : 1 } : prev);
  };

  if (!user) {
    return (
      <div className="ft-msg-empty">
        <span className="material-symbols-outlined">lock</span>
        <h3>로그인이 필요합니다</h3>
        <p>비밀 대화 기능을 이용하려면 로그인해주세요.</p>
      </div>
    );
  }

  return (
    <div className="ft-secret-container">
      <div className="ft-secret-header">
        <div className="ft-secret-header-top">
          <h2 className="ft-secret-title">🔒 비밀대화</h2>
          {role === 'user' && (
            <div className="ft-secret-points">
              내 포인트: <span>{user.points ?? 0}P</span>
            </div>
          )}
        </div>
      </div>

      {/* Conversation List */}
      <div className="ft-secret-body">
        {loading ? (
          <div className="ft-secret-loading">
            <div className="ft-spinner"></div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="ft-secret-empty">
            <div className="ft-secret-empty-icon">
              <span className="material-symbols-outlined">lock</span>
            </div>
            <h3>대화가 없습니다</h3>
            <p>탐색 탭에서 CCA의 “비밀스러운 대화”로 들어와 대화를 시작해보세요.</p>
            <button className="ft-secret-action-btn-primary" onClick={() => navigate('/explore')}>
              탐색으로 이동
            </button>
          </div>
        ) : (
          <div className="ft-secret-conv-list">
            {conversations.map(conv => (
              <div
                key={conv.conversationId}
                className={`ft-secret-conv-item ${(conv.unreadCount || 0) > 0 ? 'unread' : ''} ${selected?.conversationId === conv.conversationId ? 'active' : ''}`}
                onClick={() => openChat(conv)}
              >
                <div className="ft-secret-conv-avatar">
                  <img src={displayImage(conv)} alt="" />
                  {(conv.unreadCount || 0) > 0 && <div className="ft-secret-unread-badge" />}
                </div>
                <div className="ft-secret-conv-info">
                  <div className="ft-secret-conv-top">
                    <span className="ft-secret-conv-name">
                      {displayName(conv)}
                      {role === 'user' && conv.isSubscribed === 0 && (
                        <span className="ft-secret-tag-warning">구독필요</span>
                      )}
                      {!!conv.isBlocked && (
                        <span className="ft-secret-tag-warning">차단됨</span>
                      )}
                    </span>
                    <span className="ft-secret-conv-time">
                      {conv.lastAt ? new Date(conv.lastAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <div className="ft-secret-conv-preview">{conv.lastMessage || '대화를 시작해보세요.'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Room Overlay */}
      {selected && (
        <div className="ft-secret-chat-overlay">
          <div className="ft-secret-chat-header">
            <button className="ft-secret-back-btn" onClick={() => setSelected(null)}>
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="ft-secret-chat-user">
              <div className="ft-secret-chat-avatar">
                <img src={displayImage(selected)} alt="" />
              </div>
              <div className="ft-secret-chat-name">{displayName(selected)}</div>
            </div>
            <div className="ft-secret-chat-actions">
              {role === 'cca' ? (
                <button className="ft-secret-icon-btn" onClick={handleBlockToggle} title="차단/해제">
                  <span className="material-symbols-outlined">{selected.isBlocked ? 'lock_open' : 'block'}</span>
                </button>
              ) : (
                <button className="ft-secret-icon-btn" onClick={() => navigate('/membership')} title="멤버십">
                  <span className="material-symbols-outlined">workspace_premium</span>
                </button>
              )}
            </div>
          </div>

          <div className="ft-secret-chat-body">
            {chatLoading ? (
              <div className="ft-secret-loading">
                <div className="ft-spinner"></div>
              </div>
            ) : (
              <div className="ft-secret-messages">
                {messages.length === 0 && (
                  <div className="ft-secret-hint">
                    대화의 시작입니다. 매너 있는 대화를 나누어 주세요.
                  </div>
                )}
                {messages.map((msg, idx) => {
                  const isMe = msg.sender_id === user.id;
                  return (
                    <div key={msg.id || idx} className={`ft-secret-bubble-row ${isMe ? 'me' : 'other'}`}>
                      {!isMe && (
                        <div className="ft-secret-bubble-avatar">
                          <img src={displayImage(selected)} alt="" />
                        </div>
                      )}
                      <div className="ft-secret-bubble-content">
                        {msg.is_paid === 1 && (
                          <div className="ft-secret-paid-label">
                            <span className="material-symbols-outlined">monetization_on</span>
                            유료 메시지 · {msg.price_points}P
                          </div>
                        )}
                        <div className="ft-secret-bubble-text">{msg.content}</div>
                        <div className="ft-secret-bubble-time">
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

          <div className="ft-secret-chat-footer">
            {role === 'user' && selected.isSubscribed === 0 && (
              <div className="ft-secret-footer-notice">
                구독자 전용 대화입니다. 멤버십에서 구독 후 이용할 수 있어요.
              </div>
            )}
            {selected.isBlocked ? (
              <div className="ft-secret-footer-notice">
                차단 상태라 메시지를 보낼 수 없습니다.
              </div>
            ) : (
              <div className="ft-secret-input-area">
                {role === 'user' && (
                  <div className="ft-secret-input-options">
                    <label className="ft-secret-checkbox-label">
                      <input type="checkbox" checked={isPaid} onChange={e => setIsPaid(e.target.checked)} />
                      <span className="ft-secret-checkbox-custom"></span>
                      유료로 보내기 ({paidCost}P)
                    </label>
                  </div>
                )}
                <div className="ft-secret-input-wrapper">
                  <form className="ft-secret-form" onSubmit={handleSend}>
                    <input
                      type="text"
                      className="ft-secret-input"
                      placeholder="메시지를 입력하세요..."
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      disabled={!canSend}
                    />
                    <button
                      type="submit"
                      className={`ft-secret-send-btn ${newMessage.trim() ? 'active' : ''}`}
                      disabled={!canSend || !newMessage.trim()}
                    >
                      <span className="material-symbols-outlined">send</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedSecret;

