import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';

const CCAPortalSecret: React.FC = () => {
  const { user } = useAuth();
  const ccaId = (user as any)?.ccaId || '';

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [earnings, setEarnings] = useState({ total: 0, monthly: 0 });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ccaId) {
      fetchConversations();
      fetchEarnings();
    }
  }, [ccaId]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const data = await apiService.getSecretConversations('cca', ccaId);
      setConversations(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchEarnings = async () => {
    // This would ideally be a new API endpoint, but for now we can estimate or use a placeholder
    // In a real app, we'd call apiService.getCCAEarnings(ccaId)
    setEarnings({ total: 1250, monthly: 450 }); // Placeholder
  };

  const openChat = async (conv: any) => {
    setSelected(conv);
    setChatLoading(true);
    try {
      const data = await apiService.getSecretMessages(conv.conversationId, 'cca', true);
      setMessages(data || []);
      // Mark as read in local list
      setConversations(prev => prev.map(c => 
        c.conversationId === conv.conversationId ? { ...c, unreadCount: 0 } : c
      ));
    } catch (e) {
      console.error(e);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selected || sending) return;

    setSending(true);
    try {
      const result = await apiService.sendSecretMessage({
        conversationId: selected.conversationId,
        fanId: selected.fanId,
        ccaId: selected.ccaId,
        senderRole: 'cca',
        senderId: ccaId,
        content: newMessage.trim()
      });

      if (result.success) {
        const newMsg = {
          id: result.messageId,
          sender_id: ccaId,
          sender_role: 'cca',
          content: newMessage.trim(),
          created_at: new Date().toISOString(),
          is_paid: 0,
          price_points: 0
        };
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
        
        // Update last message in list
        setConversations(prev => prev.map(c => 
          c.conversationId === selected.conversationId 
            ? { ...c, lastMessage: newMessage.trim(), lastAt: new Date().toISOString() } 
            : c
        ));
      }
    } catch (e) {
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!selected) return;
    const newStatus = selected.isBlocked ? 'active' : 'blocked';
    if (!confirm(`Are you sure you want to ${selected.isBlocked ? 'unblock' : 'block'} this fan?`)) return;

    try {
      const res = await apiService.toggleSecretBlock(selected.ccaId, selected.fanId, newStatus);
      if (res.success) {
        setSelected({ ...selected, isBlocked: selected.isBlocked ? 0 : 1 });
        setConversations(prev => prev.map(c => 
          c.conversationId === selected.conversationId ? { ...c, isBlocked: selected.isBlocked ? 0 : 1 } : c
        ));
      }
    } catch (e) {
      alert('Failed to update block status');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in h-[calc(100vh-160px)] flex flex-col">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 flex-shrink-0">
        <div>
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">lock</span>
            Secret Chat
          </h2>
          <p className="text-sm text-gray-400 font-bold mt-1">Manage your private conversations and earnings</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white dark:bg-zinc-900 px-6 py-4 rounded-2xl border border-primary/10 shadow-sm flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monthly Earnings</span>
            <span className="text-xl font-black text-primary">{earnings.monthly.toLocaleString()}P</span>
          </div>
          <div className="bg-white dark:bg-zinc-900 px-6 py-4 rounded-2xl border border-primary/10 shadow-sm flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Earnings</span>
            <span className="text-xl font-black text-primary">{earnings.total.toLocaleString()}P</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Conversation List */}
        <div className="w-full lg:w-80 flex flex-col gap-4 min-h-0">
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-primary/10 shadow-sm flex flex-col min-h-0">
            <div className="p-6 border-b border-primary/5">
              <h3 className="font-black text-sm uppercase tracking-widest">Conversations</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loading ? (
                <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div></div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs font-bold">No conversations yet.</div>
              ) : (
                conversations.map(conv => (
                  <button
                    key={conv.conversationId}
                    onClick={() => openChat(conv)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${selected?.conversationId === conv.conversationId ? 'bg-primary/10 border border-primary/20' : 'hover:bg-primary/5 border border-transparent'}`}
                  >
                    <div className="relative flex-shrink-0">
                      <img src={conv.fanImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100'} alt="" className="size-12 rounded-xl object-cover border border-primary/10" />
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 size-5 bg-primary text-[#1b180d] text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-width-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="font-black text-sm truncate">{conv.fanNickname || 'Anonymous Fan'}</span>
                        <span className="text-[10px] text-gray-400 font-bold">
                          {conv.lastAt ? new Date(conv.lastAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate font-medium">{conv.lastMessage || 'Start a conversation'}</p>
                      {conv.isBlocked === 1 && <span className="text-[9px] font-black text-red-400 uppercase">Blocked</span>}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Chat Window */}
        <div className="hidden lg:flex flex-1 flex-col bg-white dark:bg-zinc-900 rounded-[2rem] border border-primary/10 shadow-sm min-h-0 overflow-hidden">
          {selected ? (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-primary/5 flex items-center justify-between bg-primary/5">
                <div className="flex items-center gap-4">
                  <img src={selected.fanImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100'} alt="" className="size-10 rounded-xl object-cover border border-primary/20" />
                  <div>
                    <h3 className="font-black text-base">{selected.fanNickname || 'Anonymous Fan'}</h3>
                    <p className="text-[10px] text-primary font-black uppercase tracking-widest">Active Conversation</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleBlockToggle}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selected.isBlocked ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
                  >
                    {selected.isBlocked ? 'Unblock Fan' : 'Block Fan'}
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 dark:bg-zinc-950/30">
                {chatLoading ? (
                  <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 font-bold text-sm">No messages yet. Say hello!</div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.sender_role === 'cca';
                    return (
                      <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          {msg.is_paid === 1 && (
                            <span className="text-[9px] font-black text-primary uppercase tracking-widest mb-1 flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">monetization_on</span>
                              Paid Message (+{msg.price_points}P)
                            </span>
                          )}
                          <div className={`px-5 py-3 rounded-2xl text-sm font-medium shadow-sm ${isMe ? 'bg-primary text-[#1b180d] rounded-tr-none' : 'bg-white dark:bg-zinc-800 border border-primary/5 rounded-tl-none'}`}>
                            {msg.content}
                          </div>
                          <span className="text-[9px] text-gray-400 font-bold mt-1 px-1">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 border-t border-primary/5">
                {selected.isBlocked ? (
                  <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-2xl text-center text-red-500 text-xs font-black uppercase tracking-widest">
                    This fan is blocked. Unblock to send messages.
                  </div>
                ) : (
                  <form onSubmit={handleSend} className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 bg-gray-100 dark:bg-zinc-800 border border-transparent focus:border-primary/30 rounded-2xl px-6 py-4 text-sm font-bold outline-none transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="size-14 bg-primary text-[#1b180d] rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-2xl">send</span>
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
              <div className="size-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary mb-6">
                <span className="material-symbols-outlined text-4xl">chat_bubble</span>
              </div>
              <h3 className="text-xl font-black mb-2">Select a Conversation</h3>
              <p className="text-sm text-gray-400 font-bold max-w-xs">Choose a fan from the list to start chatting and managing your secret messages.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CCAPortalSecret;
