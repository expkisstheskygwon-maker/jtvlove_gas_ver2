
import React, { useState } from 'react';
import { CCAS } from '../../constants';

const AdminCCAs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('current');

  return (
    <div className="space-y-10 animate-fade-in">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex gap-4 p-1.5 bg-white dark:bg-zinc-900 rounded-2xl border border-primary/10 w-fit">
             <button onClick={() => setActiveTab('current')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'current' ? 'bg-primary text-[#1b180d]' : 'text-gray-400 hover:text-primary'}`}>Current Staff</button>
             <button onClick={() => setActiveTab('applicants')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'applicants' ? 'bg-primary text-[#1b180d]' : 'text-gray-400 hover:text-primary'}`}>
                Applicants <span className="ml-1 bg-red-500 text-white text-[8px] px-1.5 rounded-full">3</span>
             </button>
          </div>
          <button className="h-14 bg-primary text-[#1b180d] px-8 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">Manually Register CCA</button>
       </div>

       {activeTab === 'current' && (
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {CCAS.map(cca => (
               <div key={cca.id} className="bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden border border-primary/5 shadow-sm group hover:border-primary transition-all">
                  <div className="h-32 bg-background-dark relative">
                     <div className="absolute inset-0 bg-gradient-to-t from-background-dark to-transparent opacity-60"></div>
                     <img src={cca.image} className="absolute -bottom-6 left-6 size-24 rounded-2xl object-cover border-4 border-white dark:border-zinc-900 shadow-xl" />
                  </div>
                  <div className="p-8 pt-10">
                     <div className="flex items-center justify-between mb-4">
                        <div>
                           <h4 className="text-xl font-black">{cca.nickname || cca.name}</h4>
                           <span className="text-[10px] font-black text-primary uppercase tracking-widest">Grade: {cca.grade}</span>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Performance</p>
                           <p className="font-black text-primary">{cca.points} Pts</p>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-primary/5 text-center">
                           <p className="text-[8px] font-black text-gray-400 uppercase">Bookings</p>
                           <p className="font-black">124</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-primary/5 text-center">
                           <p className="text-[8px] font-black text-gray-400 uppercase">Status</p>
                           <p className={`font-black uppercase text-[10px] ${cca.status === 'active' ? 'text-green-500' : 'text-gray-400'}`}>{cca.status}</p>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <button className="flex-1 py-3 border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-primary transition-all">Edit Score</button>
                        <button className="flex-1 py-3 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Dismiss</button>
                     </div>
                  </div>
               </div>
            ))}
         </div>
       )}

       {activeTab === 'applicants' && (
         <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 border border-primary/10 shadow-sm animate-fade-in">
            <h3 className="text-xl font-black mb-8 tracking-tight">New Recruitment Requests</h3>
            <div className="space-y-6">
               {[1,2,3].map(i => (
                 <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-8 bg-background-light dark:bg-white/5 rounded-3xl border border-primary/5 gap-6">
                    <div className="flex items-center gap-6">
                       <img src={`https://picsum.photos/200/200?random=${i+50}`} className="size-20 rounded-2xl object-cover" />
                       <div>
                          <h4 className="text-2xl font-black">Jane Doe {i}</h4>
                          <p className="text-sm font-bold text-gray-400">Former Venue: Up-Town JTV (3 Years Exp)</p>
                          <div className="flex gap-2 mt-2">
                             <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase">Japanese Level 2</span>
                             <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase">Vocals</span>
                          </div>
                       </div>
                    </div>
                    <div className="flex gap-3">
                       <button className="px-8 py-3 border border-red-500/20 text-red-500 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-red-500 hover:text-white transition-all">Decline</button>
                       <button className="px-8 py-3 bg-primary text-[#1b180d] rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all">Hire Now</button>
                    </div>
                 </div>
               ))}
            </div>
         </div>
       )}
    </div>
  );
};

export default AdminCCAs;
