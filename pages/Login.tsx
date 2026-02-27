
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Placeholder for login logic
        setTimeout(() => {
            setIsLoading(false);
            navigate('/mypage');
        }, 1500);
    };

    const handleGoogleLogin = () => {
        // Placeholder for Google OAuth
        window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth';
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4 animate-fade-in">
            <div className="max-w-md w-full">
                {/* Login Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-white/5 p-10 relative overflow-hidden group">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full -ml-16 -mt-16 blur-3xl"></div>

                    <div className="text-center mb-10 relative z-10">
                        <div className="inline-flex items-center justify-center size-16 bg-primary rounded-2xl text-[#1b180d] mb-6 shadow-xl shadow-primary/20">
                            <span className="material-symbols-outlined text-3xl font-black">lock_open</span>
                        </div>
                        <h2 className="text-3xl font-black tracking-tighter mb-2">Member Portal</h2>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Elite Access Authorization</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">Email Address</label>
                            <div className="relative group">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg transition-colors group-focus-within:text-primary">mail</span>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-transparent rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all focus:bg-white dark:focus:bg-zinc-700"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">Password</label>
                            <div className="relative group">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg transition-colors group-focus-within:text-primary">lock</span>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-transparent rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all focus:bg-white dark:focus:bg-zinc-700"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded-md border-zinc-300 dark:border-zinc-700 text-primary focus:ring-primary size-4" />
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Remember Me</span>
                            </label>
                            <Link to="#" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Forgot ID/PW?</Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-5 bg-primary text-[#1b180d] rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isLoading ? 'Authenticating...' : 'Sign In Now'}
                        </button>
                    </form>

                    <div className="mt-10 relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="flex-1 h-px bg-zinc-100 dark:bg-white/5"></div>
                            <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">or continue with</span>
                            <div className="flex-1 h-px bg-zinc-100 dark:bg-white/5"></div>
                        </div>

                        <button
                            onClick={handleGoogleLogin}
                            className="w-full py-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-2xl flex items-center justify-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all shadow-sm group"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="size-5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Sign in with Google</span>
                        </button>
                    </div>

                    <p className="mt-10 text-center text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        Don't have an account? <Link to="#" className="text-primary hover:underline">Join the Association</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
