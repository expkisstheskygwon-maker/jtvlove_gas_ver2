import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { Post } from '../types';

const Community: React.FC = () => {
   const [searchParams, setSearchParams] = useSearchParams();
   const boardId = searchParams.get('board') || 'Free Board';
   const [posts, setPosts] = useState<Post[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState('');
   const [searchType, setSearchType] = useState('title');
   const [sortBy, setSortBy] = useState('recent'); // 'recent', 'popular', 'comments'

   // Modal States
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [formData, setFormData] = useState({
      title: '',
      board: boardId,
      category: '',
      content: '',
      image: '',
      is_secret: false,
      password: ''
   });

   const [boards, setBoards] = useState<any[]>([
      { id: 'Free Board', name: '커뮤니티', categories: ['잡담', '정보', '모임', '질문', 'TEST1'] },
      { id: 'JTV Review', name: '업소 리뷰', categories: ['파사이', '말라떼', '퀘존', '마카티'] },
      { id: 'CCA Review', name: 'CCA 리뷰', categories: ['Ace', 'Pro', 'Cute'] },
      { id: 'Q&A Board', name: '질문 게시판', categories: ['이용문의', '업소문의', '예약문의'] }
   ]);

   const loadBoards = async () => {
      try {
         const data = await apiService.getBoardConfigs();
         const baseBoards = (data && data.length > 0) ? data : [
            { id: 'Free Board', name: '커뮤니티' },
            { id: 'JTV Review', name: '업소 리뷰' },
            { id: 'CCA Review', name: 'CCA 리뷰' },
            { id: 'Q&A Board', name: '질문 게시판' }
         ];

         const boardsWithDefaults = baseBoards.map((b: any) => ({
            ...b,
            categories: (b.categories && b.categories.length > 0) ? b.categories : (
               b.id === 'Free Board' ? ['잡담', '정보', '모임', '질문', 'TEST1'] :
                  b.id === 'JTV Review' ? ['파사이', '말라떼', '퀘존', '마카티'] :
                     b.id === 'CCA Review' ? ['Ace', 'Pro', 'Cute'] :
                        b.id === 'Q&A Board' ? ['이용문의', '업소문의', '예약문의'] : ['일반']
            )
         }));
         setBoards(boardsWithDefaults);
      } catch (error) {
         console.error('loadBoards error:', error);
      }
   };

   useEffect(() => {
      loadBoards();
   }, []);

   const currentBoard = boards.find((b: any) => b.id === boardId) || boards[0];

   useEffect(() => {
      if (currentBoard) {
         const firstCategory = currentBoard?.categories?.[0] || '일반';
         setFormData(prev => ({ ...prev, category: firstCategory, board: boardId }));
      }
   }, [boardId, currentBoard]);

   const fetchPosts = async () => {
      setIsLoading(true);
      try {
         // Fetch all posts for the board
         const data = await apiService.getPosts(boardId);

         let sortedData = [...data];
         if (sortBy === 'popular') {
            sortedData.sort((a, b) => (b.likes || 0) - (a.likes || 0));
         } else if (sortBy === 'comments') {
            sortedData.sort((a, b) => (b.commentsCount || 0) - (a.commentsCount || 0));
         } else {
            // recent sorting logic with safe date parsing
            sortedData.sort((a, b) => {
               const dateB = new Date((b.created_at || '0').toString().replace(/\./g, '-')).getTime();
               const dateA = new Date((a.created_at || '0').toString().replace(/\./g, '-')).getTime();
               return dateB - dateA;
            });
         }

         setPosts(sortedData);
      } catch (error) {
         console.error('Fetch posts error:', error);
      }
      setIsLoading(false);
   };

   useEffect(() => {
      fetchPosts();
   }, [boardId, sortBy]);

   if (!currentBoard) {
      return (
         <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <div className="size-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Initializing Feed Node...</p>
         </div>
      );
   }

   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         const reader = new FileReader();
         reader.onloadend = () => {
            setFormData(prev => ({ ...prev, image: reader.result as string }));
         };
         reader.readAsDataURL(file);
      }
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.title || !formData.content) return alert('모든 필드를 입력해주세요.');
      if (formData.is_secret && !formData.password) return alert('비밀글로 설정하려면 비밀번호를 입력해주세요.');

      setIsSubmitting(true);
      try {
         const result = await apiService.createPost({
            ...formData,
            author: '길동이', // Mock user
            authorAvatar: 'https://picsum.photos/100/100?random=1'
         });

         if (result) {
            setFormData({
               title: '',
               board: boardId,
               category: currentBoard?.categories?.find((c: string) => c !== '전체') || '일반',
               content: '',
               image: '',
               is_secret: false,
               password: ''
            });
            setIsModalOpen(false);
            fetchPosts();
         }
      } catch (error: any) {
         console.error('Submit handling error:', error);
         alert(`게시글 등록에 실패했습니다.\n사유: ${error.message || '알 수 없는 오류'}`);
      }
      setIsSubmitting(false);
   };

   const formatDate = (dateStr?: string) => {
      if (!dateStr) return '';
      try {
         const date = new Date(dateStr.replace(/\./g, '-'));
         if (isNaN(date.getTime())) return dateStr;
         return date.toISOString().split('T')[0];
      } catch (e) {
         return dateStr || '';
      }
   };

   return (
      <div className="max-w-[1440px] mx-auto px-4 py-12 animate-fade-in text-zinc-900 dark:text-zinc-100">
         {/* Board Selector Tabs (Dynamic) */}
         <div className="flex border-b border-zinc-200 dark:border-white/5 mb-12 overflow-x-auto no-scrollbar scroll-smooth">
            {boards.map((b: any) => (
               <button
                  key={b.id}
                  onClick={() => setSearchParams({ board: b.id })}
                  className={`px-10 py-5 text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all relative group ${boardId === b.id ? 'text-primary' : 'text-gray-400 hover:text-zinc-600 dark:hover:text-zinc-200'}`}
               >
                  <span className="relative z-10">{b.name}</span>
                  {boardId === b.id ? (
                     <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-4px_12px_rgba(240,185,11,0.3)]"></div>
                  ) : (
                     <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-zinc-300 dark:bg-white/20 group-hover:w-full transition-all duration-300"></div>
                  )}
               </button>
            ))}
         </div>

         {/* Header Section */}
         <div className="flex flex-col md:flex-row justify-between items-baseline mb-8 pb-6 gap-4">
            <div>
               <h2 className="text-5xl font-black tracking-tight uppercase italic">{currentBoard.name}</h2>
               <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <Link to="/" className="hover:text-primary transition-colors">HOME</Link>
                  <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                  <span className="text-zinc-900 dark:text-white uppercase">{currentBoard.name}</span>
               </div>
            </div>
            <Link to="/community" className="text-[10px] font-black text-gray-400 hover:text-primary transition-colors flex items-center gap-1 group">
               <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">keyboard_return</span>
               RETURN TO PREVIOUS PAGE
            </Link>
         </div>

         {/* Navigation & Search Panel */}
         <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div className="flex flex-wrap gap-1 bg-zinc-100 dark:bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-inner">
               <button
                  onClick={() => setSortBy('recent')}
                  className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${sortBy === 'recent' ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-xl scale-105' : 'hover:bg-zinc-200 dark:hover:bg-white/10 text-gray-500'}`}
               >
                  최근글
               </button>
               <button
                  onClick={() => setSortBy('popular')}
                  className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${sortBy === 'popular' ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-xl scale-105' : 'hover:bg-zinc-200 dark:hover:bg-white/10 text-gray-500'}`}
               >
                  인기글
               </button>
               <button
                  onClick={() => setSortBy('comments')}
                  className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${sortBy === 'comments' ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-xl scale-105' : 'hover:bg-zinc-200 dark:hover:bg-white/10 text-gray-500'}`}
               >
                  댓글순
               </button>
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto">
               <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl px-5 py-3 text-[11px] font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
               >
                  <option value="title">제목</option>
                  <option value="content">내용</option>
                  <option value="author">작성자</option>
               </select>
               <div className="relative flex-1 lg:w-72">
                  <input
                     type="text"
                     placeholder="검색어를 입력하세요"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl px-6 py-3 text-[11px] font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                  />
               </div>
               <button className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 px-10 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-lg">
                  검색
               </button>
            </div>
         </div>

         {/* Board List Table */}
         <div className="bg-white dark:bg-zinc-900/30 rounded-[2.5rem] border border-zinc-200 dark:border-white/5 overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                     <tr className="bg-zinc-50/50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-white/5">
                        <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest w-24 text-center">번호</th>
                        <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">제목</th>
                        <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest w-40 text-center">작성자</th>
                        <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest w-40 text-center">날짜</th>
                        <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest w-24 text-center">조회</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                     {isLoading ? (
                        <tr>
                           <td colSpan={5} className="py-32 text-center">
                              <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-xl"></div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Synchronizing Data Node...</p>
                           </td>
                        </tr>
                     ) : posts.length > 0 ? (
                        posts.map((post, index) => (
                           <tr key={post.id} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-all group cursor-pointer">
                              <td className="px-8 py-6 text-[11px] font-bold text-gray-400 text-center">{posts.length - index}</td>
                              <td className="px-8 py-6">
                                 <Link to={`/community/post/${post.id}`} className="flex items-center gap-3 group-hover:translate-x-2 transition-transform duration-300">
                                    {post.category && (
                                       <span className="text-[9px] font-black font-mono text-primary uppercase tracking-tighter bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                                          {post.category}
                                       </span>
                                    )}
                                    <span className={`text-sm font-bold group-hover:text-primary transition-colors flex items-center gap-2 ${post.is_secret ? 'text-gray-400' : 'text-zinc-950 dark:text-white'}`}>
                                       {!!post.is_secret && <span className="material-symbols-outlined text-base">lock</span>}
                                       {post.is_secret ? '비밀글입니다.' : post.title}
                                    </span>
                                    {post.commentsCount !== undefined && post.commentsCount > 0 && (
                                       <span className="text-[10px] font-black text-primary px-1.5 py-0.5 bg-primary/10 rounded-full">+{post.commentsCount}</span>
                                    )}
                                    {post.image && <span className="material-symbols-outlined text-base text-gray-300 group-hover:text-primary transition-colors">image</span>}
                                 </Link>
                              </td>
                              <td className="px-8 py-6 text-[11px] font-bold text-center text-zinc-600 dark:text-zinc-400">{post.author}</td>
                              <td className="px-8 py-6 text-[11px] font-bold text-gray-400 text-center tracking-tighter">{formatDate(post.created_at)}</td>
                              <td className="px-8 py-6 text-[11px] font-bold text-gray-400 text-center">
                                 <div className="flex items-center justify-center gap-1.5">
                                    <span className="material-symbols-outlined text-xs">visibility</span>
                                    {post.views || 0}
                                 </div>
                              </td>
                           </tr>
                        ))
                     ) : (
                        <tr>
                           <td colSpan={5} className="py-32 text-center">
                              <span className="material-symbols-outlined text-6xl text-gray-200 dark:text-white/5 mb-4">inbox_customize</span>
                              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">등록된 게시물이 없습니다.</p>
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Write Button Overlay */}
         <div className="fixed bottom-10 right-10 z-40 group">
            <button
               onClick={() => setIsModalOpen(true)}
               className="bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 px-8 h-16 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
            >
               <span className="material-symbols-outlined">edit_note</span>
               WRITE POST
            </button>
         </div>

         {/* Write Modal - Reused from previous logic but with enhanced design */}
         {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-fade-in">
               <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-xl" onClick={() => setIsModalOpen(false)}></div>
               <div className="relative bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] border border-white/10 shadow-2xl animate-scale-up">
                  <div className="sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-10 py-8 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center z-10">
                     <div>
                        <h3 className="text-3xl font-black uppercase italic tracking-tight">Create New Post</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Share your thoughts with the community</p>
                     </div>
                     <button onClick={() => setIsModalOpen(false)} className="size-12 rounded-2xl hover:bg-zinc-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors">
                        <span className="material-symbols-outlined">close</span>
                     </button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-10 space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-1">Board Section</label>
                           <div className="px-6 py-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/10 text-sm font-black text-primary">
                              {currentBoard.name}
                           </div>
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-1">Category</label>
                           <select
                              className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                              value={formData.category}
                              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                           >
                              {currentBoard.categories.map((cat: string) => (
                                 <option key={cat} value={cat}>{cat}</option>
                              ))}
                           </select>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-1">Post Title</label>
                        <input
                           type="text"
                           placeholder="Enter your title here..."
                           className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 rounded-2xl px-8 py-5 text-lg font-black outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                           value={formData.title}
                           onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        />
                     </div>

                     <div className="space-y-3 text-right">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-1 block text-left">Content</label>
                        <textarea
                           placeholder="Write something amazing..."
                           className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 rounded-[2rem] px-8 py-8 text-base font-medium outline-none focus:ring-4 focus:ring-primary/10 transition-all min-h-[300px] resize-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                           value={formData.content}
                           onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        ></textarea>

                        <div className="inline-block relative">
                           <input
                              type="file"
                              id="image-upload"
                              className="hidden"
                              accept="image/*"
                              onChange={handleImageChange}
                           />
                           <label
                              htmlFor="image-upload"
                              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:opacity-90 active:scale-95 transition-all"
                           >
                              <span className="material-symbols-outlined text-sm">image</span>
                              ATTACH IMAGE
                           </label>
                        </div>
                     </div>

                     {formData.image && (
                        <div className="relative rounded-3xl overflow-hidden border border-zinc-100 dark:border-white/10 group">
                           <img src={formData.image} alt="Preview" className="w-full h-auto max-h-[400px] object-contain bg-zinc-50 dark:bg-zinc-800" />
                           <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                              className="absolute top-4 right-4 size-10 rounded-full bg-zinc-900/50 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                              <span className="material-symbols-outlined">delete</span>
                           </button>
                        </div>
                     )}

                     <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-10 border-t border-zinc-100 dark:border-white/5">
                        <div className="flex items-center gap-6">
                           <label className="flex items-center gap-3 cursor-pointer group">
                              <input
                                 type="checkbox"
                                 className="size-6 rounded-lg border-2 border-zinc-200 dark:border-white/10 text-primary focus:ring-primary transition-all cursor-pointer bg-transparent"
                                 checked={formData.is_secret}
                                 onChange={(e) => setFormData(prev => ({ ...prev, is_secret: e.target.checked }))}
                              />
                              <span className="text-[11px] font-black uppercase tracking-widest text-gray-500 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">Secret Post</span>
                           </label>
                           {formData.is_secret && (
                              <input
                                 type="password"
                                 placeholder="PIN (4 digits)"
                                 className="w-32 bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 rounded-xl px-4 py-3 text-xs font-black outline-none focus:ring-4 focus:ring-primary/10 transition-all text-center tracking-[0.3em]"
                                 maxLength={4}
                                 value={formData.password}
                                 onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                              />
                           )}
                        </div>

                        <button
                           type="submit"
                           disabled={isSubmitting}
                           className="w-full md:w-auto px-16 h-16 bg-primary text-black rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
                        >
                           {isSubmitting ? (
                              <div className="size-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                           ) : (
                              <>
                                 <span className="material-symbols-outlined">send</span>
                                 PUBLISH POST
                              </>
                           )}
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
};

export default Community;