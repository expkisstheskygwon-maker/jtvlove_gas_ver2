
import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { HeroSection, CCA } from '../../types';

const defaultTexts = {
  home_cca_subtitle: '인기 CCA 리스트',
  home_cca_title: '이번 주 <span class="text-primary">화제의 홍보대사</span>',
  home_venue_subtitle: '이달의 추천 업소',
  home_venue_title: '최고의 JTV 라운지',
  home_premium_title: 'PREMIUM EXPERIENCE',
  home_premium_subtitle: '특별한 밤을 위한 최고의 선택',
  home_premium_content: 'JTV협회가 인증한 프리미엄 업소와 검증된 CCA를 만나보세요. 안전하고 만족스러운 경험을 보장합니다.',
  home_btn_cca: 'CCA 둘러보기',
  home_btn_venue: '업소 정보 보기',
  footer_desc_1: '공식 커뮤니티 플랫폼입니다.',
  footer_desc_2: '안전하고 검증된 나이트라이프를 위한 공식 플랫폼입니다.'
};

const SuperSiteSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'config' | 'hero' | 'text'>('config');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Tab 1: Configuration
  const [settings, setSettings] = useState({
    site_name: '',
    admin_phone: '',
    admin_email: '',
    admin_sns: '',
    hq_address: '',
    logo_url: '',
    favicon_url: '',
    venues_hero_image: '',
    venues_hero_title: '',
    venues_hero_subtitle: '',
    ccas_hero_image: '',
    ccas_hero_title: '',
    ccas_hero_subtitle: '',
    notice_hero_image: '',
    notice_hero_title: '',
    notice_hero_subtitle: '',
    ui_texts: {}
  });

  // Tab 2: Hero
  const [heroSections, setHeroSections] = useState<HeroSection[]>([]);
  const [ccas, setCCAs] = useState<CCA[]>([]);

  // Tab 3: Text Manager
  const [texts, setTexts] = useState<any>(defaultTexts);

  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // Password Change State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [siteData, heroData, ccaData] = await Promise.all([
        apiService.getSiteSettings(),
        apiService.getHeroSections(),
        apiService.getCCAs()
      ]);

      if (siteData) {
        setSettings({
          ...siteData,
          site_name: siteData.site_name || '',
          admin_phone: siteData.admin_phone || '',
          admin_email: siteData.admin_email || '',
          admin_sns: siteData.admin_sns || '',
          hq_address: siteData.hq_address || '',
          logo_url: siteData.logo_url || '',
          favicon_url: siteData.favicon_url || '',
          venues_hero_image: siteData.venues_hero_image || '',
          venues_hero_title: siteData.venues_hero_title || '',
          venues_hero_subtitle: siteData.venues_hero_subtitle || '',
          ccas_hero_image: siteData.ccas_hero_image || '',
          ccas_hero_title: siteData.ccas_hero_title || '',
          ccas_hero_subtitle: siteData.ccas_hero_subtitle || '',
          notice_hero_image: siteData.notice_hero_image || '',
          notice_hero_title: siteData.notice_hero_title || '',
          notice_hero_subtitle: siteData.notice_hero_subtitle || '',
          ui_texts: siteData.ui_texts || {}
        });

        if (siteData.ui_texts) {
          setTexts({ ...defaultTexts, ...siteData.ui_texts });
        }
      }

      setHeroSections(heroData || []);
      setCCAs(ccaData || []);
    } catch (err) {
      console.error("Data load failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (field: keyof typeof settings | number, file: File, index?: number) => {
    const url = await apiService.uploadImage(file);
    if (!url) {
      alert("이미지 업로드에 실패했습니다.");
      return;
    }

    if (activeTab === 'config') {
      setSettings(prev => ({ ...prev, [field as string]: url }));
    } else if (activeTab === 'hero' && typeof index === 'number') {
      const newSections = [...heroSections];
      newSections[index].imageUrl = url;
      setHeroSections(newSections);
    }
  };

  const handleGlobalSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      let success = true;

      if (activeTab === 'config') {
        success = await apiService.updateSiteSettings(settings);
      } else if (activeTab === 'hero') {
        success = await apiService.updateHeroSections(heroSections);
      } else if (activeTab === 'text') {
        const updatedSettings = { ...settings, ui_texts: texts };
        success = await apiService.updateSiteSettings(updatedSettings);
        if (success) setSettings(updatedSettings);
      }

      if (success) {
        setMessage({ text: 'Changes saved successfully.', type: 'success' });
      } else {
        setMessage({ text: 'Failed to save changes. Please try again.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'System error occurred.', type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    setIsChangingPassword(true);
    try {
      const result = await apiService.changeSuperAdminPassword(passwordForm.currentPassword, passwordForm.newPassword);
      if (result.success) {
        setMessage({ text: 'Password updated.', type: 'success' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ text: result.error || 'Failed.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Error occurred.', type: 'error' });
    } finally {
      setIsChangingPassword(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const renderTabButton = (id: typeof activeTab, label: string, icon: string) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
        activeTab === id 
        ? 'bg-red-600 text-white shadow-[0_0_30px_rgba(220,38,38,0.2)]' 
        : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
      }`}
    >
      <span className="material-symbols-outlined text-lg">{icon}</span>
      {label}
    </button>
  );

  const renderTextInput = (key: string, label: string, isTextarea = false, hint?: string) => (
    <div className="flex flex-col gap-2 bg-zinc-900 border border-white/5 rounded-2xl p-6">
      <label className="text-[10px] font-black uppercase tracking-widest text-[#ee9d2b]">{label}</label>
      {hint && <p className="text-[10px] text-gray-500 font-bold">{hint}</p>}
      {isTextarea ? (
        <textarea
          value={texts[key] || ''}
          onChange={(e) => setTexts((prev: any) => ({ ...prev, [key]: e.target.value }))}
          className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-red-500 outline-none transition-all h-24 resize-none"
        />
      ) : (
        <input
          type="text"
          value={texts[key] || ''}
          onChange={(e) => setTexts((prev: any) => ({ ...prev, [key]: e.target.value }))}
          className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-red-500 outline-none transition-all"
        />
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="size-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Accessing Cloud Console...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-32 animate-fade-in relative">
      {/* Header Area */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Site Management</h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="size-2 bg-green-500 rounded-full"></span>
            System Live · {activeTab.toUpperCase()} Module
          </p>
        </div>
        {message && (
          <div className={`px-6 py-3 rounded-xl text-[10px] font-black animate-fade-in border flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
            <span className="material-symbols-outlined text-sm">{message.type === 'success' ? 'check_circle' : 'error'}</span>
            {message.text}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 mb-10 p-2 bg-zinc-950 rounded-[2rem] border border-white/5 w-fit">
        {renderTabButton('config', 'Site Configuration', 'settings')}
        {renderTabButton('hero', 'Hero Manager', 'view_carousel')}
        {renderTabButton('text', 'Content Text Manager', 'text_fields')}
      </div>

      <div className="space-y-12">
        {/* TAB 1: SITE CONFIGURATION */}
        {activeTab === 'config' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="size-10 bg-red-600 rounded-xl flex items-center justify-center text-white"><span className="material-symbols-outlined">identity_platform</span></div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Identity</h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Association Name</label>
                    <input type="text" value={settings.site_name} onChange={(e) => setSettings({...settings, site_name: e.target.value})} className="w-full bg-black border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-1 focus:ring-red-500" />
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Logo Upload</label>
                      <input type="file" onChange={(e) => e.target.files?.[0] && handleImageUpload('logo_url', e.target.files[0])} className="w-full text-[10px] text-gray-500 file:bg-red-600/10 file:text-red-500 file:border-0 file:px-4 file:py-2 file:rounded-lg file:font-black file:mr-4" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Favicon Upload</label>
                      <input type="file" onChange={(e) => e.target.files?.[0] && handleImageUpload('favicon_url', e.target.files[0])} className="w-full text-[10px] text-gray-500 file:bg-red-600/10 file:text-red-500 file:border-0 file:px-4 file:py-2 file:rounded-lg file:font-black file:mr-4" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="size-10 bg-blue-600 rounded-xl flex items-center justify-center text-white"><span className="material-symbols-outlined">public</span></div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Support</h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Hotline</label>
                    <input type="text" value={settings.admin_phone} onChange={(e) => setSettings({...settings, admin_phone: e.target.value})} className="w-full bg-black border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Email</label>
                    <input type="text" value={settings.admin_email} onChange={(e) => setSettings({...settings, admin_email: e.target.value})} className="w-full bg-black border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">SNS / CHANNEL</label>
                    <input type="text" value={settings.admin_sns} onChange={(e) => setSettings({...settings, admin_sns: e.target.value})} className="w-full bg-black border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
              <div className="flex items-center gap-4 mb-4 text-[#ee9d2b]">
                <div className="size-10 bg-zinc-800 rounded-xl flex items-center justify-center text-white"><span className="material-symbols-outlined">view_quilt</span></div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white">Subpage Hero Banners</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Venues */}
                <div className="space-y-3 p-4 bg-black/40 rounded-3xl border border-white/5">
                  <span className="text-[8px] font-black text-gray-500 uppercase">Venue Page</span>
                  <input type="file" onChange={(e) => e.target.files?.[0] && handleImageUpload('venues_hero_image', e.target.files[0])} className="w-full text-[9px] mb-2" />
                  <input type="text" placeholder="Title" value={settings.venues_hero_title} onChange={(e) => setSettings({...settings, venues_hero_title: e.target.value})} className="w-full bg-black text-[11px] font-bold p-2 rounded-lg border border-zinc-800" />
                </div>
                {/* CCAs */}
                <div className="space-y-3 p-4 bg-black/40 rounded-3xl border border-white/5">
                  <span className="text-[8px] font-black text-gray-500 uppercase">CCA List Page</span>
                  <input type="file" onChange={(e) => e.target.files?.[0] && handleImageUpload('ccas_hero_image', e.target.files[0])} className="w-full text-[9px] mb-2" />
                  <input type="text" placeholder="Title" value={settings.ccas_hero_title} onChange={(e) => setSettings({...settings, ccas_hero_title: e.target.value})} className="w-full bg-black text-[11px] font-bold p-2 rounded-lg border border-zinc-800" />
                </div>
                {/* Notice */}
                <div className="space-y-3 p-4 bg-black/40 rounded-3xl border border-white/5">
                  <span className="text-[8px] font-black text-gray-500 uppercase">Notice Page</span>
                  <input type="file" onChange={(e) => e.target.files?.[0] && handleImageUpload('notice_hero_image', e.target.files[0])} className="w-full text-[9px] mb-2" />
                  <input type="text" placeholder="Title" value={settings.notice_hero_title} onChange={(e) => setSettings({...settings, notice_hero_title: e.target.value})} className="w-full bg-black text-[11px] font-bold p-2 rounded-lg border border-zinc-800" />
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-red-500/20 space-y-6">
              <div className="flex items-center gap-4"><span className="material-symbols-outlined text-red-500">security</span><h3 className="text-lg font-black uppercase tracking-tight">Security</h3></div>
              <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input type="password" placeholder="Current" required value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})} className="bg-black border-zinc-800 rounded-xl px-4 py-2 text-xs font-bold" />
                <input type="password" placeholder="New" required value={passwordForm.newPassword} onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} className="bg-black border-zinc-800 rounded-xl px-4 py-2 text-xs font-bold" />
                <input type="password" placeholder="Confirm" required value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} className="bg-black border-zinc-800 rounded-xl px-4 py-2 text-xs font-bold" />
                <button type="submit" disabled={isChangingPassword} className="bg-red-600 text-[9px] font-black uppercase rounded-xl transition-all hover:bg-red-700">Update Password</button>
              </form>
            </div>
          </>
        )}

        {/* TAB 2: HERO MANAGER */}
        {activeTab === 'hero' && (
          <div className="space-y-8 pb-10">
            <div className="flex justify-between items-center bg-zinc-900 p-6 border border-white/5 rounded-3xl">
              <div><h4 className="text-sm font-black uppercase tracking-widest text-[#ee9d2b]">Slides Configuration</h4><p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Maximum 5 dynamic banners per session</p></div>
              <button onClick={() => {
                if (heroSections.length >= 5) return alert("Max 5 slides");
                setHeroSections([...heroSections, { id: Date.now(), ccaId: '', badge1: '', badge2: '', title: '', content: '', buttonText: '프로필 보기', buttonLink: '', imageUrl: '', displayOrder: heroSections.length }]);
              }} className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">Add Slide</button>
            </div>

            <div className="space-y-6">
              {heroSections.map((slide, idx) => (
                <div key={slide.id} className="bg-zinc-900 border border-white/5 rounded-[2rem] p-6 relative group">
                  <button onClick={() => setHeroSections(heroSections.filter((_, i) => i !== idx))} className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-sm font-black">close</span></button>
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1 space-y-4">
                      <div className="aspect-[3/4] bg-black rounded-2xl border border-white/5 flex items-center justify-center overflow-hidden">
                        {slide.imageUrl ? <img src={slide.imageUrl} className="size-full object-cover" /> : <span className="material-symbols-outlined text-zinc-800 text-4xl">image</span>}
                      </div>
                      <input type="file" onChange={(e) => e.target.files?.[0] && handleImageUpload(idx, e.target.files[0], idx)} className="w-full text-[8px]" />
                    </div>
                    <div className="lg:col-span-3 space-y-4">
                      <select value={slide.ccaId} onChange={(e) => {
                        const newSections = [...heroSections];
                        const val = e.target.value;
                        newSections[idx].ccaId = val;
                        const cca = ccas.find(c => c.id === val);
                        if (cca) {
                          newSections[idx].title = `인기 ${cca.nickname || cca.name}`;
                          newSections[idx].content = cca.description;
                          newSections[idx].buttonLink = `/ccas/${cca.id}`;
                          if (!newSections[idx].imageUrl) newSections[idx].imageUrl = cca.image;
                        }
                        setHeroSections(newSections);
                      }} className="w-full bg-black border-zinc-800 rounded-xl text-xs font-bold text-[#ee9d2b] p-3 outline-none focus:ring-1 focus:ring-[#ee9d2b]">
                        <option value="">-- Targeted Promotional Member --</option>
                        {ccas.map(c => <option key={c.id} value={c.id}>{c.nickname || c.name} ({c.venueName})</option>)}
                      </select>
                      <input type="text" placeholder="Main Catchphrase Title" value={slide.title} onChange={(e) => { const n = [...heroSections]; n[idx].title = e.target.value; setHeroSections(n); }} className="w-full bg-black border-zinc-800 rounded-xl px-4 py-3 text-sm font-black text-white" />
                      <textarea rows={2} placeholder="Description body..." value={slide.content} onChange={(e) => { const n = [...heroSections]; n[idx].content = e.target.value; setHeroSections(n); }} className="w-full bg-black border-zinc-800 rounded-xl px-4 py-3 text-[11px] font-medium text-gray-400 resize-none outline-none focus:ring-1 focus:ring-[#ee9d2b]" />
                      <div className="grid grid-cols-2 gap-4">
                         <input type="text" placeholder="Button Text" value={slide.buttonText} onChange={(e) => { const n = [...heroSections]; n[idx].buttonText = e.target.value; setHeroSections(n); }} className="bg-black border-zinc-800 rounded-xl px-4 py-2 text-[10px] font-bold" />
                         <input type="text" placeholder="Link URL" value={slide.buttonLink} onChange={(e) => { const n = [...heroSections]; n[idx].buttonLink = e.target.value; setHeroSections(n); }} className="bg-black border-zinc-800 rounded-xl px-4 py-2 text-[10px] font-bold" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: TEXT MANAGER */}
        {activeTab === 'text' && (
          <div className="space-y-10 pb-10">
             <section className="space-y-4">
                <h4 className="text-[10px] font-black text-white/50 border-b border-white/10 pb-2 tracking-[0.2em] uppercase">Homepage Main Sections</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {renderTextInput('home_cca_subtitle', 'CCA Section Sub')}
                   {renderTextInput('home_cca_title', 'CCA Section Main Title', false, 'Use <span> for color point')}
                   {renderTextInput('home_venue_subtitle', 'Venue Section Sub')}
                   {renderTextInput('home_venue_title', 'Venue Section Main Title')}
                </div>
             </section>
             <section className="space-y-4">
                <h4 className="text-[10px] font-black text-white/50 border-b border-white/10 pb-2 tracking-[0.2em] uppercase">Premium Middle Banner</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {renderTextInput('home_premium_title', 'Badge Label')}
                   {renderTextInput('home_premium_subtitle', 'Headline')}
                </div>
                {renderTextInput('home_premium_content', 'Introduction Body', true)}
             </section>
             <section className="space-y-4">
                <h4 className="text-[10px] font-black text-white/50 border-b border-white/10 pb-2 tracking-[0.2em] uppercase">Global Branding (Footer)</h4>
                <div className="grid grid-cols-1 gap-4">
                   {renderTextInput('footer_desc_1', 'Short Tagline Line 1')}
                   {renderTextInput('footer_desc_2', 'Detailed description Line 2')}
                </div>
             </section>
          </div>
        )}
      </div>

      {/* Persistent Save Button - Custom floating style at the bottom area instead of screen-long sticky */}
      <div className="mt-20 flex justify-center sticky bottom-10 z-[100] px-8 cursor-default">
         <button
           onClick={handleGlobalSave}
           disabled={isSaving}
           className="group max-w-sm w-full bg-red-600 p-1 rounded-3xl shadow-[0_15px_50px_rgba(220,38,38,0.5)] hover:scale-[1.05] active:scale-[0.95] transition-all disabled:opacity-50"
         >
            <div className="bg-zinc-950/40 group-hover:bg-transparent rounded-[1.4rem] py-5 px-8 flex items-center justify-center gap-4 transition-colors">
               {isSaving ? (
                  <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
               ) : (
                  <span className="material-symbols-outlined text-white text-xl">rocket_launch</span>
               )}
               <span className="text-sm font-black text-white uppercase tracking-[0.3em]">Deploy Settings</span>
            </div>
         </button>
      </div>
    </div>
  );
};

export default SuperSiteSettings;
