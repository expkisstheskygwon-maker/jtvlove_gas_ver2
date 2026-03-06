// Latest Fixes: 2026-03-06 21:00 (System Badges & Inquiry Button)
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

const CCAMessages: React.FC = () => {
    const { user } = useAuth();
    const ccaId = (user as any)?.ccaId || localStorage.getItem('selectedCcaId') || '';
    const ccaName = (user as any)?.ccaName || localStorage.getItem('selectedCcaName') || '';

    const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMsg, setSelectedMsg] = useState<any | null>(null);
    const [replyText, setReplyText] = useState('');
    const [replying, setReplying] = useState(false);

    // Compose state
    const [showCompose, setShowCompose] = useState(false);
    const [composeSearchTerm, setComposeSearchTerm] = useState('');
    const [composeSearchResults, setComposeSearchResults] = useState<any[]>([]);
    const [composeSelectedUser, setComposeSelectedUser] = useState<any | null>(null);
    const [composeSubject, setComposeSubject] = useState('');
    const [composeContent, setComposeContent] = useState('');
    const [composeSending, setComposeSending] = useState(false);

    useEffect(() => {
        fetchMessages();
    }, [tab, ccaId]);

    const fetchMessages = async () => {
        if (!ccaId) return;
        setIsLoading(true);
        try {
            if (tab === 'inbox') {
                const data = await apiService.getMessages({ receiverId: ccaId, receiverType: 'cca' });
                setMessages(data);
            } else {
                const data = await apiService.getMessages({ senderId: ccaId, senderType: 'cca' });
                setMessages(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReply = async (msgId: string) => {
        if (!replyText.trim()) return;
        setReplying(true);
        await apiService.replyMessage(msgId, replyText);
        setReplyText('');
        setReplying(false);
        setSelectedMsg(null);
        fetchMessages();
    };

    const handleSearchUser = async () => {
        if (!composeSearchTerm.trim()) {
            alert('검색어를 입력하세요.');
            return;
        }
        const results = await apiService.searchMessageRecipients(composeSearchTerm, 'all');
        if (!results || results.length === 0) {
            alert('검색 결과가 없습니다.');
        }
        setComposeSearchResults(results || []);
    };

    const handleSendCompose = async () => {
        if (!composeSelectedUser || !composeContent.trim()) {
            alert('수신자와 내용을 입력해주세요.');
            return;
        }
        setComposeSending(true);
        const result = await apiService.sendMessage({
            sender_id: ccaId,
            sender_type: 'cca',
            sender_name: ccaName,
            receiver_id: composeSelectedUser.id,
            receiver_type: composeSelectedUser.type,
            receiver_name: composeSelectedUser.name,
            subject: composeSubject,
            content: composeContent,
        });
        setComposeSending(false);
        if (result.success) {
            alert('메시지가 전송되었습니다.');
            setShowCompose(false);
            setComposeContent('');
            setComposeSubject('');
            setComposeSearchTerm('');
            setComposeSearchResults([]);
            setComposeSelectedUser(null);
            fetchMessages();
        } else {
            alert('전송 실패: ' + (result.error || ''));
        }
    };

    const handleMarkRead = async (msg: any) => {
        if (!msg.is_read) {
            await apiService.markMessageRead(msg.id);
        }
        setSelectedMsg(msg);
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight">Messages</h2>
                    <p className="text-sm text-gray-400 font-bold mt-1">쪽지함 관리</p>
                </div>
                <button
                    onClick={() => setShowCompose(true)}
                    className="px-6 py-3 bg-primary text-[#1b180d] rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-lg">edit</span>
                    새 메시지
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-gray-100 dark:bg-zinc-800/50 p-1.5 rounded-2xl w-fit">
                {(['inbox', 'sent'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => { setTab(t); setSelectedMsg(null); }}
                        className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === t ? 'bg-white dark:bg-zinc-700 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        {t === 'inbox' ? '📥 수신함' : '📤 발신함'}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
            ) : messages.length === 0 ? (
                <div className="py-20 text-center">
                    <span className="material-symbols-outlined text-5xl text-gray-300 mb-4 block">inbox</span>
                    <p className="text-gray-400 font-bold">메시지가 없습니다</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Message List */}
                    <div className="lg:col-span-5 space-y-3">
                        {messages.map(msg => (
                            <div
                                key={msg.id}
                                onClick={() => handleMarkRead(msg)}
                                className={`p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-md ${selectedMsg?.id === msg.id ? 'border-primary bg-primary/5' : 'border-primary/5 bg-white dark:bg-zinc-900'} ${!msg.is_read && tab === 'inbox' ? 'border-l-4 border-l-primary' : ''}`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-black text-sm">{tab === 'inbox' ? msg.sender_name : msg.receiver_name}</p>
                                    <p className="text-[10px] text-gray-400 font-bold">{new Date(msg.created_at).toLocaleDateString('ko-KR')}</p>
                                </div>
                                <p className="text-xs font-bold text-primary mb-1">{msg.subject || '(제목 없음)'}</p>
                                <p className="text-xs text-gray-500 line-clamp-2">{msg.content}</p>
                                {msg.sender_type === 'system' ? (
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="inline-block text-[9px] font-black bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full uppercase tracking-tighter">시스템 알림</span>
                                        <span className="material-symbols-outlined text-blue-500 text-sm">notifications_active</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="material-symbols-outlined text-gray-300 text-sm">mail</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Message Detail */}
                    <div className="lg:col-span-7">
                        {selectedMsg ? (
                            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 border border-primary/10 shadow-sm space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-black">{selectedMsg.subject || '(제목 없음)'}</h3>
                                        <p className="text-xs text-gray-400 font-bold mt-1">
                                            {tab === 'inbox' ? `보낸 사람: ${selectedMsg.sender_name}` : `받는 사람: ${selectedMsg.receiver_name}`}
                                            &nbsp;·&nbsp;{new Date(selectedMsg.created_at).toLocaleString('ko-KR')}
                                        </p>
                                    </div>
                                    {selectedMsg.sender_type === 'system' && (
                                        <span className="text-[9px] font-black bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full uppercase">시스템</span>
                                    )}
                                </div>

                                <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 text-sm leading-relaxed whitespace-pre-wrap border border-gray-100 dark:border-white/5">
                                    {selectedMsg.content}
                                </div>

                                {selectedMsg.sender_type === 'system' && (
                                    <div className="flex justify-center pt-2">
                                        <Link
                                            to="/cca/inquiry"
                                            className="flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                                        >
                                            <span className="material-symbols-outlined text-lg">support_agent</span>
                                            시스템 1:1 문의 접수하기
                                        </Link>
                                    </div>
                                )}

                                {selectedMsg.replied === 1 && selectedMsg.reply_text && (
                                    <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
                                        <p className="text-[10px] font-black text-primary uppercase mb-2">💬 나의 답장</p>
                                        <p className="text-sm">{selectedMsg.reply_text}</p>
                                    </div>
                                )}

                                {/* Reply area – only for inbox and non-system messages */}
                                {tab === 'inbox' && selectedMsg.sender_type !== 'system' && !selectedMsg.replied && (
                                    <div className="space-y-3">
                                        <textarea
                                            rows={3}
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="답장을 입력하세요..."
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-primary outline-none transition-all resize-none"
                                        />
                                        <button
                                            onClick={() => handleReply(selectedMsg.id)}
                                            disabled={replying || !replyText.trim()}
                                            className="px-8 py-3 bg-primary text-[#1b180d] rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
                                        >
                                            {replying ? '전송 중...' : '답장 보내기'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-16 border border-primary/10 shadow-sm flex flex-col items-center justify-center text-center">
                                <span className="material-symbols-outlined text-5xl text-gray-200 mb-4">mark_email_read</span>
                                <p className="text-gray-400 font-bold text-sm">메시지를 선택하세요</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Compose Modal */}
            {showCompose && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-lg" onClick={() => setShowCompose(false)}>
                    <div className="bg-white dark:bg-zinc-900 rounded-[2rem] w-full max-w-lg shadow-2xl p-8 space-y-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black">새 메시지 작성</h3>
                            <button onClick={() => setShowCompose(false)} className="size-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {!composeSelectedUser ? (
                                <div className="space-y-2 border border-gray-200 dark:border-white/5 rounded-2xl p-4 bg-gray-50 dark:bg-white/5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">수신자 닉네임 검색</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={composeSearchTerm}
                                            onChange={(e) => setComposeSearchTerm(e.target.value)}
                                            placeholder="검색어를 입력하세요..."
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                                            className="flex-1 bg-white dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm font-bold border border-gray-200 dark:border-white/10 outline-none focus:border-primary"
                                        />
                                        <button
                                            onClick={handleSearchUser}
                                            className="px-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                                        >
                                            검색
                                        </button>
                                    </div>
                                    {composeSearchResults.length > 0 && (
                                        <div className="mt-3 max-h-40 overflow-y-auto space-y-2">
                                            {composeSearchResults.map(user => (
                                                <div key={user.id} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/10 rounded-xl hover:border-primary cursor-pointer transition-colors" onClick={() => setComposeSelectedUser(user)}>
                                                    <p className="font-bold text-sm tracking-tighter">{user.name}</p>
                                                    <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded">선택</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-between bg-primary/10 border border-primary/20 p-4 rounded-2xl">
                                    <div>
                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">선택된 수신자</p>
                                        <p className="font-black tracking-tighter">{composeSelectedUser.name}</p>
                                    </div>
                                    <button onClick={() => setComposeSelectedUser(null)} className="text-[10px] font-black bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-primary/20 text-gray-500 hover:text-black dark:hover:text-white transition-colors">
                                        다시 검색
                                    </button>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">제목</label>
                                <input
                                    type="text"
                                    value={composeSubject}
                                    onChange={(e) => setComposeSubject(e.target.value)}
                                    placeholder="제목 (선택사항)"
                                    className="w-full bg-gray-50 dark:bg-white/5 rounded-2xl px-5 py-3 font-bold text-sm border border-gray-200 dark:border-white/10 outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">내용 *</label>
                                <textarea
                                    rows={4}
                                    value={composeContent}
                                    onChange={(e) => setComposeContent(e.target.value)}
                                    placeholder="메시지 내용을 입력하세요..."
                                    className="w-full bg-gray-50 dark:bg-white/5 rounded-2xl px-5 py-4 font-bold text-sm border border-gray-200 dark:border-white/10 outline-none resize-none"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSendCompose}
                            disabled={composeSending || !composeContent.trim() || !composeSelectedUser}
                            className="w-full py-4 bg-primary text-[#1b180d] rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg disabled:opacity-50 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            {composeSending ? '전송 중...' : '메시지 보내기'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CCAMessages;
