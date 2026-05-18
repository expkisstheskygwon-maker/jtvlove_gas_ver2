import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';

const SuperInquiries: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'inquiries' | 'reports'>('inquiries');
    const [inquiries, setInquiries] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedInq, setSelectedInq] = useState<any | null>(null);
    const [selectedReport, setSelectedReport] = useState<any | null>(null);
    const [answer, setAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (activeTab === 'inquiries') {
            fetchInquiries();
        } else {
            fetchReports();
        }
    }, [activeTab]);

    const fetchInquiries = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/user-inquiries?userId=all');
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

    const fetchReports = async () => {
        setIsLoading(true);
        try {
            const data = await apiService.getGalleryReports();
            setReports(data || []);
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

    const handleDismissReport = async (reportId: string) => {
        if (!window.confirm('이 신고를 기각/반려 처리하시겠습니까?')) return;
        setIsSubmitting(true);
        try {
            const result = await apiService.dismissGalleryReport(reportId);
            if (result && result.success) {
                alert('신고가 기각되었습니다.');
                setReports(prev => prev.filter(r => r.id !== reportId));
                setSelectedReport(null);
            } else {
                alert('신고 기각 처리에 실패했습니다.');
            }
        } catch (e) {
            console.error(e);
            alert('오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteReportedPost = async (postId: string, reportId: string) => {
        if (!window.confirm('정말 이 포스트를 영구 삭제하고 신고를 종결하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
        setIsSubmitting(true);
        try {
            // Delete post
            const postResult = await apiService.deleteGalleryPost(postId);
            if (postResult && postResult.success) {
                // Dismiss report
                await apiService.dismissGalleryReport(reportId);
                alert('포스트가 삭제되고 신고가 해결 종결되었습니다.');
                setReports(prev => prev.filter(r => r.id !== reportId));
                setSelectedReport(null);
            } else {
                alert('포스트 삭제에 실패했습니다.');
            }
        } catch (e) {
            console.error(e);
            alert('오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pl-1">
            {/* Header section */}
            <div className="flex items-center justify-between border-b border-white/10 pb-6">
                <div>
                    <h2 className="text-3xl font-black text-orange-500 tracking-tighter flex items-center gap-3">
                        <span className="material-symbols-outlined text-4xl">contact_support</span>
                        고객 문의 & 신고 센터
                    </h2>
                    <p className="text-[10px] text-gray-500 font-bold mt-2 uppercase tracking-[0.3em]">Support & Content Moderation Console</p>
                </div>
            </div>

            {/* Sliding Tab Switcher */}
            <div className="flex border-b border-white/5 pb-4 gap-6">
                <button
                    onClick={() => { setActiveTab('inquiries'); setSelectedInq(null); setSelectedReport(null); }}
                    className={`pb-2 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'inquiries' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    1:1 문의 접수 ({inquiries.length})
                </button>
                <button
                    onClick={() => { setActiveTab('reports'); setSelectedInq(null); setSelectedReport(null); }}
                    className={`pb-2 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'reports' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    피드 신고 관리 ({reports.length})
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : activeTab === 'inquiries' ? (
                /* ═══ 1:1 Inquiries Section ═══ */
                inquiries.length === 0 ? (
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
                                    <p className="text-[10px] text-gray-500 line-clamp-1 font-mono">From: {inq.user_id}</p>
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
                )
            ) : (
                /* ═══ Gallery Reports Section ═══ */
                reports.length === 0 ? (
                    <div className="py-20 text-center bg-black/40 border border-white/5 rounded-2xl">
                        <p className="text-gray-500 font-black text-xs tracking-widest uppercase">No Reports Found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-5 space-y-3 pr-2 overflow-y-auto max-h-[600px] custom-scrollbar">
                            {reports.map(rep => (
                                <div
                                    key={rep.id}
                                    onClick={() => setSelectedReport(rep)}
                                    className={`p-5 rounded-xl border cursor-pointer transition-all ${selectedReport?.id === rep.id ? 'bg-red-950/10 border-red-500/50' : 'bg-zinc-900/50 border-white/5 hover:border-white/20'}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase bg-red-600/20 text-red-500">
                                            Reported
                                        </span>
                                        <p className="text-[9px] text-gray-500 font-mono">{new Date(rep.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <p className="text-xs font-black text-white mb-1">사유: {rep.reason}</p>
                                    <div className="text-[10px] text-gray-500 space-y-0.5 font-mono">
                                        <p>대상: @{rep.cca_nickname || '알수없음'}</p>
                                        <p>신고자: @{rep.reporter_nickname || '익명'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="lg:col-span-7">
                            {selectedReport ? (
                                <div className="bg-zinc-900/80 rounded-2xl p-8 border border-white/5 space-y-6">
                                    <div className="border-b border-white/10 pb-4">
                                        <h3 className="text-lg font-black text-white">피드 포스트 신고 검토</h3>
                                        <p className="text-[10px] text-gray-500 font-mono mt-2">
                                            REPORT ID: {selectedReport.id} | DATE: {new Date(selectedReport.created_at).toLocaleString()}
                                        </p>
                                    </div>

                                    {/* Reported post preview */}
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-red-500 uppercase tracking-widest">Reported Content</label>
                                        
                                        {selectedReport.post_url ? (
                                            <div className="bg-black/50 border border-white/5 rounded-xl p-4 flex flex-col items-center gap-4">
                                                {selectedReport.post_type === 'video' ? (
                                                    <video 
                                                        src={selectedReport.post_url} 
                                                        controls 
                                                        style={{ width: '100%', maxHeight: '300px', borderRadius: 8, objectFit: 'contain' }} 
                                                    />
                                                ) : (
                                                    <img 
                                                        src={selectedReport.post_url} 
                                                        alt="Reported Post" 
                                                        style={{ width: '100%', maxHeight: '300px', borderRadius: 8, objectFit: 'contain' }} 
                                                    />
                                                )}
                                                {selectedReport.post_caption && (
                                                    <p className="text-xs text-gray-300 font-mono self-start border-t border-white/5 pt-3 w-full">
                                                        "{selectedReport.post_caption}"
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="bg-black/50 border border-red-500/10 rounded-xl p-6 text-center text-xs text-red-400 font-mono">
                                                이미 원본 포스트가 삭제되었거나 찾을 수 없는 상태입니다.
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-zinc-950 p-6 rounded-xl border border-white/5 space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">신고 사유:</span>
                                            <span className="font-bold text-white">{selectedReport.reason}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">대상 크리에이터:</span>
                                            <span className="font-bold text-white">@{selectedReport.cca_nickname || '알수없음'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">신고자 계정:</span>
                                            <span className="font-bold text-white">@{selectedReport.reporter_nickname || '익명'}</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-4 pt-4 border-t border-white/5">
                                        <button
                                            onClick={() => handleDismissReport(selectedReport.id)}
                                            disabled={isSubmitting}
                                            className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                                        >
                                            신고 반려 / 기각
                                        </button>
                                        
                                        {selectedReport.gallery_id && selectedReport.post_url && (
                                            <button
                                                onClick={() => handleDeleteReportedPost(selectedReport.gallery_id, selectedReport.id)}
                                                disabled={isSubmitting}
                                                className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white rounded font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                                            >
                                                포스트 영구 삭제
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-zinc-900/30 rounded-2xl p-16 border border-white/5 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                                    <span className="material-symbols-outlined text-5xl text-gray-700 mb-4">gavel</span>
                                    <p className="text-gray-500 font-black text-[10px] tracking-[0.2em] uppercase">Select report to investigate</p>
                                </div>
                            )}
                        </div>
                    </div>
                )
            )}
        </div>
    );
};

export default SuperInquiries;
