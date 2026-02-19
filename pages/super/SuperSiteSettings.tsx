
import React from 'react';

const SuperSiteSettings: React.FC = () => {
  return (
    <div className="max-w-4xl space-y-12 animate-fade-in">
       <div>
          <h2 className="text-3xl font-black tracking-tight mb-2 uppercase">Site Configuration</h2>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Global Branding & Asset Management</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Identity Block */}
          <div className="bg-zinc-900 p-10 rounded-[2.5rem] border border-white/5 space-y-8">
             <div className="flex items-center gap-4">
                <div className="size-12 bg-red-600 rounded-2xl flex items-center justify-center text-white"><span className="material-symbols-outlined">identity_platform</span></div>
                <h3 className="text-xl font-black">Identity</h3>
             </div>
             
             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Site Master Name</label>
                   <input type="text" defaultValue="Philippine JTV Association" className="w-full bg-black border-zinc-800 rounded-xl px-4 py-3 font-bold text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2 text-center">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-4">Official Logo</label>
                      <div className="size-24 mx-auto bg-black rounded-xl border border-dashed border-zinc-800 flex flex-col items-center justify-center gap-2 group cursor-pointer hover:border-red-500 transition-all">
                         <span className="material-symbols-outlined text-gray-600 group-hover:text-red-500">upload</span>
                         <span className="text-[8px] font-black">UPLOAD</span>
                      </div>
                   </div>
                   <div className="space-y-2 text-center">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-4">Favicon</label>
                      <div className="size-24 mx-auto bg-black rounded-xl border border-dashed border-zinc-800 flex flex-col items-center justify-center gap-2 group cursor-pointer hover:border-red-500 transition-all">
                         <span className="material-symbols-outlined text-gray-600 group-hover:text-red-500">upload</span>
                         <span className="text-[8px] font-black">UPLOAD</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* Communication Block */}
          <div className="bg-zinc-900 p-10 rounded-[2.5rem] border border-white/5 space-y-8">
             <div className="flex items-center gap-4">
                <div className="size-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white"><span className="material-symbols-outlined">public</span></div>
                <h3 className="text-xl font-black">Communication</h3>
             </div>
             <div className="space-y-4">
                <div className="flex items-center gap-4 bg-black p-4 rounded-xl">
                   <span className="material-symbols-outlined text-gray-500">phone</span>
                   <input type="text" placeholder="Main Phone" className="bg-transparent border-none flex-1 text-sm font-bold focus:ring-0" />
                </div>
                <div className="flex items-center gap-4 bg-black p-4 rounded-xl">
                   <span className="material-symbols-outlined text-gray-500">mail</span>
                   <input type="text" placeholder="Admin Email" className="bg-transparent border-none flex-1 text-sm font-bold focus:ring-0" />
                </div>
                <div className="flex items-center gap-4 bg-black p-4 rounded-xl">
                   <span className="material-symbols-outlined text-gray-500">link</span>
                   <input type="text" placeholder="Official SNS / Telegram" className="bg-transparent border-none flex-1 text-sm font-bold focus:ring-0" />
                </div>
             </div>
          </div>
       </div>

       <div className="bg-zinc-900 p-10 rounded-[2.5rem] border border-white/5 space-y-8">
          <div className="flex items-center gap-4">
             <div className="size-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-white"><span className="material-symbols-outlined">location_on</span></div>
             <h3 className="text-xl font-black">Office HQ Address</h3>
          </div>
          <textarea rows={2} className="w-full bg-black border-zinc-800 rounded-xl px-4 py-3 font-bold text-sm" placeholder="Enter physical address of the association..." />
       </div>

       <div className="bg-red-600 p-1 rounded-[2.5rem] shadow-[0_0_50px_rgba(220,38,38,0.2)]">
          <button className="w-full py-6 bg-black rounded-[2.4rem] font-black uppercase text-sm tracking-[0.3em] hover:bg-transparent transition-all">Deploy System Updates</button>
       </div>
    </div>
  );
};

export default SuperSiteSettings;
