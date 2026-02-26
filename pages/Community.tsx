import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { Post } from '../types';

const Community: React.FC = () => {
   const [searchParams, setSearchParams] = useSearchParams();
   const boardId = searchParams.get('board') || 'Free Board';
   const [posts, setPosts] = useState<Post[]>([]);
   const [activeCategory, setActiveCategory] = useState('');
   const [isLoading, setIsLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState('');
   const [searchType, setSearchType] = useState('title');

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

   const boards = [
      { id: 'Free Board', name: '커뮤니티', categories: ['잡담', '정보', '모임', '질문', 'TEST1'] },
      { id: 'JTV Review', name: '업소 리뷰', categories: ['파사이', '말라떼', '퀘존', '마카티'] },
      { id: 'CCA Review', name: 'CCA 리뷰', categories: ['Ace', 'Pro', 'Cute'] },
      { id: 'Q&A Board', name: '질문 게시판', categories: ['이용문의', '업소문의', '예약문의'] }
   ];

   const currentBoard = boards.find(b => b.id === boardId) || boards[0];

   useEffect(() => {
      if (currentBoard) {
         const firstCategory = currentBoard.categories[0] || '일반';
         if (!activeCategory || !currentBoard.categories.includes(activeCategory)) {
            setActiveCategory(firstCategory);
         }
         setFormData(prev => ({ ...prev, category: firstCategory, board: boardId }));
      }
   }, [boardId, currentBoard]);

   const fetchPosts = async () => {
      if (!activeCategory) return;
      setIsLoading(true);
      try {
         const data = await apiService.getPosts(boardId, activeCategory);
         setPosts(data);
      } catch (error) {
         console.error('Fetch posts error:', error);
      }
      setIsLoading(false);
   };

   useEffect(() => {
      fetchPosts();
   }, [boardId, activeCategory]);

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
               category: currentBoard.categories.find(c => c !== '전체') || '일반',
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
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
   };

   return (
      <div className="max-w-[1440px] mx-auto px-4 py-12 animate-fade-in text-zinc-900 dark:text-zinc-100">
         {/* Header Section */}
         <div className="flex flex-col md:flex-row justify-between items-baseline mb-8 border-b-2 border-zinc-900 dark:border-white pb-6 gap-4">
            <div>
               <h2 className="text-4xl font-black tracking-tight uppercase italic">{currentBoard.name}</h2>
               <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <Link to="/" className="hover:text-primary transition-colors">HOME</Link>
                  <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                  <span className="text-zinc-900 dark:text-white">{currentBoard.name}</span>
               </div>
            </div>
            <Link to="/community" className="text-[10px] font-black text-gray-400 hover:text-primary transition-colors flex items-center gap-1">
               <span className="material-symbols-outlined text-sm">keyboard_return</span>
               RETURN TO PREVIOUS PAGE
            </Link>
         </div>

         {/* Navigation & Search Panel */}
         <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div className="flex flex-wrap gap-1 bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-xl border border-zinc-200 dark:border-white/5">
               {currentBoard.categories.map(cat => (
                  <button
                     key={cat}
                     onClick={() => setActiveCategory(cat)}
                     className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-lg' : 'hover:bg-zinc-200 dark:hover:bg-white/10 text-gray-500'}`}
                  >
                     {cat}
                  </button>
               ))}
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto">
               <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-[11px] font-bold outline-none focus:ring-2 focus:ring-primary/20"
               >
                  <option value="title">제목</option>
                  <option value="content">내용</option>
                  <option value="author">작성자</option>
               </select>
               <div className="relative flex-1 lg:w-64">
                  <input
                     type="text"
                     placeholder="검색어를 입력하세요"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-[11px] font-bold outline-none focus:ring-2 focus:ring-primary/20"
                  />
               </div>
               <button className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all">
                  검색
               </button>
            </div>
         </div>

         {/* Board List Table */}
         <div className="bg-white dark:bg-zinc-900/30 rounded-3xl border border-zinc-200 dark:border-white/5 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                     <tr className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-white/5">
                        <th className="px-6 py-5 text-[11px] font-black text-gray-500 uppercase tracking-widest w-20 text-center">번호</th>
                        <th className="px-6 py-5 text-[11px] font-black text-gray-500 uppercase tracking-widest">제목</th>
                        <th className="px-6 py-5 text-[11px] font-black text-gray-500 uppercase tracking-widest w-32 text-center">작성자</th>
                        <th className="px-6 py-5 text-[11px] font-black text-gray-500 uppercase tracking-widest w-32 text-center">날짜</th>
                        <th className="px-6 py-5 text-[11px] font-black text-gray-500 uppercase tracking-widest w-20 text-center">조회</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                     {isLoading ? (
                        <tr>
                           <td colSpan={5} className="py-20 text-center">
                              <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">데이터를 불러오는 중...</p>
                           </td>
                        </tr>
                     ) : posts.length > 0 ? (
                        posts.map((post, index) => (
                           <tr key={post.id} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors group cursor-pointer">
                              <td className="px-6 py-5 text-[11px] font-bold text-gray-400 text-center">{posts.length - index}</td>
                              <td className="px-6 py-5">
                                 <Link to={`/community/post/${post.id}`} className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                    {post.category && (
                                       <span className="text-[9px] font-black font-mono text-gray-400 uppercase tracking-tighter bg-zinc-100 dark:bg-white/10 px-1.5 py-0.5 rounded">
                                          [{post.category}]
                                       </span>
                                    )}
                                    <span className={`text-sm font-bold group-hover:text-primary transition-colors flex items-center gap-1 ${post.is_secret ? 'text-gray-400' : ''}`}>
                                       {post.is_secret && <span className="material-symbols-outlined text-xs">lock</span>}
                                       {post.is_secret ? '비밀글입니다.' : post.title}
                                    </span>
                                    {post.commentsCount && post.commentsCount > 0 && (
                                       <span className="text-[10px] font-black text-primary">[{post.commentsCount}]</span>
                                    )}
                                    {post.image && <span className="material-symbols-outlined text-sm text-gray-300">image</span>}
                                 </Link>
                              </td>
                              <td className="px-6 py-5 text-[11px] font-bold text-center">{post.author}</td>
                              <td className="px-6 py-5 text-[11px] font-bold text-gray-400 text-center">{formatDate(post.created_at)}</td>
                              <td className="px-6 py-5 text-[11px] font-bold text-gray-400 text-center">{post.views || 0}</td>
                           </tr>
                        ))
                     ) : (
                        <tr>
                           <td colSpan={5} className="py-20 text-center">
                              <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">inbox</span>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">등록된 게시글이 없습니다.</p>
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Footer Actions */}
         <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
               <button className="size-10 rounded-xl border border-zinc-200 dark:border-white/10 flex items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-all">
                  <span className="material-symbols-outlined">keyboard_double_arrow_left</span>
               </button>
               <button className="size-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center text-xs font-black shadow-lg">1</button>
               <button className="size-10 rounded-xl border border-zinc-200 dark:border-white/10 flex items-center justify-center text-xs font-black text-gray-400 hover:border-primary hover:text-primary transition-all">2</button>
               <button className="size-10 rounded-xl border border-zinc-200 dark:border-white/10 flex items-center justify-center text-xs font-black text-gray-400 hover:border-primary hover:text-primary transition-all">3</button>
               <button className="size-10 rounded-xl border border-zinc-200 dark:border-white/10 flex items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-all">
                  <span className="material-symbols-outlined">keyboard_double_arrow_right</span>
               </button>
            </div>

            <button
               onClick={() => setIsModalOpen(true)}
               className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
            >
               <span className="material-symbols-outlined text-sm">edit</span>
               글쓰기
            </button>
         </div>

         {/* Create Post Modal */}
         {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
               <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[2rem] overflow-hidden shadow-2xl border border-white/10">
                  <div className="bg-zinc-950 p-8 flex items-center justify-between border-b border-white/5">
                     <div>
                        <h4 className="text-2xl font-black tracking-tight text-white uppercase italic">Create New Post</h4>
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Share your experience with the community</p>
                     </div>
                     <button onClick={() => setIsModalOpen(false)} className="size-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                     </button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-8 space-y-6">
                     {/* Row 1: Category & Secret Settings */}
                     <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                           <select
                              value={formData.category}
                              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                              className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                           >
                              {currentBoard.categories.filter(c => c !== '전체').map(c => <option key={c} value={c}>{c}</option>)}
                           </select>
                        </div>
                        <div className="flex-1 space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Privacy</label>
                           <div className="flex items-center gap-4 h-[46px] px-4 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl">
                              <label className="flex items-center gap-2 cursor-pointer group">
                                 <input
                                    type="checkbox"
                                    checked={formData.is_secret}
                                    onChange={(e) => setFormData({ ...formData, is_secret: e.target.checked })}
                                    className="size-4 rounded border-gray-300 text-primary focus:ring-primary dark:bg-zinc-800 dark:border-white/10"
                                 />
                                 <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-primary transition-colors">비밀글</span>
                              </label>
                              {formData.is_secret && (
                                 <input
                                    type="password"
                                    placeholder="비밀번호"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="flex-1 bg-transparent border-none text-[11px] font-bold outline-none placeholder:text-gray-400"
                                    maxLength={4}
                                 />
                              )}
                           </div>
                        </div>
                     </div>

                     {/* Row 2: Title */}
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Title</label>
                        <input
                           type="text"
                           placeholder="게시글 제목을 입력해 주세요"
                           value={formData.title}
                           onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                           className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
                        />
                     </div>

                     {/* Row 3: Content + Image Upload Button */}
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Content</label>
                        <div className="relative bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                           <textarea
                              placeholder="내용을 입력해 주세요..."
                              rows={8}
                              value={formData.content}
                              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                              className="w-full bg-transparent px-6 py-5 text-xs font-bold outline-none resize-none min-h-[160px]"
                           ></textarea>

                           {/* Preview & Action Bar */}
                           <div className="px-4 py-3 bg-zinc-100/50 dark:bg-white/5 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 {formData.image && (
                                    <div className="relative group/thumb">
                                       <img src={formData.image} alt="Preview" className="size-10 rounded-lg object-cover border border-zinc-300 dark:border-white/10" />
                                       <button
                                          type="button"
                                          onClick={() => setFormData({ ...formData, image: '' })}
                                          className="absolute -top-1 -right-1 bg-red-500 text-white size-4 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                                       >
                                          <span className="material-symbols-outlined text-[10px]">close</span>
                                       </button>
                                    </div>
                                 )}
                                 <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                    {formData.image ? 'Image Attached' : 'No images attached'}
                                 </span>
                              </div>

                              <div className="flex items-center gap-2">
                                 <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                    id="image-upload-small"
                                 />
                                 <label
                                    htmlFor="image-upload-small"
                                    className="size-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-gray-400 hover:text-primary hover:border-primary transition-all cursor-pointer"
                                    title="이미지 첨부"
                                 >
                                    <span className="material-symbols-outlined text-xl">add_photo_alternate</span>
                                 </label>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="pt-4">
                        <button
                           disabled={isSubmitting}
                           className={`w-full h-16 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-3 ${isSubmitting ? 'opacity-50' : ''}`}
                        >
                           {isSubmitting ? (
                              <span className="size-5 border-2 border-background-dark border-t-transparent rounded-full animate-spin"></span>
                           ) : (
                              <>
                                 <span className="material-symbols-outlined text-sm">send</span>
                                 게시글 등록하기
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