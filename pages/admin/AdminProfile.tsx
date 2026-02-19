
import React, { useState } from 'react';
import { VENUES } from '../../constants';

const AdminProfile: React.FC = () => {
  const venue = VENUES[0];
  const [activeTab, setActiveTab] = useState('basic');

  return (
    <div className="max-w-5xl space-y-8">
       {/* Tab Switcher */}
       <div className="flex gap-4 border-b border-primary/10">
          {['basic', 'media', 'menu'].map(t => (
            <button 
               key={t} 
               onClick={() => setActiveTab(t)}
               className={`py-4 px-6 font-black text-xs uppercase tracking-widest border-b-2 transition-all ${activeTab === t ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-primary/50'}`}
            >
               {t} Settings
            </button>
          ))}
       </div>

       {activeTab === 'basic' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
            <div className="space-y-6">
               <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest">Venue Name</label>
                  <input type="text" defaultValue={venue.name} className="bg-white dark:bg-zinc-900 border-primary/10 rounded-xl px-4 py-3 font-bold" />
               </div>
               <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest">Main Phone</label>
                  <input type="text" defaultValue={venue.phone} className="bg-white dark:bg-zinc-900 border-primary/10 rounded-xl px-4 py-3 font-bold" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-black text-primary uppercase tracking-widest">Open Time</label>
                     <input type="time" defaultValue={venue.operatingHours?.open} className="bg-white dark:bg-zinc-900 border-primary/10 rounded-xl px-4 py-3 font-bold" />
                  </div>
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-black text-primary uppercase tracking-widest">Close Time</label>
                     <input type="time" defaultValue={venue.operatingHours?.close} className="bg-white dark:bg-zinc-900 border-primary/10 rounded-xl px-4 py-3 font-bold" />
                  </div>
               </div>
               <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest">Address</label>
                  <textarea rows={3} defaultValue={venue.address} className="bg-white dark:bg-zinc-900 border-primary/10 rounded-xl px-4 py-3 font-bold" />
               </div>
            </div>

            <div className="space-y-6">
               <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-primary/10 shadow-sm space-y-6">
                  <h4 className="text-lg font-black tracking-tight">Social & SNS Links</h4>
                  <div className="flex items-center gap-4 bg-blue-500/5 p-4 rounded-2xl">
                     <span className="material-symbols-outlined text-blue-500">send</span>
                     <input type="text" placeholder="Telegram @ID" defaultValue={venue.sns?.telegram} className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold" />
                  </div>
                  <div className="flex items-center gap-4 bg-yellow-500/5 p-4 rounded-2xl">
                     <span className="material-symbols-outlined text-yellow-600">chat_bubble</span>
                     <input type="text" placeholder="KakaoTalk ID" defaultValue={venue.sns?.kakao} className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold" />
                  </div>
                  <div className="flex items-center gap-4 bg-indigo-500/5 p-4 rounded-2xl">
                     <span className="material-symbols-outlined text-indigo-500">facebook</span>
                     <input type="text" placeholder="Facebook URL" className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold" />
                  </div>
               </div>
               <button className="w-full py-5 bg-primary text-[#1b180d] rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">Save Profile Changes</button>
            </div>
         </div>
       )}

       {activeTab === 'menu' && (
         <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-primary/10 text-center space-y-4 hover:border-primary transition-all cursor-pointer group">
                  <span className="material-symbols-outlined text-5xl text-gray-300 group-hover:text-primary">upload_file</span>
                  <h5 className="font-black uppercase tracking-widest text-xs">PDF Upload</h5>
               </div>
               <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-primary/10 text-center space-y-4 hover:border-primary transition-all cursor-pointer group">
                  <span className="material-symbols-outlined text-5xl text-gray-300 group-hover:text-primary">table_rows</span>
                  <h5 className="font-black uppercase tracking-widest text-xs">Excel Import</h5>
               </div>
               <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border-2 border-primary text-center space-y-4 transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-5xl text-primary">edit_note</span>
                  <h5 className="font-black uppercase tracking-widest text-xs">Web Editor</h5>
               </div>
            </div>
            
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-primary/10 shadow-sm min-h-[400px]">
               <div className="flex items-center justify-between mb-8 border-b border-primary/5 pb-4">
                  <div className="flex gap-2">
                     <button className="p-2 hover:bg-primary/10 rounded-lg"><span className="material-symbols-outlined">format_bold</span></button>
                     <button className="p-2 hover:bg-primary/10 rounded-lg"><span className="material-symbols-outlined">format_italic</span></button>
                     <button className="p-2 hover:bg-primary/10 rounded-lg"><span className="material-symbols-outlined">image</span></button>
                  </div>
                  <span className="text-[10px] font-black text-gray-400">EDITING: PREMIUM_DRINKS_v2</span>
               </div>
               <div className="prose prose-sm dark:prose-invert max-w-none focus:outline-none" contentEditable dangerouslySetInnerHTML={{ __html: venue.menu || '' }} />
            </div>
         </div>
       )}
    </div>
  );
};

export default AdminProfile;
