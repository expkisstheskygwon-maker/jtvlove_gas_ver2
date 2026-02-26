
import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { Post } from '../../types';

interface BoardStats {
   id: string;
   name: string;
   totalPosts: number;
   newPostsToday: number;
   reports: number;
   featuredPosts: Post[];
}

const SuperCommunity: React.FC = () => {
   const [boardStats, setBoardStats] = useState<BoardStats[]>([]);
   const [isLoading, setIsLoading] = useState(true);

   const boardConfigs = [
      { id: 'Free Board', name: '자유 게시판' },
      { id: 'JTV Review', name: '업소 리뷰' },
      { id: 'CCA Review', name: 'CCA 리뷰' },
      { id: 'Q&A Board', name: '질문 게시판' }
   ];

   const fetchBoardData = async () => {
      setIsLoading(true);
      const stats: BoardStats[] = [];

      for (const config of boardConfigs) {
         const posts = await apiService.getPosts(config.id);
         stats.push({
            id: config.id,
            name: config.name,
            totalPosts: posts.length,
            newPostsToday: posts.filter(p => {
               if (!p.created_at) return false;
               const today = new Date().toISOString().split('T')[0];
               return p.created_at.startsWith(today);
            }).length,
            reports: Math.floor(Math.random() * 5), // Mock reports for now
            featuredPosts: posts.slice(0, 3)
         });
      }

      setBoardStats(stats);
      setIsLoading(false);
   };

   useEffect(() => {
      fetchBoardData();
   }, []);

   return (
      <div className="space-y-12 animate-fade-in text-white">
         {/* Page Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-10">
            <div>
               <h2 className="text-4xl font-black tracking-tight uppercase italic flex items-center gap-3">
                  <span className="material-symbols-outlined text-red-500 text-4xl">analytics</span>
                  Board Center
               </h2>
               <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 ml-1">Centralized board monitoring and moderation system</p>
            </div>
            <div className="flex gap-3">
               <button className="px-6 py-4 bg-zinc-900 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">settings_backup_restore</span>
                  Rebuild Cache
               </button>
               <button className="px-8 py-4 bg-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-600/20 hover:scale-105 active:scale-95 transition-all">
                  Create New Board
               </button>
            </div>
         </div>

         {/* Quick Stats Grid */}
         {isLoading ? (
            <div className="py-20 flex flex-col items-center gap-4">
               <div className="size-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
               <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Gathering board metrics...</p>
            </div>
         ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {boardStats.map(board => (
                  <div key={board.id} className="bg-zinc-900/50 rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col group hover:border-red-500/20 transition-all">
                     <div className="p-10 flex-1">
                        <div className="flex justify-between items-start mb-12">
                           <div>
                              <div className="flex items-center gap-2 mb-2">
                                 <div className="w-1.5 h-6 bg-red-600"></div>
                                 <h4 className="text-2xl font-black tracking-tight">{board.name}</h4>
                              </div>
                              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-3">{board.id}</p>
                           </div>
                           <div className="flex gap-4">
                              <div className="text-right border-r border-white/5 pr-4">
                                 <p className="text-3xl font-black text-white">{board.totalPosts.toLocaleString()}</p>
                                 <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter mt-1">Total Posts</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-3xl font-black text-primary">{board.newPostsToday > 0 ? `+${board.newPostsToday}` : '0'}</p>
                                 <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter mt-1">Today</p>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-6">
                           <div className="flex items-center justify-between border-b border-white/5 pb-3">
                              <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Latest Content Feed</p>
                              {board.reports > 0 && (
                                 <span className="px-2 py-0.5 bg-red-600 text-white text-[8px] font-black rounded uppercase flex items-center gap-1 animate-pulse">
                                    <span className="material-symbols-outlined text-[10px]">warning</span>
                                    {board.reports} Unresolved Reports
                                 </span>
                              )}
                           </div>

                           {board.featuredPosts.length > 0 ? (
                              board.featuredPosts.map((post, i) => (
                                 <div key={post.id} className="flex items-center gap-5 group/item cursor-pointer">
                                    <div className="size-12 bg-zinc-950 rounded-2xl flex items-center justify-center font-black text-[10px] border border-white/5 group-hover/item:border-red-500/30 transition-all">{i + 1}</div>
                                    <div className="flex-1 min-w-0">
                                       <p className="text-sm font-bold truncate group-hover/item:text-red-500 transition-colors">{post.title}</p>
                                       <div className="flex items-center gap-2 mt-1.5">
                                          <p className="text-[9px] text-gray-400 font-bold uppercase">{post.author}</p>
                                          <span className="text-[8px] text-gray-600">•</span>
                                          <p className="text-[9px] text-gray-500 font-bold uppercase">{post.views || 0} VIEWS</p>
                                       </div>
                                    </div>
                                    <span className="material-symbols-outlined text-gray-700 group-hover/item:text-white transition-colors">arrow_forward_ios</span>
                                 </div>
                              ))
                           ) : (
                              <div className="py-8 text-center bg-zinc-950/50 rounded-3xl border border-dashed border-white/5">
                                 <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">No posts available</p>
                              </div>
                           )}
                        </div>
                     </div>

                     <div className="bg-zinc-950/80 p-6 flex gap-4 backdrop-blur-md">
                        <button className="flex-1 py-4 bg-zinc-900 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 group/btn">
                           <span className="material-symbols-outlined text-sm text-gray-500 group-hover/btn:text-red-500">priority_high</span>
                           Mod Logs
                        </button>
                        <button className="flex-1 py-4 bg-zinc-900 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 group/btn">
                           <span className="material-symbols-outlined text-sm text-gray-500 group-hover/btn:text-primary">settings_suggest</span>
                           Board Config
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         )}

         {/* System Notification/Alerts */}
         <div className="bg-red-900/10 border border-red-500/20 rounded-[2rem] p-10 flex flex-col md:flex-row items-center gap-8 shadow-2xl shadow-red-500/5">
            <div className="size-20 bg-red-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-red-600/30">
               <span className="material-symbols-outlined text-4xl text-white font-black">gavel</span>
            </div>
            <div className="flex-1 text-center md:text-left">
               <h4 className="text-xl font-black tracking-tight mb-2">Notice: Global Spam Protection is ON</h4>
               <p className="text-xs font-bold text-gray-400 leading-relaxed max-w-2xl">The automatic spam filtration system is currently active across all boards. Posts with suspicious patterns or multiple reports are being automatically quarantined for review.</p>
            </div>
            <button className="px-10 py-5 bg-white text-zinc-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">View Quarantine</button>
         </div>
      </div>
   );
};

export default SuperCommunity;
