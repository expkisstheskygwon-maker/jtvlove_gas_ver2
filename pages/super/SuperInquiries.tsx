import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';

const SuperInquiries: React.FC = () => {
    const [inquiries, setInquiries] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedInq, setSelectedInq] = useState<any | null>(null);
    const [answer, setAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchInquiries();
    }, []);

    const fetchInquiries = async () => {
        setIsLoading(true);
        try {
            // we need an endpoint to get all inquiries for super admin
            const response = await fetch('/api/user-inquiries?userId=all'); // I'll update the API to handle 'all'
            if (response.ok) {
                const data = await response.json();
                setInquiries(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswer = async () => {
        if (!selectedInq || !answer.trim()) return;
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/user-inquiries', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedInq.id,
                    answer,
                    status: 'answered'
                })
            });
            if (response.ok) {
                alert('답변이 전송되었습니다.');
                setAnswer('');
                setSelectedInq(null);
                fetchInquiries();
            }
        } catch (e) {
            alert('답변 전송 실패');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pl-1">
            <div className="flex items-center justify-between border-b border-white/10 pb-6">
                <div>
                    <h2 className="text-3xl font-black text-orange-500 tracking-tighter flex items-center gap-3">
                        <span className="material-symbols-outlined text-4xl">contact_support</span>
                        SYSTEM INQUIRIES
                    </h2>
                    <p className="text-[10px] text-gray-500 font-bold mt-2 uppercase tracking-[0.3em]">User & Venue 1:1 Inquiries</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : inquiries.length === 0 ? (
                <div className="py-20 text-center bg-black/40 border border-white/5 rounded-2xl">
                    <p className="text-gray-500 font-black text-xs tracking-widest uppercase">No Inquiries Found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-5 space-y-3 pr-2 overflow-y-auto max-h-[600px] custom-scrollbar">
                        {inquiries.map(inq => (
                            <div
                                key={inq.id}
                                onClick={() => { setSelectedInq(inq); setAnswer(inq.answer || ''); }}
                                className={`p-5 rounded-xl border cursor-pointer transition-all ${selectedInq?.id === inq.id ? 'bg-orange-900/10 border-orange-500/50' : 'bg-zinc-900/50 border-white/5 hover:border-white/20'}`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${inq.status === 'answered' ? 'bg-green-500/20 text-green-500' : 'bg-orange-600/20 text-orange-500'}`}>
                                        {inq.status === 'answered' ? 'Answered' : 'Pending'}
                                    </span>
                                    <p className="text-[9px] text-gray-500 font-mono">{new Date(inq.created_at).toLocaleDateString()}</p>
                                </div>
                                <p className="text-xs font-black text-white mb-1">{inq.title}</p>
                                <p className="text-[10px] text-gray-500 line-clamp-1">From: {inq.user_id}</p>
                            </div>
                        ))}
                    </div>

                    <div className="lg:col-span-7">
                        {selectedInq ? (
                            <div className="bg-zinc-900/80 rounded-2xl p-8 border border-white/5 space-y-6">
                                <div className="border-b border-white/10 pb-4">
                                    <h3 className="text-lg font-black text-white">{selectedInq.title}</h3>
                                    <p className="text-[10px] text-gray-500 font-mono mt-2">
                                        FROM: {selectedInq.user_id} | DATE: {new Date(selectedInq.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <div className="bg-black/50 rounded-xl p-6 text-sm text-gray-300 leading-relaxed font-mono whitespace-pre-wrap border border-white/5">
                                    {selectedInq.content}
                                </div>

                                <div className="space-y-4 pt-4">
                                    <label className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Admin Response</label>
                                    <textarea
                                        rows={6}
                                        value={answer}
                                        onChange={(e) => setAnswer(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-orange-500 outline-none resize-none font-mono"
                                        placeholder="답변 내용을 입력하세요..."
                                    />
                                    <button
                                        onClick={handleAnswer}
                                        disabled={isSubmitting || !answer.trim()}
                                        className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'TRANSMITTING...' : 'SEND RESPONSE'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-zinc-900/30 rounded-2xl p-16 border border-white/5 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                                <span className="material-symbols-outlined text-5xl text-gray-700 mb-4">support_agent</span>
                                <p className="text-gray-500 font-black text-[10px] tracking-[0.2em] uppercase">Select inquiry to respond</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperInquiries;
