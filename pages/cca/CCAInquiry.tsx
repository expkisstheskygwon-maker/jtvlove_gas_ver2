import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

const CCAInquiry: React.FC = () => {
    const { user } = useAuth();
    const ccaId = (user as any)?.ccaId || localStorage.getItem('selectedCcaId') || '';
    const ccaName = (user as any)?.ccaName || localStorage.getItem('selectedCcaName') || '';

    const [inquiries, setInquiries] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);

    useEffect(() => {
        fetchInquiries();
    }, [ccaId]);

    const fetchInquiries = async () => {
        if (!ccaId) return;
        setIsLoading(true);
        try {
            const response = await fetch(`/api/user-inquiries?userId=cca_${ccaId}`);
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

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            alert('Please enter both title and content.');
            return;
        }
        setSubmitting(true);
        try {
            const response = await fetch('/api/user-inquiries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: `cca_${ccaId}`,
                    title: `[CCA:${ccaName}] ${title}`,
                    content
                })
            });
            if (response.ok) {
                alert('Inquiry submitted successfully.');
                setShowForm(false);
                setTitle('');
                setContent('');
                fetchInquiries();
            }
        } catch (e) {
            alert('Failed to submit inquiry');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight">System Inquiry</h2>
                    <p className="text-sm text-gray-400 font-bold mt-1">1:1 System Inquiry</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="px-6 py-3 bg-primary text-[#1b180d] rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-lg">support_agent</span>
                    New Inquiry
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
            ) : inquiries.length === 0 ? (
                <div className="py-20 text-center bg-white dark:bg-zinc-900 rounded-[2rem] border border-primary/10">
                    <span className="material-symbols-outlined text-5xl text-gray-300 mb-4 block">help_center</span>
                    <p className="text-gray-400 font-bold">No inquiries submitted</p>
                    <p className="text-xs text-gray-300 mt-1">If you have any questions, please click the 'New Inquiry' button.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-5 space-y-3">
                        {inquiries.map(inq => (
                            <div
                                key={inq.id}
                                onClick={() => setSelectedInquiry(inq)}
                                className={`p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-md ${selectedInquiry?.id === inq.id ? 'border-primary bg-primary/5' : 'border-primary/5 bg-white dark:bg-zinc-900'}`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${inq.status === 'answered' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                        {inq.status === 'answered' ? 'Answered' : 'Pending'}
                                    </span>
                                    <p className="text-[10px] text-gray-400 font-bold">{new Date(inq.created_at).toLocaleDateString('en-US')}</p>
                                </div>
                                <p className="text-sm font-black line-clamp-1">{inq.title}</p>
                                <p className="text-xs text-gray-500 line-clamp-1 mt-1">{inq.content}</p>
                            </div>
                        ))}
                    </div>

                    <div className="lg:col-span-7">
                        {selectedInquiry ? (
                            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 border border-primary/10 shadow-sm space-y-6">
                                <div>
                                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${selectedInquiry.status === 'answered' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                        {selectedInquiry.status === 'answered' ? 'Answered' : 'Pending'}
                                    </span>
                                    <h3 className="text-lg font-black mt-3">{selectedInquiry.title}</h3>
                                    <p className="text-[10px] text-gray-400 font-bold mt-1">{new Date(selectedInquiry.created_at).toLocaleString('en-US')}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 text-sm leading-relaxed whitespace-pre-wrap">
                                    {selectedInquiry.content}
                                </div>
                                {selectedInquiry.answer && (
                                    <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
                                        <p className="text-[10px] font-black text-primary uppercase mb-2">Admin Answer</p>
                                        <p className="text-sm whitespace-pre-wrap">{selectedInquiry.answer}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-16 border border-primary/10 shadow-sm flex flex-col items-center justify-center text-center">
                                <span className="material-symbols-outlined text-5xl text-gray-200 mb-4">help</span>
                                <p className="text-gray-400 font-bold text-sm">Please select an inquiry</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* New Inquiry Modal */}
            {showForm && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-lg" onClick={() => setShowForm(false)}>
                    <div className="bg-white dark:bg-zinc-900 rounded-[2rem] w-full max-w-lg shadow-2xl p-8 space-y-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black">Submit System Inquiry</h3>
                            <button onClick={() => setShowForm(false)} className="size-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Title *</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter inquiry title"
                                className="w-full bg-gray-50 dark:bg-white/5 rounded-2xl px-5 py-4 font-bold text-sm border border-gray-200 dark:border-white/10 outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Content *</label>
                            <textarea
                                rows={6}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Enter inquiry content..."
                                className="w-full bg-gray-50 dark:bg-white/5 rounded-2xl px-5 py-4 font-bold text-sm border border-gray-200 dark:border-white/10 outline-none resize-none"
                            />
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !title.trim() || !content.trim()}
                            className="w-full py-4 bg-primary text-[#1b180d] rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg disabled:opacity-50 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            {submitting ? 'Submitting...' : 'Submit Inquiry'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CCAInquiry;
