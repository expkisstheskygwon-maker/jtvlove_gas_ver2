
import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { Post } from '../../types';

interface BoardStat {
   id: string;
   name: string;
   totalPosts: number;
   newPostsToday: number;
   reports: number;
   featuredPosts: Post[];
}

interface BoardConfig {
   id: string;
   name: string;
}

const SuperCommunity: React.FC = () => {
   const [boardStats, setBoardStats] = useState<BoardStat[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
   const [editingBoard, setEditingBoard] = useState<BoardConfig | null>(null);
   const [newBoardName, setNewBoardName] = useState('');

   // In a real app, these would come from the database
   const [boardConfigs, setBoardConfigs] = useState<BoardConfig[]>(() => {
      const saved = localStorage.getItem('board_configs');
      return saved ? JSON.parse(saved) : [
         { id: 'Free Board', name: '커뮤니티' },
         { id: 'JTV Review', name: '업소 리뷰' },
         { id: 'CCA Review', name: 'CCA 리뷰' },
         { id: 'Q&A Board', name: '질문 게시판' }
      ];
   });

   useEffect(() => {
      localStorage.setItem('board_configs', JSON.stringify(boardConfigs));
      fetchBoardData();
   }, [boardConfigs]);

   const fetchBoardData = async () => {
      setIsLoading(true);
      const stats: BoardStat[] = [];

      for (const config of boardConfigs) {
         try {
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
               reports: 0,
               featuredPosts: posts.slice(0, 3)
            });
         } catch (error) {
            console.error(`Error fetching stats for ${config.id}:`, error);
         }
      }

      setBoardStats(stats);
      setIsLoading(false);
   };

   const handleCreateOrUpdateBoard = () => {
      if (!newBoardName.trim()) return;

      if (editingBoard) {
         setBoardConfigs(prev => prev.map(b => b.id === editingBoard.id ? { ...b, name: newBoardName } : b));
      } else {
         const newId = `Board_${Date.now()}`;
         setBoardConfigs(prev => [...prev, { id: newId, name: newBoardName }]);
      }

      setIsBoardModalOpen(false);
      setEditingBoard(null);
      setNewBoardName('');
   };

   const handleDeletePost = async (postId: string) => {
      if (!window.confirm('관리자 권한으로 이 게시물을 즉시 삭제하시겠습니까?')) return;
      const success = await apiService.deletePost(postId);
      if (success) {
         alert('삭제되었습니다.');
         fetchBoardData();
      }
   };

   const handleToggleSecret = async (post: Post) => {
      const isSecretNow = post.is_secret;
      const confirmMsg = isSecretNow
         ? '이 게시물을 일반 게시물로 전환하시겠습니까?'
         : '이 게시물을 비밀 게시물로 강제 전환하시겠습니까? (임시 비밀번호 0000 설정)';

      if (!window.confirm(confirmMsg)) return;

      const success = await apiService.updatePost(post.id, {
         is_secret: !isSecretNow,
         password: isSecretNow ? undefined : '0000'
      });

      if (success) {
         alert('설정이 변경되었습니다.');
         fetchBoardData();
      }
   };

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
                  <div key={board.id} className="bg-zinc-900/50 rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col group hover:border-red-500/20 transition-all shadow-2xl">
                     <div className="p-10 flex-1">
                        <div className="flex justify-between items-start mb-12">
                           <div className="flex-1">
                              <div className="flex items-center gap-4 mb-2">
                                 <div className="w-1.5 h-6 bg-red-600 rounded-full"></div>
                                 <h4 className="text-2xl font-black tracking-tight">{board.name}</h4>
                                 <button
                                    onClick={() => {
                                       setEditingBoard({ id: board.id, name: board.name });
                                       setNewBoardName(board.name);
                                       setIsBoardModalOpen(true);
                                    }}
                                    className="size-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                                 >
                                    <span className="material-symbols-outlined text-sm text-gray-400">edit</span>
                                 </button>
                              </div>
                              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-5 opacity-50">{board.id}</p>
                           </div>
                           <div className="flex gap-6">
                              <div className="text-right border-r border-white/5 pr-6">
                                 <p className="text-3xl font-black text-white">{board.totalPosts.toLocaleString()}</p>
                                 <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter mt-1">Total Posts</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-3xl font-black text-primary">{board.newPostsToday > 0 ? `+${board.newPostsToday}` : '0'}</p>
                                 <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter mt-1">Today</p>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <div className="flex items-center justify-between border-b border-white/5 pb-3">
                              <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Latest Management Feed</p>
                           </div>

                           {board.featuredPosts.length > 0 ? (
                              board.featuredPosts.map((post, i) => (
                                 <div key={post.id} className="flex items-center gap-5 p-4 rounded-2xl hover:bg-white/5 transition-all group/item">
                                    <div className="size-10 bg-zinc-950 rounded-xl flex items-center justify-center font-black text-[10px] border border-white/5 shrink-0">{i + 1}</div>
                                    <div className="flex-1 min-w-0">
                                       <div className="flex items-center gap-2">
                                          {post.is_secret && <span className="material-symbols-outlined text-xs text-red-500">lock</span>}
                                          <p className="text-sm font-bold truncate text-gray-200">{post.title}</p>
                                       </div>
                                       <div className="flex items-center gap-3 mt-1 opacity-60">
                                          <p className="text-[9px] font-black uppercase text-gray-400">{post.author}</p>
                                          <span className="text-gray-700">|</span>
                                          <p className="text-[9px] font-black uppercase text-gray-500">{post.views} VIEWS</p>
                                       </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                       <button
                                          onClick={() => handleToggleSecret(post)}
                                          className="size-9 bg-zinc-800 rounded-xl flex items-center justify-center hover:bg-white/10"
                                          title={post.is_secret ? "비밀글 해제" : "비밀글 강제 설정"}
                                       >
                                          <span className={`material-symbols-outlined text-sm ${post.is_secret ? 'text-green-500' : 'text-gray-400'}`}>
                                             {post.is_secret ? 'lock_open' : 'lock'}
                                          </span>
                                       </button>
                                       <button
                                          onClick={() => handleDeletePost(post.id)}
                                          className="size-9 bg-zinc-800 rounded-xl flex items-center justify-center hover:bg-red-500/20 group/del"
                                       >
                                          <span className="material-symbols-outlined text-sm text-gray-400 group-hover/del:text-red-500">delete</span>
                                       </button>
                                       <button className="size-9 bg-red-600 rounded-xl flex items-center justify-center hover:scale-110 transition-transform">
                                          <span className="material-symbols-outlined text-sm text-white">chevron_right</span>
                                       </button>
                                    </div>
                                 </div>
                              ))
                           ) : (
                              <div className="py-12 text-center bg-zinc-950/50 rounded-[2rem] border border-dashed border-white/5">
                                 <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">No content history in this node</p>
                              </div>
                           )}
                        </div>
                     </div>

                     <div className="bg-zinc-950/50 p-6 flex gap-4 border-t border-white/5">
                        <button className="flex-1 py-4 bg-zinc-900/50 border border-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2">
                           <span className="material-symbols-outlined text-sm text-gray-500">article</span>
                           All Posts
                        </button>
                        <button className="flex-1 py-4 bg-zinc-900/50 border border-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 text-primary">
                           <span className="material-symbols-outlined text-sm">settings</span>
                           Board Config
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         )}

         {/* Board CRUD Modal */}
         {isBoardModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-fade-in">
               <div className="bg-zinc-900 w-full max-w-md rounded-[2.5rem] border border-white/10 shadow-3xl overflow-hidden">
                  <div className="bg-zinc-950 p-8 border-b border-white/5">
                     <h4 className="text-xl font-black uppercase italic tracking-tight italic">
                        {editingBoard ? 'Edit Board Node' : 'Initialize New Node'}
                     </h4>
                  </div>
                  <div className="p-8 space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Display Name</label>
                        <input
                           type="text"
                           value={newBoardName}
                           onChange={(e) => setNewBoardName(e.target.value)}
                           className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-red-500 transition-colors"
                           placeholder="Enter board title..."
                        />
                     </div>
                     <div className="flex gap-4 pt-4">
                        <button
                           onClick={() => { setIsBoardModalOpen(false); setEditingBoard(null); }}
                           className="flex-1 h-14 bg-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                        >
                           Cancel
                        </button>
                        <button
                           onClick={handleCreateOrUpdateBoard}
                           className="flex-1 h-14 bg-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-600/20"
                        >
                           Confirm Node
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default SuperCommunity;
