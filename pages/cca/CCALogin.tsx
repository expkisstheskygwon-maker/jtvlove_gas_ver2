import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import { CCA } from '../../types';

const CCALogin: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    // Step state
    const [step, setStep] = useState<'enter_nickname' | 'select_cca' | 'enter_password'>('enter_nickname');

    // Form and data state
    const [nickname, setNickname] = useState('');
    const [matchedCCAs, setMatchedCCAs] = useState<CCA[]>([]);
    const [selectedCca, setSelectedCca] = useState<CCA | null>(null);
    const [password, setPassword] = useState('');

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearchNickname = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nickname.trim()) {
            setError('닉네임을 입력해주세요.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Fetch public CCAs (this does not require login)
            const allCCAs = await apiService.getCCAs();

            // Filter by exact uppercase nickname match
            const matches = allCCAs.filter(
                c => c.nickname?.toUpperCase() === nickname.toUpperCase().trim()
            );

            if (matches.length > 0) {
                // Sort by venueName ascending
                matches.sort((a, b) => (a.venueName || '').localeCompare(b.venueName || ''));
                setMatchedCCAs(matches);

                if (matches.length === 1) {
                    // Auto-select if there's only one match
                    setSelectedCca(matches[0]);
                    setStep('enter_password');
                } else {
                    setStep('select_cca');
                }
            } else {
                setError('해당 닉네임을 가진 CCA를 찾을 수 없습니다.');
            }
        } catch (err: any) {
            setError(err.message || 'CCA 검색 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectCca = (cca: CCA) => {
        setSelectedCca(cca);
        setStep('enter_password');
        setError('');
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCca || !selectedCca.email) {
            setError('CCA 정보(이메일)가 누락되었습니다. 다시 시도해주세요.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Internally use the selected CCA's email to login
            const result = await apiService.login({ email: selectedCca.email, password });

            if (result.success && result.user) {
                const userObj = typeof result.user === 'string' ? JSON.parse(result.user) : result.user;

                // Validate if it's actually for a CCA
                if (userObj.role !== 'cca') {
                    if (!result.ccaId) {
                        setError('CCA 전용 계정이 아닙니다.');
                        setIsLoading(false);
                        return;
                    }
                }

                // Make sure we pass the correct ccaId
                const userData = {
                    ...userObj,
                    ccaId: result.ccaId || selectedCca.id || userObj.id
                };

                login(userData);
                navigate('/cca-portal');
            } else {
                setError(result.error || '비밀번호가 일치하지 않거나 로그인에 실패했습니다.');
            }
        } catch (err: any) {
            setError(err.message || '예기치 못한 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const resetFlow = () => {
        setStep('enter_nickname');
        setSelectedCca(null);
        setMatchedCCAs([]);
        setPassword('');
        setError('');
    };

    return (
        <div className="min-h-screen bg-[#faf9f6] dark:bg-[#0f0e0b] flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-primary/5 p-10 relative overflow-hidden">
                    {/* Background Accents */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="text-center mb-10 relative z-10">
                        <div className="inline-flex items-center justify-center size-16 bg-gradient-to-br from-primary to-yellow-600 rounded-2xl text-white mb-6 shadow-xl shadow-primary/20">
                            <span className="material-symbols-outlined text-3xl">sparkles</span>
                        </div>
                        <h2 className="text-3xl font-black tracking-tight mb-2">CCA Portal Login</h2>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Staff Access Only</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold p-4 rounded-xl mb-6 text-center animate-shake">
                            {error}
                        </div>
                    )}

                    {step === 'enter_nickname' && (
                        <form onSubmit={handleSearchNickname} className="space-y-6 relative z-10 animate-fade-in">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">CCA Nickname</label>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg group-focus-within:text-primary transition-colors">account_circle</span>
                                    <input
                                        type="text"
                                        required
                                        value={nickname}
                                        onChange={(e) => setNickname(e.target.value.toUpperCase())}
                                        placeholder="Enter your uppercase nickname"
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-transparent rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none uppercase"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading || !nickname.trim()}
                                className="w-full py-5 bg-gradient-to-r from-[#1b180d] to-[#2a2618] dark:from-primary dark:to-yellow-500 dark:text-[#1b180d] text-white rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-xl hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isLoading ? 'Searching...' : 'Next'}
                            </button>
                        </form>
                    )}

                    {step === 'select_cca' && (
                        <div className="space-y-6 relative z-10 animate-fade-in">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">Select your profile</label>
                                <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                    {matchedCCAs.map((cca) => (
                                        <button
                                            key={cca.id}
                                            onClick={() => handleSelectCca(cca)}
                                            className="w-full text-left bg-zinc-50 dark:bg-zinc-800 hover:bg-primary/10 dark:hover:bg-primary/20 border border-transparent hover:border-primary/30 rounded-2xl p-4 transition-all flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center p-0.5 shadow-sm">
                                                    <img src={cca.image || 'https://via.placeholder.com/40'} alt={cca.nickname} className="w-full h-full object-cover rounded-full" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black group-hover:text-primary transition-colors">{cca.nickname}</span>
                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase">{cca.venueName || 'Unknown Venue'}</span>
                                                </div>
                                            </div>
                                            <span className="material-symbols-outlined text-zinc-300 group-hover:text-primary transition-colors">chevron_right</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={resetFlow}
                                className="w-full py-4 bg-transparent border border-zinc-200 dark:border-zinc-700 text-zinc-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                            >
                                Back to Nickname
                            </button>
                        </div>
                    )}

                    {step === 'enter_password' && selectedCca && (
                        <form onSubmit={handleLogin} className="space-y-6 relative z-10 animate-fade-in">
                            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center gap-4 mb-4">
                                <div className="size-12 rounded-full overflow-hidden border-2 border-primary/30">
                                    <img src={selectedCca.image || 'https://via.placeholder.com/50'} alt={selectedCca.nickname} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-zinc-500">Logging in as</span>
                                    <span className="text-lg font-black">{selectedCca.nickname} <span className="text-xs font-bold text-zinc-400">@ {selectedCca.venueName}</span></span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">Password</label>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg group-focus-within:text-primary transition-colors">lock</span>
                                    <input
                                        type="password"
                                        required
                                        autoFocus
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-transparent rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={isLoading || !password}
                                    className="w-full py-5 bg-gradient-to-r from-[#1b180d] to-[#2a2618] dark:from-primary dark:to-yellow-500 dark:text-[#1b180d] text-white rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-xl hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isLoading ? 'Authenticating...' : 'Sign In To Portal'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetFlow}
                                    disabled={isLoading}
                                    className="w-full py-4 bg-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-2xl font-black uppercase text-xs tracking-widest transition-all"
                                >
                                    Not {selectedCca.nickname}?
                                </button>
                            </div>
                        </form>
                    )}

                    <p className="mt-10 text-center text-[10px] font-black text-zinc-400 uppercase tracking-widest relative z-10">
                        Need assistance? <Link to="/notice?type=FAQ" className="text-primary hover:underline">Contact Support</Link>
                    </p>
                </div>

                <p className="mt-8 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest opacity-60">
                    &copy; JTV LOVE Professional Staff Network
                </p>
            </div>
        </div>
    );
};

export default CCALogin;
