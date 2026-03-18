
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';

const VenueAdminRegister: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        // User Info
        email: '',
        password: '',
        confirmPassword: '',
        nickname: '',
        realName: '',
        phone: '',
        // Venue Info
        venueName: '',
        venueDescription: '',
        location: 'Quezon City', // Default
        category: 'KTV / JTV' // Default
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        setIsLoading(true);

        try {
            const result = await apiService.registerVenueAdmin(formData);

            if (result.success) {
                alert('업소 관리자 등록이 완료되었습니다. 로그인해주세요.');
                navigate('/admin/login');
            } else {
                setError(result.error || '등록에 실패했습니다.');
            }
        } catch (err: any) {
            setError(err.message || '예기치 못한 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 py-20">
            <div className="max-w-2xl w-full">
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-white/5 p-10 relative overflow-hidden">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center size-16 bg-primary rounded-2xl text-[#1b180d] mb-6 shadow-xl shadow-primary/20">
                            <span className="material-symbols-outlined text-3xl font-black">storefront</span>
                        </div>
                        <h2 className="text-3xl font-black tracking-tighter mb-2">업소 관리자 파트너 등록</h2>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">JTV STAR 파트너십</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold p-4 rounded-xl mb-6 text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-8">
                        {/* Section 1: Admin Account */}
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">person_outline</span>
                                계정 정보
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">이메일 (ID)</label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="partner@jtvstar.com"
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-transparent rounded-2xl py-3.5 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">닉네임</label>
                                    <input
                                        type="text"
                                        name="nickname"
                                        required
                                        value={formData.nickname}
                                        onChange={handleChange}
                                        placeholder="관리용 닉네임"
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-transparent rounded-2xl py-3.5 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">비밀번호</label>
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        minLength={6}
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-transparent rounded-2xl py-3.5 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">비밀번호 확인</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-transparent rounded-2xl py-3.5 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">실명</label>
                                    <input
                                        type="text"
                                        name="realName"
                                        required
                                        value={formData.realName}
                                        onChange={handleChange}
                                        placeholder="실명 입력"
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-transparent rounded-2xl py-3.5 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">연락처</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="010-0000-0000"
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-transparent rounded-2xl py-3.5 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-zinc-100 dark:bg-white/5"></div>

                        {/* Section 2: Venue Info */}
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">store</span>
                                업소 정보
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">업소명</label>
                                    <input
                                        type="text"
                                        name="venueName"
                                        required
                                        value={formData.venueName}
                                        onChange={handleChange}
                                        placeholder="업소 공식 명칭"
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-transparent rounded-2xl py-3.5 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">지역</label>
                                        <select
                                            name="location"
                                            value={formData.location}
                                            onChange={handleChange}
                                            className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-transparent rounded-2xl py-3.5 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                        >
                                            <option value="Quezon City">퀘존 시티</option>
                                            <option value="Malate">말라떼</option>
                                            <option value="Pasay">파사이</option>
                                            <option value="Makati">마카티</option>
                                            <option value="Ortigas">올티가스</option>
                                            <option value="Clark">클락/앙헬레스</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">카테고리</label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-transparent rounded-2xl py-3.5 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                        >
                                            <option value="KTV / JTV">KTV / JTV</option>
                                            <option value="Cafe / Bar">Cafe / Bar</option>
                                            <option value="Golf">Golf</option>
                                            <option value="Etc">Etc</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">업소 소개</label>
                                    <textarea
                                        name="venueDescription"
                                        rows={3}
                                        value={formData.venueDescription}
                                        onChange={handleChange}
                                        placeholder="고객들에게 보여줄 업소 소개를 간단히 입력해주세요."
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-transparent rounded-2xl py-3.5 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-5 bg-[#1b180d] dark:bg-primary dark:text-[#1b180d] text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-xl hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 mt-4 border border-zinc-700/50"
                        >
                            {isLoading ? '신청 처리 중...' : '업소 파트너 신청 완료'}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        이미 파트너이신가요? <Link to="/admin/login" className="text-primary hover:underline">로그인하기</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VenueAdminRegister;
