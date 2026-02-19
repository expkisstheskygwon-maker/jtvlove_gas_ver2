
import React from 'react';

const CCAProfileSettings: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in">
       {/* Insta-style Profile Header Editor */}
       <section className="flex flex-col md:flex-row items-center gap-10">
          <div className="relative group">
             <div className="size-40 md:size-48 rounded-full border-4 border-primary p-1 bg-white dark:bg-zinc-900 relative overflow-hidden shadow-2xl">
                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200/200" className="size-full rounded-full object-cover transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                   <span className="material-symbols-outlined text-white text-4xl">photo_camera</span>
                </div>
             </div>
             <button className="absolute bottom-2 right-2 size-10 bg-primary text-white rounded-full flex items-center justify-center border-4 border-[#faf9f6] dark:border-[#0f0e0b]">
                <span className="material-symbols-outlined">edit</span>
             </button>
          </div>
          <div className="flex-1 space-y-4 text-center md:text-left">
             <div className="flex flex-col md:flex-row items-center gap-4">
                <h2 className="text-3xl font-black">Yumi Kim</h2>
                <div className="flex gap-2">
                   <button className="px-6 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-black uppercase tracking-widest">Edit Profile</button>
                   <button className="px-6 py-2 bg-white dark:bg-zinc-900 border border-primary/10 rounded-xl text-xs font-black uppercase tracking-widest">Preview</button>
                </div>
             </div>
             <div className="flex justify-center md:justify-start gap-8">
                <div className="text-center md:text-left"><p className="text-xl font-black">42</p><p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Posts</p></div>
                <div className="text-center md:text-left"><p className="text-xl font-black">1.2K</p><p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Fans</p></div>
                <div className="text-center md:text-left"><p className="text-xl font-black">98%</p><p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Rate</p></div>
             </div>
          </div>
       </section>

       {/* Story Highlight Icons Style Sections */}
       <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Main Info */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-10 border border-primary/5 shadow-sm space-y-8">
             <div className="flex items-center gap-4">
                <div className="size-12 bg-pink-500/10 text-pink-500 rounded-2xl flex items-center justify-center"><span className="material-symbols-outlined">sparkles</span></div>
                <h3 className="text-xl font-black tracking-tight">Main Aesthetics</h3>
             </div>
             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">My One-Line Story</label>
                   <input type="text" placeholder="Share your vibe..." defaultValue="안녕하세요, 우아하고 따뜻한 유미입니다✨" className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl p-4 font-bold text-sm focus:ring-2 ring-primary/20" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">MBTI</label>
                      <select className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl p-4 font-bold text-sm">
                         <option>ENFJ</option>
                         <option>INFJ</option>
                         <option>ENTP</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Zodiac</label>
                      <select className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl p-4 font-bold text-sm">
                         <option>Cancer (게자리)</option>
                         <option>Leo (사자자리)</option>
                      </select>
                   </div>
                </div>
             </div>
          </div>

          {/* Lifestyle Info */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-10 border border-primary/5 shadow-sm space-y-8">
             <div className="flex items-center gap-4">
                <div className="size-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center"><span className="material-symbols-outlined">favorite</span></div>
                <h3 className="text-xl font-black tracking-tight">Personal Style</h3>
             </div>
             <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Ideal Style (선호 스타일)</label>
                   <input type="text" defaultValue="Dashing & Respectful" className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl p-4 font-bold text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Communication</label>
                      <select className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl p-4 font-bold text-sm">
                         <option>Expressive</option>
                         <option>Listener</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Pets</label>
                      <input type="text" defaultValue="Cat Person 🐱" className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl p-4 font-bold text-sm" />
                   </div>
                </div>
             </div>
          </div>
       </section>

       <section className="bg-primary/5 p-10 rounded-[3rem] border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
             <h4 className="text-2xl font-black">Premium Branding</h4>
             <p className="text-sm text-gray-500 font-bold mt-2">이곳에서 수정한 프로필은 연합회 메인 페이지에 하이라이트 됩니다.</p>
          </div>
          <button className="px-12 py-5 bg-primary text-[#1b180d] rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 hover:scale-105 transition-all">Update My Brand</button>
       </section>

       <div className="h-20"></div>
    </div>
  );
};

export default CCAProfileSettings;
