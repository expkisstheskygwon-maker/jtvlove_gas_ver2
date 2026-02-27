
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        nickname: '',
        realName: '',
        phone: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            const result = await apiService.register({
                email: formData.email,
                password: formData.password, // In a real app, hash this before sending or on the server!
                nickname: formData.nickname,
                realName: formData.realName,
                phone: formData.phone
            });

            if (result.success) {
                // Mocking auto-login after register
                alert('Registration successful! Welcome to the Association.');
                navigate('/login');
            } else {
                setError(result.error || 'Failed to register');
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4 animate-fade-in py-12">
            <div className="max-w-md w-full">
                {/* Register Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-white/5 p-10 relative overflow-hidden group">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                    <div className="text-center mb-10 relative z-10">
                        <div className="inline-flex items-center justify-center size-16 bg-primary rounded-2xl text-[#1b180d] mb-6 shadow-xl shadow-primary/20">
                            <span className="material-symbols-outlined text-3xl font-black">person_add</span>
                        </div>
                        <h2 className="text-3xl font-black tracking-tighter mb-2">Join Association</h2>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Unlock Premium Access</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold p-4 rounded-xl mb-6 relative z-10 text-center animate-fade-in">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-5 relative z-10">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">Email Address (ID)</label>
                            <div className="relative group">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg transition-colors group-focus-within:text-primary">mail</span>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="your@email.com"
                                    className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-transparent rounded-2xl py-3.5 pl-12 pr-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all focus:bg-white dark:focus:bg-zinc-700"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">Password</label>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg transition-colors group-focus-within:text-primary">lock</span>
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        minLength={6}
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-transparent rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all focus:bg-white dark:focus:bg-zinc-700"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">Confirm</label>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg transition-colors group-focus-within:text-primary">lock_reset</span>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-transparent rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all focus:bg-white dark:focus:bg-zinc-700"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">Legal Name (Read Only later)</label>
                            <div className="relative group">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg transition-colors group-focus-within:text-primary">badge</span>
                                <input
                                    type="text"
                                    name="realName"
                                    required
                                    value={formData.realName}
                                    onChange={handleChange}
                                    placeholder="Your Real Name"
                                    className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-transparent rounded-2xl py-3.5 pl-12 pr-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all focus:bg-white dark:focus:bg-zinc-700"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">Nickname</label>
                            <div className="relative group">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg transition-colors group-focus-within:text-primary">face</span>
                                <input
                                    type="text"
                                    name="nickname"
                                    required
                                    value={formData.nickname}
                                    onChange={handleChange}
                                    placeholder="Community Display Name"
                                    className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-transparent rounded-2xl py-3.5 pl-12 pr-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all focus:bg-white dark:focus:bg-zinc-700"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">Mobile Phone</label>
                            <div className="relative group">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg transition-colors group-focus-within:text-primary">smartphone</span>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="010-0000-0000"
                                    className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-transparent rounded-2xl py-3.5 pl-12 pr-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all focus:bg-white dark:focus:bg-zinc-700"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-5 bg-[#1b180d] dark:bg-zinc-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-xl hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 mt-4 border border-zinc-700/50"
                        >
                            {isLoading ? 'Processing...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        Already a member? <Link to="/login" className="text-primary hover:underline">Sign In Here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
