
import React, { useState } from 'react';

const SuperPartners: React.FC = () => {
  const [activeType, setActiveType] = useState('venues');

  return (
    <div className="space-y-12 animate-fade-in">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex gap-4 p-1 bg-zinc-900 rounded-2xl border border-white/5 w-fit">
             {['venues', 'ccas', 'advertisers'].map(t => (
                <button 
                   key={t} 
                   onClick={() => setActiveType(t)}
                   className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeType === t ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-white'}`}
                >
                   {t}
                </button>
             ))}
          </div>
          <div className="flex gap-4">
             <div className="bg-zinc-900 px-6 py-3 rounded-xl border border-white/5 flex items-center gap-4">
                <p className="text-[9px] font-black text-gray-500 uppercase">Requests</p>
                <span className="bg-red-600 size-5 flex items-center justify-center rounded-full text-[9px] font-black">5</span>
             </div>
          </div>
       </div>

       {/* Data Table */}
       <div className="bg-zinc-900 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
             <thead>
                <tr className="bg-zinc-950/50">
                   <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Entity Name</th>
                   <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                   <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Association Date</th>
                   <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-white/5">
                {[1,2,3,4,5].map(i => (
                   <tr key={i} className="hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-4">
                            <div className="size-10 bg-zinc-800 rounded-lg flex items-center justify-center text-xs font-black">V{i}</div>
                            <div>
                               <p className="font-bold text-sm">Example Venue Name {i}</p>
                               <p className="text-[10px] text-gray-500 font-bold">Manila, Makati City</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                         <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[9px] font-black uppercase tracking-widest rounded-full border border-green-500/20">Active</span>
                      </td>
                      <td className="px-8 py-6 text-xs text-gray-400 font-bold uppercase">2023.10.24</td>
                      <td className="px-8 py-6 text-right">
                         <div className="flex items-center justify-end gap-2">
                            <button className="size-10 bg-zinc-800 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"><span className="material-symbols-outlined text-sm">edit</span></button>
                            <button className="size-10 bg-red-600/10 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"><span className="material-symbols-outlined text-sm">block</span></button>
                         </div>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );
};

export default SuperPartners;
