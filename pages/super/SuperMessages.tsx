import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';

const SuperMessages: React.FC = () => {
    const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMsg, setSelectedMsg] = useState<any | null>(null);

    // Compose state
    const [showCompose, setShowCompose] = useState(false);
    const [composeReceiverType, setComposeReceiverType] = useState('user');
    const [composeSearchTerm, setComposeSearchTerm] = useState('');
    const [composeSearchResults, setComposeSearchResults] = useState<any[]>([]);
    const [composeSelectedUser, setComposeSelectedUser] = useState<any | null>(null);
    const [composeSubject, setComposeSubject] = useState('');
    const [composeContent, setComposeContent] = useState('');
    const [composeSending, setComposeSending] = useState(false);

    useEffect(() => {
        fetchMessages();
    }, [tab]);

    const fetchMessages = async () => {
        setIsLoading(true);
        try {
            if (tab === 'inbox') {
                const data = await apiService.getMessages({ receiverId: 'super', receiverType: 'system' });
                setMessages(data);
            } else {
                const data = await apiService.getMessages({ senderId: 'super', senderType: 'system' });
                setMessages(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchUser = async () => {
        if (!composeSearchTerm.trim()) {
            alert('검색어를 입력하세요.');
            return;
        }
        const results = await apiService.searchMessageRecipients(composeSearchTerm, composeReceiverType);
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
            sender_id: 'super',
            sender_type: 'system',
            sender_name: '슈퍼관리자',
            receiver_id: composeSelectedUser.id,
            receiver_type: composeReceiverType,
            receiver_name: composeSelectedUser.name,
            subject: composeSubject,
            content: composeContent,
        });
        setComposeSending(false);
        if (result.success) {
            alert('시스템 알림이 전송되었습니다.');
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

    const handleDelete = async (msgId: string) => {
        if (!window.confirm('메시지를 삭제하시겠습니까?')) return;
        await apiService.deleteMessage(msgId);
        setSelectedMsg(null);
        fetchMessages();
    };

    return (
        <div className="space-y-8 animate-fade-in pl-1">
            <style>{`
            .terminal-input { background: rgba(0,0,0,0.5); border: 1px solid rgba(220,38,38,0.3); color: white; }
            .terminal-input:focus { border-color: rgba(220,38,38,0.8); outline: none; }
            `}</style>

            <div className="flex items-center justify-between border-b border-white/10 pb-6">
                <div>
                    <h2 className="text-3xl font-black text-red-500 tracking-tighter flex items-center gap-3">
                        <span className="material-symbols-outlined text-4xl animate-pulse">forward_to_inbox</span>
                        SYSTEM MESSAGES
                    </h2>
                    <p className="text-[10px] text-gray-500 font-bold mt-2 uppercase tracking-[0.3em]">Direct Communication & Notifications</p>
                </div>
                <button
                    onClick={() => setShowCompose(true)}
                    className="px-6 py-3 bg-red-600/10 text-red-500 border border-red-500/30 rounded-lg shadow-[0_0_15px_rgba(220,38,38,0.2)] font-black text-xs uppercase tracking-widest hover:bg-red-600/20 active:scale-95 transition-all flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-sm">send</span>
                    Send Notification
                </button>
            </div>

            <div className="flex gap-2 p-1 bg-white/5 rounded-lg w-fit border border-white/5">
                {(['inbox', 'sent'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => { setTab(t); setSelectedMsg(null); }}
                        className={`px-8 py-2.5 rounded text-[10px] font-black uppercase tracking-[0.2em] transition-all ${tab === t ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                    >
                        {t === 'inbox' ? 'INBOX' : 'SENT LOGS'}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(220,38,38,0.5)]"></div>
                </div>
            ) : messages.length === 0 ? (
                <div className="py-20 text-center bg-black/40 border border-white/5 rounded-2xl">
                    <span className="material-symbols-outlined text-5xl text-gray-800 mb-4 block">mail_outline</span>
                    <p className="text-gray-500 font-black text-xs tracking-widest uppercase">No Records Found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-5 space-y-3 pr-2 overflow-y-auto max-h-[600px] custom-scrollbar">
                        {messages.map(msg => (
                            <div
                                key={msg.id}
                                onClick={() => handleMarkRead(msg)}
                                className={`p-5 rounded-xl border cursor-pointer transition-all ${selectedMsg?.id === msg.id ? 'bg-red-900/20 border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.1)]' : 'bg-zinc-900/50 border-white/5 hover:border-white/20'} ${!msg.is_read && tab === 'inbox' ? 'border-l-4 border-l-red-500' : ''}`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-black text-sm text-gray-200">{tab === 'inbox' ? msg.sender_name : msg.receiver_name} <span className="text-[9px] text-gray-500">[{tab === 'inbox' ? msg.sender_type : msg.receiver_type}]</span></p>
                                    <p className="text-[9px] text-gray-500 font-bold font-mono">{new Date(msg.created_at).toLocaleDateString()}</p>
                                </div>
                                <p className="text-xs font-black text-red-400 mb-1">{msg.subject || '(No Subject)'}</p>
                                <p className="text-xs text-gray-500 line-clamp-2">{msg.content}</p>
                            </div>
                        ))}
                    </div>

                    <div className="lg:col-span-7">
                        {selectedMsg ? (
                            <div className="bg-zinc-900/80 rounded-2xl p-8 border border-white/5 space-y-6">
                                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                    <div>
                                        <h3 className="text-lg font-black text-white">{selectedMsg.subject || '(No Subject)'}</h3>
                                        <p className="text-[10px] text-gray-500 font-mono mt-2 flex gap-3">
                                            <span>SRC: {selectedMsg.sender_name} [{selectedMsg.sender_type}]</span>
                                            <span className="text-red-500">&gt;</span>
                                            <span>DST: {selectedMsg.receiver_name} [{selectedMsg.receiver_type}]</span>
                                        </p>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-mono bg-black px-3 py-1 rounded border border-white/10">
                                        {new Date(selectedMsg.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <div className="bg-black/50 rounded-xl p-6 text-sm text-gray-300 leading-relaxed font-mono whitespace-pre-wrap border border-white/5 shadow-inner">
                                    {selectedMsg.content}
                                </div>
                                {selectedMsg.replied === 1 && selectedMsg.reply_text && (
                                    <div className="mt-4 border-l-4 border-red-500 bg-red-900/10 p-4 rounded-r-xl">
                                        <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-2">My Reply</p>
                                        <p className="text-xs text-gray-300 font-mono">{selectedMsg.reply_text}</p>
                                    </div>
                                )}
                                <div className="pt-4 flex justify-end">
                                    <button onClick={() => handleDelete(selectedMsg.id)} className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 border border-red-500/20 px-4 py-2 rounded">
                                        Delete Log
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-zinc-900/30 rounded-2xl p-16 border border-white/5 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                                <span className="material-symbols-outlined text-5xl text-gray-700 mb-4">policy</span>
                                <p className="text-gray-500 font-black text-[10px] tracking-[0.2em] uppercase">Select log to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Compose Modal */}
            {showCompose && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowCompose(false)}>
                    <div className="bg-zinc-950 rounded-2xl border border-red-500/30 w-full max-w-xl p-8 shadow-[0_0_50px_rgba(220,38,38,0.15)] flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center border-b border-red-500/20 pb-4 shrink-0">
                            <h3 className="text-sm font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">public</span>
                                Broadcast Alert
                            </h3>
                            <button onClick={() => setShowCompose(false)} className="text-gray-500 hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>

                        <div className="mt-6 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Target Type</label>
                                <div className="flex gap-2">
                                    {[
                                        { val: 'user', label: 'User' },
                                        { val: 'cca', label: 'CCA' },
                                        { val: 'venue_admin', label: 'Venue' }
                                    ].map(type => (
                                        <button
                                            key={type.val}
                                            onClick={() => { setComposeReceiverType(type.val); setComposeSearchResults([]); setComposeSelectedUser(null); }}
                                            className={`flex-1 py-3 px-2 rounded font-black text-[10px] tracking-widest uppercase transition-colors border ${composeReceiverType === type.val ? 'bg-red-600/20 border-red-500 text-red-500' : 'bg-black border-white/10 text-gray-500 hover:border-white/30'}`}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {!composeSelectedUser ? (
                                <div className="space-y-3 bg-black/50 p-4 rounded border border-white/5">
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Target Filter (Nickname/Name)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={composeSearchTerm}
                                            onChange={(e) => setComposeSearchTerm(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                                            className="flex-1 terminal-input rounded px-4 py-2 text-sm font-mono"
                                            placeholder="Enter query..."
                                        />
                                        <button onClick={handleSearchUser} className="px-4 bg-gray-800 hover:bg-gray-700 text-white font-black text-[10px] uppercase tracking-widest rounded border border-white/10">
                                            SCAN
                                        </button>
                                    </div>
                                    {composeSearchResults.length > 0 && (
                                        <div className="mt-3 max-h-40 overflow-y-auto space-y-1">
                                            {composeSearchResults.map(u => (
                                                <div key={u.id} className="flex justify-between items-center p-2 bg-black border border-white/10 hover:border-red-500/50 cursor-pointer rounded" onClick={() => setComposeSelectedUser(u)}>
                                                    <span className="font-mono text-xs text-gray-300">{u.label}</span>
                                                    <span className="text-[8px] bg-red-600/20 text-red-500 px-2 py-0.5 rounded font-black">SELECT</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-between bg-red-900/10 border border-red-500/30 p-4 rounded">
                                    <div>
                                        <p className="text-[8px] font-black text-red-500 uppercase tracking-widest mb-1">Target Locked</p>
                                        <p className="font-mono text-xs text-white">{composeSelectedUser.label}</p>
                                    </div>
                                    <button onClick={() => setComposeSelectedUser(null)} className="text-[9px] font-black text-gray-400 hover:text-white border border-white/20 px-3 py-1 bg-black rounded">
                                        RELEASE
                                    </button>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Subject</label>
                                <input
                                    type="text"
                                    value={composeSubject}
                                    onChange={(e) => setComposeSubject(e.target.value)}
                                    className="w-full terminal-input rounded px-4 py-3 text-sm font-mono"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Payload (Content)</label>
                                <textarea
                                    rows={5}
                                    value={composeContent}
                                    onChange={(e) => setComposeContent(e.target.value)}
                                    className="w-full terminal-input rounded px-4 py-3 text-sm font-mono resize-none"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSendCompose}
                            disabled={composeSending || !composeContent.trim() || !composeSelectedUser}
                            className="w-full mt-6 py-4 bg-red-600 text-white rounded font-black text-xs uppercase tracking-[0.3em] disabled:bg-gray-800 disabled:text-gray-500 hover:bg-red-500 transition-colors shrink-0"
                        >
                            {composeSending ? 'TRANSMITTING...' : 'EXECUTE BROADCAST'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperMessages;
