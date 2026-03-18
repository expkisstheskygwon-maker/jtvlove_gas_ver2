import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/apiService';

const Footer: React.FC = () => {
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            const data = await apiService.getSiteSettings();
            setSettings(data);
        };
        fetchSettings();
    }, []);

    return (
        <footer className="bg-[#1a1608] text-white pt-16 pb-24 md:pb-12 border-t border-primary/10">
            <div className="max-w-7xl mx-auto px-6">
                {/* Top Section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-3 mb-4">
                            {settings?.logo_url ? (
                                <img 
                                    src={settings.logo_url} 
                                    alt="Logo" 
                                    className={`${settings?.hide_site_name === 'true' ? 'h-8 md:h-10 w-auto' : 'w-10 h-10'} object-contain rounded-xl transition-all`} 
                                />
                            ) : (
                                <div className={`${settings?.hide_site_name === 'true' ? 'h-10 w-10 md:h-12 md:w-12' : 'w-10 h-10'} bg-primary rounded-xl flex items-center justify-center text-[#1b180d] transition-all`}>
                                    <span className={`material-symbols-outlined fill-1 ${settings?.hide_site_name === 'true' ? 'text-2xl' : ''}`}>stars</span>
                                </div>
                            )}
                            {!settings?.hide_site_name || settings.hide_site_name !== 'true' ? (
                                <div>
                                    <h3 className="font-extrabold text-sm uppercase tracking-tight leading-none">
                                        {settings?.site_name ? (
                                            <span className="whitespace-pre-line">{settings.site_name}</span>
                                        ) : null}
                                    </h3>
                                </div>
                            ) : null}
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed mt-4">
                            {settings?.site_name ? `${settings.site_name} ` : ''}{settings?.ui_texts?.footer_desc_1 || '공식 커뮤니티 플랫폼입니다.'}<br />
                            {settings?.ui_texts?.footer_desc_2 || '안전하고 검증된 나이트라이프를 위한 공식 플랫폼입니다.'}
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-4">바로가기</h4>
                        <ul className="space-y-3">
                            <li><Link to="/venues" className="text-sm text-slate-400 hover:text-primary transition-colors flex items-center gap-2"><span className="material-symbols-outlined text-sm">apartment</span>업소 정보</Link></li>
                            <li><Link to="/ccas" className="text-sm text-slate-400 hover:text-primary transition-colors flex items-center gap-2"><span className="material-symbols-outlined text-sm">groups</span>CCA 리스트</Link></li>
                            <li><Link to="/community" className="text-sm text-slate-400 hover:text-primary transition-colors flex items-center gap-2"><span className="material-symbols-outlined text-sm">forum</span>커뮤니티</Link></li>
                            <li><Link to="/notice" className="text-sm text-slate-400 hover:text-primary transition-colors flex items-center gap-2"><span className="material-symbols-outlined text-sm">campaign</span>공지사항</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-4">약관 & 정책</h4>
                        <ul className="space-y-3">
                            <li><Link to="/policy?type=terms" className="text-sm text-slate-400 hover:text-primary transition-colors flex items-center gap-2"><span className="material-symbols-outlined text-sm">gavel</span>이용약관</Link></li>
                            <li><Link to="/policy?type=privacy" className="text-sm text-slate-400 hover:text-primary transition-colors flex items-center gap-2"><span className="material-symbols-outlined text-sm">privacy_tip</span>개인정보 처리방침</Link></li>
                            <li><Link to="/notice?type=FAQ" className="text-sm text-slate-400 hover:text-primary transition-colors flex items-center gap-2"><span className="material-symbols-outlined text-sm">quiz</span>자주 묻는 질문</Link></li>
                        </ul>
                    </div>

                    {/* Contact / SNS */}
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-4">문의 & SNS</h4>
                        <div className="space-y-3">
                            <a href="https://t.me/" target="_blank" rel="noreferrer" className="text-sm text-slate-400 hover:text-primary transition-colors flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">send</span>
                                텔레그램 문의
                            </a>
                            <a href="#" className="text-sm text-slate-400 hover:text-primary transition-colors flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">chat</span>
                                카카오톡 문의
                            </a>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/5 pt-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-xs text-slate-500">
                            © 2026 {settings?.site_name || 'Philippine JTV Association'}. All rights reserved.
                        </p>
                        <p className="text-[10px] text-slate-600 uppercase tracking-widest">
                            Powered by {settings?.site_name || 'JTV LOVE'} Platform
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
