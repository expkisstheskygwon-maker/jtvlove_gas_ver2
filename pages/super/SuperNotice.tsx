
import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';

const SuperNotice: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'notice' | 'event' | 'faq' | 'docs'>('notice');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);

    // For Docs (Terms/Privacy)
    const [termsContent, setTermsContent] = useState('');
    const [privacyContent, setPrivacyContent] = useState('');

    useEffect(() => {
        if (activeTab === 'docs') {
            fetchDocs();
        } else {
            fetchContent();
        }
    }, [activeTab]);

    const fetchContent = async () => {
        setLoading(true);
        setError(null);
        try {
            const boardMap = {
                notice: 'Notice',
                event: 'Event',
                faq: 'FAQ'
            };
            const data = await apiService.getAdminContent(boardMap[activeTab as keyof typeof boardMap]);
            setItems(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchDocs = async () => {
        setLoading(true);
        try {
            const terms = await apiService.getSiteDoc('terms');
            const privacy = await apiService.getSiteDoc('privacy');
            setTermsContent(terms?.content || '');
            setPrivacyContent(privacy?.content || '');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveItem = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            board: activeTab === 'notice' ? 'Notice' : activeTab === 'event' ? 'Event' : 'FAQ',
            title: formData.get('title'),
            content: formData.get('content'),
            image: formData.get('image'),
            author: 'Super Admin'
        };

        try {
            if (selectedItem?.id) {
                await apiService.updateAdminContent(selectedItem.id, data);
            } else {
                await apiService.saveAdminContent(data);
            }
            setIsEditing(false);
            setSelectedItem(null);
            fetchContent();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("정말 삭제하시겠습니까?")) return;
        try {
            await apiService.deleteAdminContent(id);
            fetchContent();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleSaveDocs = async () => {
        try {
            await apiService.updateAdminSiteDoc('terms', termsContent);
            await apiService.updateAdminSiteDoc('privacy', privacyContent);
            alert("저장되었습니다.");
        } catch (err: any) {
            alert(err.message);
        }
    };

    const renderTabContent = () => {
        if (loading) return <div className="p-20 text-center animate-pulse text-red-500 font-black">ACCESSING DATABASE...</div>;

        if (activeTab === 'docs') {
            return (
                <div className="space-y-8 animate-fade-in">
                    <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-white/5 space-y-4">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Site Terms of Service (이용약관)</label>
                        <textarea
                            value={termsContent}
                            onChange={(e) => setTermsContent(e.target.value)}
                            className="w-full h-64 bg-black border border-white/5 rounded-2xl p-6 text-sm font-bold text-white outline-none focus:border-red-500 resize-none font-mono"
                        ></textarea>
                    </div>
                    <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-white/5 space-y-4">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Privacy Policy (개인정보 처리방침)</label>
                        <textarea
                            value={privacyContent}
                            onChange={(e) => setPrivacyContent(e.target.value)}
                            className="w-full h-64 bg-black border border-white/5 rounded-2xl p-6 text-sm font-bold text-white outline-none focus:border-red-500 resize-none font-mono"
                        ></textarea>
                    </div>
                    <button
                        onClick={handleSaveDocs}
                        className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl"
                    >
                        Update Legal Documents
                    </button>
                </div>
            );
        }

        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Listed {activeTab}s</h3>
                    <button
                        onClick={() => { setSelectedItem(null); setIsEditing(true); }}
                        className="bg-primary text-black px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest"
                    >
                        New {activeTab} Entry
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {items.map(item => (
                        <div key={item.id} className="bg-zinc-900 p-8 rounded-[2.5rem] border border-white/5 flex items-center justify-between group hover:border-red-500/30 transition-all">
                            <div className="flex items-center gap-6">
                                <div className="size-12 rounded-2xl bg-black border border-white/5 flex items-center justify-center font-black text-zinc-500 italic">
                                    {item.board === 'FAQ' ? '?' : '#'}
                                </div>
                                <div>
                                    <h4 className="font-black text-white uppercase tracking-tighter">{item.title}</h4>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                                        Date: {new Date(item.created_at).toLocaleDateString()} | Author: {item.author}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setSelectedItem(item); setIsEditing(true); }}
                                    className="p-3 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm">edit</span>
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-3 bg-zinc-800 rounded-xl text-zinc-400 hover:text-red-500 transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                    {items.length === 0 && (
                        <div className="py-20 text-center bg-zinc-950/50 rounded-[2.5rem] border border-dashed border-white/5">
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">Zero records found</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-12 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <h2 className="text-3xl font-black tracking-tight mb-2 uppercase italic text-white/90">Communication Center</h2>
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Broadcast Governance & Legal Documents</p>
                </div>
                <div className="flex bg-zinc-900/50 p-1 rounded-2xl border border-white/5">
                    {(['notice', 'event', 'faq', 'docs'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {renderTabContent()}

            {/* Entry Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => setIsEditing(false)}>
                    <div className="bg-zinc-900 border border-white/10 w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl space-y-8" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                                {selectedItem ? `Update ${activeTab}` : `New ${activeTab} Entry`}
                            </h3>
                            <button onClick={() => setIsEditing(false)} className="size-10 rounded-full bg-zinc-800 flex items-center justify-center text-white hover:bg-red-600 transition-all">
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSaveItem} className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Entry Title</label>
                                <input
                                    name="title"
                                    type="text"
                                    defaultValue={selectedItem?.title}
                                    placeholder={activeTab === 'faq' ? 'Q: Your question here?' : 'Enter entry title...'}
                                    required
                                    className="w-full bg-black border border-white/5 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-red-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Information Content</label>
                                <textarea
                                    name="content"
                                    defaultValue={selectedItem?.content}
                                    placeholder={activeTab === 'faq' ? 'A: Your answer here...' : 'Compose content...'}
                                    required
                                    className="w-full h-48 bg-black border border-white/5 rounded-2xl p-6 text-sm font-bold text-white outline-none focus:border-red-500 resize-none"
                                ></textarea>
                            </div>

                            {activeTab !== 'faq' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Banner Image (Base64 URL)</label>
                                    <input
                                        name="image"
                                        type="text"
                                        defaultValue={selectedItem?.image}
                                        placeholder="Paste image URL or Base64 data..."
                                        className="w-full bg-black border border-white/5 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-red-500"
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full py-5 bg-primary text-black rounded-2xl font-black uppercase tracking-widest hover:bg-white transition-all shadow-xl mt-4"
                            >
                                {selectedItem ? 'Authorize Update' : 'Broadcast Entry'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperNotice;
