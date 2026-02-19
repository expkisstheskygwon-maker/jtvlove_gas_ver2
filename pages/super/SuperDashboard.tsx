
import React from 'react';

const SuperDashboard: React.FC = () => {
  const mainStats = [
    { label: 'Active Venues', value: '42', delta: '+2', icon: 'apartment', color: 'text-blue-500' },
    { label: 'Pending Venues', value: '05', delta: 'Requires Action', icon: 'pending_actions', color: 'text-orange-500' },
    { label: 'Total CCAs', value: '584', delta: '+15', icon: 'groups', color: 'text-primary' },
    { label: 'Active Advertisers', value: '12', delta: '85% Slots Taken', icon: 'campaign', color: 'text-green-500' }
  ];

  return (
    <div className="space-y-12 animate-fade-in">
       {/* Real-time Ticker Simulation */}
       <div className="bg-red-950/30 border border-red-500/20 p-4 rounded-xl flex items-center gap-4">
          <span className="text-[10px] font-black bg-red-600 px-2 py-0.5 rounded text-white animate-pulse">LIVE ALERT</span>
          <p className="text-xs font-bold text-red-200 truncate">New venue 'Diamond Luxe Manila' has requested association membership. Verification needed.</p>
       </div>

       {/* Grid Metrics */}
       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {mainStats.map(stat => (
            <div key={stat.label} className="bg-zinc-900 border border-white/5 p-8 rounded-[2rem] hover:border-red-500/30 transition-all group">
               <div className="flex items-center justify-between mb-4">
                  <div className={`size-12 rounded-2xl bg-zinc-800 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                     <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
                  </div>
                  <button className="text-[10px] font-black uppercase text-gray-500 hover:text-white">Detail</button>
               </div>
               <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
               <p className="text-4xl font-black tracking-tighter mb-2">{stat.value}</p>
               <p className="text-[10px] font-bold text-gray-400">{stat.delta}</p>
            </div>
          ))}
       </div>

       {/* Community & Traffic Grid */}
       <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-8 space-y-8">
             <div className="flex items-center justify-between">
                <h3 className="text-xl font-black uppercase tracking-tight">Board Activity Monitoring</h3>
                <div className="flex gap-2">
                   <div className="px-3 py-1 bg-zinc-900 border border-white/5 rounded-lg text-[10px] font-black">ALL BOARDS</div>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['Free Board', 'Venue Review', 'CCA Review', 'QA Center'].map(board => (
                   <div key={board} className="bg-zinc-900 rounded-[2rem] p-6 border border-white/5 overflow-hidden">
                      <div className="flex items-center justify-between mb-6">
                         <h4 className="font-black text-xs uppercase tracking-widest text-primary">{board}</h4>
                         <span className="text-[10px] font-bold opacity-40">12 NEW TODAY</span>
                      </div>
                      <div className="space-y-4">
                         {[1,2,3].map(i => (
                            <div key={i} className="flex items-center justify-between text-xs border-b border-white/5 pb-3 last:border-0">
                               <p className="truncate flex-1 font-medium text-gray-400 group-hover:text-white cursor-pointer">최신 게시글 제목 예시입니다 {i}...</p>
                               <span className="text-[9px] opacity-30 font-bold ml-4 whitespace-nowrap">2m ago</span>
                            </div>
                         ))}
                      </div>
                      <button className="w-full mt-6 py-3 bg-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all">Go to Management</button>
                   </div>
                ))}
             </div>
          </div>

          <div className="xl:col-span-4 bg-zinc-900 rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden">
             <div className="absolute top-0 right-0 size-64 bg-red-600/5 rounded-full blur-[100px]"></div>
             <h3 className="text-xl font-black uppercase tracking-tight mb-8">System Health</h3>
             <div className="space-y-8">
                <div>
                   <div className="flex justify-between text-[10px] font-black uppercase mb-2"><span>Server Load</span><span className="text-green-500">Normal</span></div>
                   <div className="h-1 bg-zinc-800 rounded-full"><div className="h-full w-[24%] bg-green-500"></div></div>
                </div>
                <div>
                   <div className="flex justify-between text-[10px] font-black uppercase mb-2"><span>Repo Sync</span><span className="text-purple-500">Verified</span></div>
                   <div className="h-1 bg-zinc-800 rounded-full"><div className="h-full w-full bg-purple-500"></div></div>
                   <p className="text-[8px] font-bold mt-1 text-purple-400">jtvlove_gas_ver1.git (Master)</p>
                </div>
                <div className="pt-4 space-y-4">
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2">Global Settings Summary</p>
                   <div className="flex justify-between items-center text-xs">
                      <span className="opacity-50">Auto-Approval CCAs</span>
                      <div className="size-10 bg-zinc-800 rounded-full flex items-center justify-center text-[8px] font-black text-red-500">OFF</div>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                      <span className="opacity-50">Community Write Protection</span>
                      <div className="size-10 bg-zinc-800 rounded-full flex items-center justify-center text-[8px] font-black text-green-500">OFF</div>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default SuperDashboard;
