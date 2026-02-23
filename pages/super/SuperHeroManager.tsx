
import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { HeroSection } from '../../types';

const SuperHeroManager: React.FC = () => {
  const [heroSections, setHeroSections] = useState<HeroSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const loadHeroSections = async () => {
      setIsLoading(true);
      try {
        const data = await apiService.getHeroSections();
        setHeroSections(data);
      } catch (err) {
        console.error("Hero sections load failed", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadHeroSections();
  }, []);

  const handleAddSection = () => {
    if (heroSections.length >= 5) {
      alert("최대 5개까지만 추가할 수 있습니다.");
      return;
    }
    const newSection: HeroSection = {
      id: Date.now(),
      badge1: '',
      badge2: '',
      title: '',
      content: '',
      buttonText: '',
      buttonLink: '',
      imageUrl: '',
      displayOrder: heroSections.length
    };
    setHeroSections([...heroSections, newSection]);
  };

  const handleRemoveSection = (index: number) => {
    const newSections = heroSections.filter((_, i) => i !== index);
    setHeroSections(newSections);
  };

  const handleChange = (index: number, field: keyof HeroSection, value: string) => {
    const newSections = [...heroSections];
    newSections[index] = { ...newSections[index], [field]: value };
    setHeroSections(newSections);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const success = await apiService.updateHeroSections(heroSections);
      if (success) {
        setMessage({ text: '히어로 섹션 설정이 저장되었습니다.', type: 'success' });
      } else {
        setMessage({ text: '저장에 실패했습니다.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: '시스템 오류가 발생했습니다.', type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="size-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black uppercase tracking-widest text-primary">Loading Hero Config...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-12 animate-fade-in pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight mb-2 uppercase">Hero Section Manager</h2>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Dynamic Main Banner Configuration (Max 5)</p>
        </div>
        <button 
          onClick={handleAddSection}
          disabled={heroSections.length >= 5}
          className="px-6 py-3 bg-primary text-[#1b180d] rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50"
        >
          Add New Slide
        </button>
      </div>

      {message && (
        <div className={`px-6 py-3 rounded-xl text-xs font-bold animate-fade-in border ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-8">
        {heroSections.map((section, index) => (
          <div key={section.id} className="bg-zinc-900 p-8 rounded-[2rem] border border-white/5 relative group">
            <button 
              onClick={() => handleRemoveSection(index)}
              className="absolute top-6 right-6 size-8 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Text Content */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Badge 1 (Max 10)</label>
                    <input 
                      type="text" 
                      maxLength={10}
                      value={section.badge1}
                      onChange={(e) => handleChange(index, 'badge1', e.target.value)}
                      className="w-full bg-black border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Badge 2 (Max 10)</label>
                    <input 
                      type="text" 
                      maxLength={10}
                      value={section.badge2}
                      onChange={(e) => handleChange(index, 'badge2', e.target.value)}
                      className="w-full bg-black border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Main Title</label>
                  <input 
                    type="text" 
                    value={section.title}
                    onChange={(e) => handleChange(index, 'title', e.target.value)}
                    className="w-full bg-black border-zinc-800 rounded-xl px-4 py-3 text-lg font-black text-white focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Description Content</label>
                  <textarea 
                    rows={3}
                    value={section.content}
                    onChange={(e) => handleChange(index, 'content', e.target.value)}
                    className="w-full bg-black border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium text-gray-400 focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Button Text</label>
                    <input 
                      type="text" 
                      value={section.buttonText}
                      onChange={(e) => handleChange(index, 'buttonText', e.target.value)}
                      className="w-full bg-black border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Button Link</label>
                    <input 
                      type="text" 
                      value={section.buttonLink}
                      onChange={(e) => handleChange(index, 'buttonLink', e.target.value)}
                      className="w-full bg-black border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Right: Image Preview & URL */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Image URL (PNG recommended)</label>
                  <input 
                    type="text" 
                    value={section.imageUrl}
                    onChange={(e) => handleChange(index, 'imageUrl', e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-black border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold text-white focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="aspect-square bg-black rounded-2xl border border-zinc-800 flex items-center justify-center overflow-hidden p-4">
                  {section.imageUrl ? (
                    <img src={section.imageUrl} alt="Preview" className="max-w-full max-h-full object-contain drop-shadow-2xl" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-zinc-700">
                      <span className="material-symbols-outlined text-4xl">image</span>
                      <span className="text-[10px] font-black uppercase">No Image</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {heroSections.length === 0 && (
          <div className="py-20 bg-zinc-900/50 rounded-[2rem] border border-dashed border-zinc-800 flex flex-col items-center justify-center gap-4">
             <span className="material-symbols-outlined text-4xl text-zinc-700">view_carousel</span>
             <p className="text-sm font-bold text-zinc-500">No hero slides configured. Default CCA hero will be used.</p>
          </div>
        )}
      </div>

      <div className="sticky bottom-8 z-50 bg-primary p-1 rounded-[2.5rem] shadow-[0_10px_50px_rgba(238,189,43,0.4)] transition-transform hover:scale-[1.01] active:scale-[0.99]">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-6 bg-black rounded-[2.4rem] font-black uppercase text-sm tracking-[0.3em] hover:bg-transparent transition-all flex items-center justify-center gap-4 disabled:opacity-50 text-white"
        >
          {isSaving ? (
            <>
              <span className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Saving Configuration...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">save</span>
              <span>Save Hero Settings</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SuperHeroManager;
