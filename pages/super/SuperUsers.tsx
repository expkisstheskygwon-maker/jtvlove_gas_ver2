
import React from 'react';

const SuperUsers: React.FC = () => {
  return (
    <div className="space-y-12 animate-fade-in">
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
             <h2 className="text-3xl font-black tracking-tight mb-2 uppercase">User Control Hub</h2>
             <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Global Membership Management</p>
          </div>
          <div className="flex gap-4">
             <div className="relative">
                <input type="text" placeholder="Search by UID or Nickname..." className="w-72 bg-zinc-900 border-zinc-800 rounded-2xl px-5 py-4 text-xs font-bold focus:ring-red-500" />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">search</span>
             </div>
             <button className="bg-zinc-800 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">Filter</button>
          </div>
       </div>

       {/* User Grid Cards */}
       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {[1,2,3,4,5,6].map(i => (
             <div key={i} className="bg-zinc-900 rounded-[2.5rem] p-8 border border-white/5 space-y-6 relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-6">
                   <span className={`size-3 rounded-full shadow-[0_0_10px_currentColor] ${i % 3 === 0 ? 'bg-red-500' : 'bg-green-500'}`}></span>
                </div>
                
                <div className="flex items-center gap-6">
                   <img src={`https://picsum.photos/200/200?random=${i+100}`} className="size-20 rounded-[2rem] object-cover" />
                   <div>
                      <h4 className="text-xl font-black">User_Name_{i}</h4>
                      <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">VIP Member</p>
                      <p className="text-xs text-gray-500 mt-1">UID: PH-848-120{i}</p>
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-3 border-y border-white/5 py-6">
                   <div className="text-center">
                      <p className="text-[8px] font-black text-gray-500 uppercase mb-1">Posts</p>
                      <p className="font-black text-sm">42</p>
                   </div>
                   <div className="text-center">
                      <p className="text-[8px] font-black text-gray-500 uppercase mb-1">Replies</p>
                      <p className="font-black text-sm">128</p>
                   </div>
                   <div className="text-center">
                      <p className="text-[8px] font-black text-gray-500 uppercase mb-1">Reports</p>
                      <p className="font-black text-sm text-red-500">0</p>
                   </div>
                </div>

                <div className="flex gap-2">
                   <button className="flex-1 py-3 bg-zinc-800 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-zinc-700">Audit History</button>
                   <button className="flex-1 py-3 bg-red-600/10 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Ban Access</button>
                </div>
                
                {/* Expand Hover Layer */}
                <div className="absolute inset-0 bg-red-600 flex flex-col items-center justify-center gap-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 p-8">
                   <h5 className="font-black uppercase tracking-widest">Privilege Control</h5>
                   <div className="w-full space-y-2">
                      <button className="w-full py-3 bg-black/30 rounded-lg text-[9px] font-black uppercase tracking-widest">Mute Comments (7D)</button>
                      <button className="w-full py-3 bg-black/30 rounded-lg text-[9px] font-black uppercase tracking-widest">Restrict Post (Perm)</button>
                      <button className="w-full py-3 bg-white text-black rounded-lg text-[9px] font-black uppercase tracking-widest">Cancel</button>
                   </div>
                </div>
             </div>
          ))}
       </div>
    </div>
  );
};

export default SuperUsers;
