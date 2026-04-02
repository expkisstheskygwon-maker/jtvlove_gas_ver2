import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { apiService } from '../services/apiService';

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    pending: { label: 'Pending Review', color: 'text-amber-500 bg-amber-500/10', icon: 'hourglass_top' },
    reviewing: { label: 'Offers Received', color: 'text-blue-500 bg-blue-500/10', icon: 'mark_email_unread' },
    hired: { label: 'Hired!', color: 'text-emerald-500 bg-emerald-500/10', icon: 'check_circle' },
    rejected: { label: 'Not Selected', color: 'text-red-500 bg-red-500/10', icon: 'cancel' },
};

const offerStatusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'Awaiting Your Response', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
    accepted: { label: 'Accepted', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    rejected: { label: 'Declined', color: 'text-red-500 bg-red-500/10 border-red-500/20' },
    expired: { label: 'Expired', color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' },
};

const ApplicantStatus: React.FC = () => {
    const [name, setName] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !pin.trim()) return;
        setLoading(true);
        setError('');
        try {
            const result = await apiService.checkApplicantStatus(name.trim(), pin.trim());
            if (result.error) {
                setError(result.error);
            } else {
                setData(result);
            }
        } catch (err: any) {
            setError('Failed to check status. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptOffer = async (offerId: string) => {
        if (!window.confirm('Are you sure you want to accept this offer? All other pending offers will be cancelled.')) return;
        setActionLoading(offerId);
        try {
            const result = await apiService.acceptJobOffer(offerId, name, pin);
            if (result.success) {
                alert('🎉 Congratulations! You have been hired. You can now log in to the CCA Portal.');
                const refreshed = await apiService.checkApplicantStatus(name, pin);
                if (!refreshed.error) setData(refreshed);
            } else {
                alert(result.error || 'Failed to accept offer.');
            }
        } catch {
            alert('An error occurred.');
        } finally {
            setActionLoading('');
        }
    };

    const handleRejectOffer = async (offerId: string) => {
        if (!window.confirm('Are you sure you want to decline this offer?')) return;
        setActionLoading(offerId);
        try {
            const result = await apiService.rejectJobOffer(offerId);
            if (result.success) {
                const refreshed = await apiService.checkApplicantStatus(name, pin);
                if (!refreshed.error) setData(refreshed);
            } else {
                alert(result.error || 'Failed to decline offer.');
            }
        } catch {
            alert('An error occurred.');
        } finally {
            setActionLoading('');
        }
    };

    // ═══════════════════════════════════════
    // LOGIN FORM (not authenticated)
    // ═══════════════════════════════════════
    if (!data) {
        return (
            <div className="min-h-screen bg-[#faf9f6] dark:bg-zinc-950 font-display flex flex-col items-center justify-center p-4">
                <Helmet>
                    <title>Check Application Status | JTV STAR</title>
                </Helmet>

                <div className="w-full max-w-md">
                    <Link to="/cca-portal/welcome" className="flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors font-bold text-sm mb-8">
                        <span className="material-symbols-outlined">arrow_back</span>
                        Back to CCA Portal
                    </Link>

                    <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-primary/5 p-8 md:p-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none"></div>
                        
                        <div className="relative z-10">
                            <div className="size-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                                <span className="material-symbols-outlined text-3xl text-emerald-500">badge</span>
                            </div>
                            <h1 className="text-2xl font-extrabold text-center mb-2">Applicant Status</h1>
                            <p className="text-zinc-500 text-sm font-medium text-center mb-8">Enter the name and PIN you used during application</p>
                            
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">Your Name *</label>
                                    <input 
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="Name used in application"
                                        required
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">4-Digit PIN *</label>
                                    <input 
                                        type="text"
                                        value={pin}
                                        onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        placeholder="Enter your 4-digit PIN"
                                        maxLength={4}
                                        required
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-2xl py-4 px-6 text-2xl font-black tracking-[0.5em] text-center focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                                    />
                                </div>

                                {error && (
                                    <div className="bg-red-500/10 text-red-500 rounded-xl p-4 text-sm font-bold text-center">
                                        {error}
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={loading || name.trim() === '' || pin.length < 4}
                                    className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <span className="material-symbols-outlined animate-spin">cyclone</span>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined">search</span>
                                            Check Status
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════
    // STATUS DASHBOARD (authenticated)
    // ═══════════════════════════════════════
    const app = data?.application;
    const offers: any[] = data?.offers || [];

    // Guard: if data was set but application is missing
    if (!app) {
        return (
            <div className="min-h-screen bg-[#faf9f6] dark:bg-zinc-950 font-display flex flex-col items-center justify-center p-4">
                <Helmet><title>Error | JTV STAR</title></Helmet>
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-xl border border-red-500/10 p-10 text-center max-w-md">
                    <span className="material-symbols-outlined text-5xl text-red-400 mb-4 block">error</span>
                    <p className="font-bold text-zinc-600 dark:text-zinc-400 mb-4">Unable to load application data.<br/>Please try logging in again.</p>
                    <button onClick={() => setData(null)} className="px-8 py-3 bg-primary text-[#1b180d] rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const sc = statusConfig[app.status] || statusConfig.pending;

    return (
        <div className="min-h-screen bg-[#faf9f6] dark:bg-zinc-950 font-display p-4 sm:p-8">
            <Helmet>
                <title>My Application Status | JTV STAR</title>
            </Helmet>

            <div className="max-w-3xl mx-auto">
                {/* Top Bar */}
                <div className="flex items-center justify-between mb-8">
                    <Link to="/cca-portal/welcome" className="flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors font-bold text-sm">
                        <span className="material-symbols-outlined">arrow_back</span>
                        CCA Portal
                    </Link>
                    <button onClick={() => setData(null)} className="text-xs font-black text-zinc-400 uppercase tracking-widest hover:text-zinc-600 transition-colors flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">logout</span>
                        Logout
                    </button>
                </div>

                {/* Application Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-xl border border-primary/5 p-6 md:p-8 mb-6">
                    <div className="flex items-start gap-5">
                        {app.image ? (
                            <img src={app.image} alt={app.name} className="size-20 rounded-2xl object-cover flex-shrink-0" />
                        ) : (
                            <div className="size-20 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-outlined text-3xl text-primary">person</span>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-extrabold">{app.nickname || app.name}</h2>
                            <p className="text-xs text-zinc-500 font-medium mt-1">{app.phone} · {app.email || 'No email'}</p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase ${sc.color}`}>
                                    <span className="material-symbols-outlined text-sm">{sc.icon}</span>
                                    {sc.label}
                                </span>
                                {(app.languages || []).map((l: string) => (
                                    <span key={l} className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-[9px] font-bold text-zinc-600 dark:text-zinc-400">{l}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="mt-5 pt-5 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                        <div>
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Age</p>
                            <p className="font-extrabold mt-1">{app.age || '-'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Body Size</p>
                            <p className="font-extrabold mt-1">{app.body_size || '-'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Experience</p>
                            <p className="font-extrabold mt-1">{app.experience || '-'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Applied</p>
                            <p className="font-extrabold mt-1">{app.created_at ? new Date(app.created_at).toLocaleDateString() : '-'}</p>
                        </div>
                    </div>
                </div>

                {/* Status Progress */}
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-xl border border-primary/5 p-6 md:p-8 mb-6">
                    <h3 className="text-sm font-extrabold uppercase tracking-widest text-zinc-400 mb-4">Application Progress</h3>
                    <div className="flex items-center gap-2">
                        {['pending', 'reviewing', 'hired'].map((step, i) => {
                            const isActive = step === app.status;
                            const isPast = ['pending', 'reviewing', 'hired'].indexOf(app.status) >= i;
                            return (
                                <React.Fragment key={step}>
                                    {i > 0 && (
                                        <div className={`flex-1 h-1 rounded-full transition-all ${isPast ? 'bg-primary shadow-[0_0_8px_rgba(255,215,0,0.4)]' : 'bg-zinc-200 dark:bg-zinc-800'}`}></div>
                                    )}
                                    <div className={`size-10 rounded-full flex items-center justify-center text-xs font-black transition-all ${isActive ? 'bg-primary text-[#1b180d] scale-110 shadow-lg shadow-primary/30' : isPast ? 'bg-primary/20 text-primary' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                                        <span className="material-symbols-outlined text-lg">{statusConfig[step]?.icon || 'circle'}</span>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>
                    <div className="flex justify-between mt-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                        <span>Submitted</span>
                        <span>Under Review</span>
                        <span>Hired</span>
                    </div>
                </div>

                {/* Job Offers Section */}
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-xl border border-primary/5 p-6 md:p-8">
                    <h3 className="text-lg font-extrabold mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">work</span>
                        Job Offers ({offers.length})
                    </h3>

                    {offers.length === 0 ? (
                        <div className="text-center py-12">
                            <span className="material-symbols-outlined text-5xl text-zinc-300 dark:text-zinc-700 mb-4 block">inbox</span>
                            <p className="font-bold text-zinc-400">No offers yet</p>
                            <p className="text-xs text-zinc-400 mt-1">Venue managers are reviewing your profile. You'll see offers here when they're interested.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {offers.map((offer: any) => {
                                const os = offerStatusConfig[offer.status] || offerStatusConfig.pending;
                                return (
                                    <div key={offer.id} className={`border-2 rounded-2xl p-5 transition-all ${os.color.split(' ').slice(1).join(' ')}`}>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="material-symbols-outlined text-lg text-primary">apartment</span>
                                                    <h4 className="font-extrabold text-lg">{offer.venue_name || 'Unknown Venue'}</h4>
                                                </div>
                                                {offer.message && (
                                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium mb-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3">
                                                        "{offer.message}"
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                                    <span>{new Date(offer.created_at).toLocaleDateString()}</span>
                                                    <span className={`px-2 py-0.5 rounded-full ${os.color.split(' ').slice(0, 2).join(' ')}`}>{os.label}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {offer.status === 'pending' && (
                                            <div className="flex gap-3 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                                <button 
                                                    onClick={() => handleAcceptOffer(offer.id)}
                                                    disabled={actionLoading === offer.id}
                                                    className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    {actionLoading === offer.id ? <span className="material-symbols-outlined animate-spin text-sm">cyclone</span> : <span className="material-symbols-outlined text-sm">check</span>}
                                                    Accept
                                                </button>
                                                <button 
                                                    onClick={() => handleRejectOffer(offer.id)}
                                                    disabled={actionLoading === offer.id}
                                                    className="flex-1 py-3 bg-red-500/10 text-red-500 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-sm">close</span>
                                                    Decline
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Hired? CCA Portal Link */}
                {app.status === 'hired' && (
                    <div className="mt-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
                        <span className="material-symbols-outlined text-4xl text-emerald-500 mb-3 block">celebration</span>
                        <p className="font-extrabold text-lg mb-2">Congratulations! You're now a CCA Partner.</p>
                        <p className="text-sm text-zinc-500 mb-4">You can now access the CCA Portal with your assigned credentials.</p>
                        <Link to="/cca-portal/login" className="inline-flex px-8 py-3 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all items-center gap-2">
                            <span className="material-symbols-outlined text-sm">login</span>
                            Go to CCA Portal
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApplicantStatus;
