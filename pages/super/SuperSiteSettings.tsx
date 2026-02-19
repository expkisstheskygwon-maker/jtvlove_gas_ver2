
import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';

const SuperSiteSettings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    site_name: '',
    admin_phone: '',
    admin_email: '',
    admin_sns: '',
    hq_address: '',
    logo_url: '',
    favicon_url: ''
  });
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const data = await apiService.getSiteSettings();
        if (data) {
          setSettings({
            site_name: data.site_name || '',
            admin_phone: data.admin_phone || '',
            admin_email: data.admin_email || '',
            admin_sns: data.admin_sns || '',
            hq_address: data.hq_address || '',
            logo_url: data.logo_url || '',
            favicon_url: data.favicon_url || ''
          });
        }
      } catch (err) {
        console.error("Settings load failed", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const success = await apiService.updateSiteSettings(settings);
      if (success) {
        setMessage({ text: 'Site configuration updated successfully.', type: 'success' });
      } else {
        setMessage({ text: 'Failed to update settings. Please check your connection.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'A system error occurred while saving.', type: 'error' });
    } finally {
      setIsSaving(false);
      // 창을 닫지 않고 일정 시간 후 메시지만 제거
      setTimeout(() => setMessage(null), 5000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="size-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black uppercase tracking-widest text-red-500">Initializing Core Systems...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-12 animate-fade-in pb-24">
       <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight mb-2 uppercase">Site Configuration</h2>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Global Branding & Asset Management</p>
          </div>
          {message && (
            <div className={`px-6 py-3 rounded-xl text-xs font-bold animate-fade-in border ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
              {message.text}
            </div>
          )}
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Identity Block */}
          <div className="bg-zinc-900 p-10 rounded-[2.5rem] border border-white/5 space-y-8">
             <div className="flex items-center gap-4">
                <div className="size-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]"><span className="material-symbols-outlined">identity_platform</span></div>
                <h3 className="text-xl font-black">Identity</h3>
             </div>
             
             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Association Name</label>
                   <input 
                    type="text" 
                    value={settings.site_name} 
                    onChange={(e) => setSettings({...settings, site_name: e.target.value})}
                    placeholder="e.g. Philippine JTV Association"
                    className="w-full bg-black border-zinc-800 rounded-xl px-4 py-3 font-bold text-sm focus:ring-1 focus:ring-red-500 text-white" 
                   />
                </div>
                
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Logo URL</label>
                      <input 
                        type="url" 
                        value={settings.logo_url}
                        onChange={(e) => setSettings({...settings, logo_url: e.target.value})}
                        placeholder="https://example.com/logo.png"
                        className="w-full bg-black border-zinc-800 rounded-xl px-4 py-2 text-xs font-bold text-white focus:ring-1 focus:ring-red-500"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Favicon URL</label>
                      <input 
                        type="url" 
                        value={settings.favicon_url}
                        onChange={(e) => setSettings({...settings, favicon_url: e.target.value})}
                        placeholder="https://example.com/favicon.ico"
                        className="w-full bg-black border-zinc-800 rounded-xl px-4 py-2 text-xs font-bold text-white focus:ring-1 focus:ring-red-500"
                      />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2 text-center">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Logo Preview</label>
                      <div className="size-24 mx-auto bg-black rounded-xl border border-zinc-800 flex flex-col items-center justify-center overflow-hidden">
                         {settings.logo_url ? (
                            <img src={settings.logo_url} className="size-full object-contain p-2" alt="Logo" />
                         ) : (
                           <span className="text-[8px] font-black text-zinc-700">NO IMAGE</span>
                         )}
                      </div>
                   </div>
                   <div className="space-y-2 text-center">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Favicon Preview</label>
                      <div className="size-24 mx-auto bg-black rounded-xl border border-zinc-800 flex flex-col items-center justify-center overflow-hidden">
                        {settings.favicon_url ? (
                            <img src={settings.favicon_url} className="size-8 object-contain" alt="Favicon" />
                         ) : (
                           <span className="text-[8px] font-black text-zinc-700">NO ICON</span>
                         )}
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* Communication Block */}
          <div className="bg-zinc-900 p-10 rounded-[2.5rem] border border-white/5 space-y-8">
             <div className="flex items-center gap-4">
                <div className="size-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]"><span className="material-symbols-outlined">public</span></div>
                <h3 className="text-xl font-black">Communication</h3>
             </div>
             <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Official Hotline</label>
                   <div className="flex items-center gap-4 bg-black p-4 rounded-xl border border-zinc-800 focus-within:border-blue-500/50 transition-colors">
                      <span className="material-symbols-outlined text-gray-500">phone</span>
                      <input 
                       type="text" 
                       placeholder="Main Phone" 
                       value={settings.admin_phone}
                       onChange={(e) => setSettings({...settings, admin_phone: e.target.value})}
                       className="bg-transparent border-none flex-1 text-sm font-bold focus:ring-0 text-white" 
                      />
                   </div>
                </div>
                
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Administrative Email</label>
                   <div className="flex items-center gap-4 bg-black p-4 rounded-xl border border-zinc-800 focus-within:border-blue-500/50 transition-colors">
                      <span className="material-symbols-outlined text-gray-500">mail</span>
                      <input 
                       type="email" 
                       placeholder="Admin Email" 
                       value={settings.admin_email}
                       onChange={(e) => setSettings({...settings, admin_email: e.target.value})}
                       className="bg-transparent border-none flex-1 text-sm font-bold focus:ring-0 text-white" 
                      />
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Official SNS / Channel</label>
                   <div className="flex items-center gap-4 bg-black p-4 rounded-xl border border-zinc-800 focus-within:border-blue-500/50 transition-colors">
                      <span className="material-symbols-outlined text-gray-500">link</span>
                      <input 
                       type="text" 
                       placeholder="e.g. @phjtv_official" 
                       value={settings.admin_sns}
                       onChange={(e) => setSettings({...settings, admin_sns: e.target.value})}
                       className="bg-transparent border-none flex-1 text-sm font-bold focus:ring-0 text-white" 
                      />
                   </div>
                </div>
             </div>
          </div>
       </div>

       <div className="bg-zinc-900 p-10 rounded-[2.5rem] border border-white/5 space-y-8">
          <div className="flex items-center gap-4">
             <div className="size-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-white"><span className="material-symbols-outlined">location_on</span></div>
             <h3 className="text-xl font-black">Office HQ Address</h3>
          </div>
          <textarea 
            rows={2} 
            value={settings.hq_address}
            onChange={(e) => setSettings({...settings, hq_address: e.target.value})}
            className="w-full bg-black border-zinc-800 rounded-xl px-4 py-4 font-bold text-sm focus:ring-1 focus:ring-red-500 text-white resize-none" 
            placeholder="Enter physical address of the association..." 
          />
       </div>

       <div className="sticky bottom-8 z-50 bg-red-600 p-1 rounded-[2.5rem] shadow-[0_10px_50px_rgba(220,38,38,0.4)] transition-transform hover:scale-[1.01] active:scale-[0.99]">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-6 bg-black rounded-[2.4rem] font-black uppercase text-sm tracking-[0.3em] hover:bg-transparent transition-all flex items-center justify-center gap-4 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <span className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Deploying Changes...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">cloud_upload</span>
                <span>Deploy System Updates</span>
              </>
            )}
          </button>
       </div>
    </div>
  );
};

export default SuperSiteSettings;
