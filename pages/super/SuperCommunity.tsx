
import React from 'react';

const SuperCommunity: React.FC = () => {
  return (
    <div className="space-y-12 animate-fade-in">
       <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black tracking-tight uppercase">Board Monitoring Center</h2>
          <button className="px-6 py-3 bg-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20">Create New Board</button>
       </div>

       {/* Detailed Board Metrics */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {['Free Board', 'JTV Review', 'CCA Review', 'Q&A'].map(name => (
             <div key={name} className="bg-zinc-900 rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col">
                <div className="p-10 flex-1">
                   <div className="flex justify-between items-start mb-10">
                      <div>
                         <h4 className="text-2xl font-black tracking-tight mb-2">{name}</h4>
                         <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Standard Category</p>
                      </div>
                      <div className="text-right">
                         <p className="text-3xl font-black text-primary">1,240</p>
                         <p className="text-[9px] font-bold text-gray-500 uppercase">Total Posts</p>
                      </div>
                   </div>
                   
                   <div className="space-y-6">
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2">Top Performance Posts</p>
                      {[1,2].map(i => (
                         <div key={i} className="flex items-center gap-4 group cursor-pointer">
                            <div className="size-10 bg-zinc-800 rounded-lg flex items-center justify-center font-black text-[10px]">{i}</div>
                            <div className="flex-1">
                               <p className="text-sm font-bold truncate group-hover:text-red-500 transition-colors">베스트 게시글의 제목이 여기에 표시됩니다 {i}</p>
                               <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Likes: 124 • Comments: 18</p>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
                
                <div className="bg-zinc-950 p-6 flex gap-4">
                   <button className="flex-1 py-4 bg-zinc-900 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800">Clear Reports</button>
                   <button className="flex-1 py-4 bg-zinc-900 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800">Board Config</button>
                </div>
             </div>
          ))}
       </div>
    </div>
  );
};

export default SuperCommunity;
