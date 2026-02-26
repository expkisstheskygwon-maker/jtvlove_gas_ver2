import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { Post } from '../types';

const PostDetail: React.FC = () => {
   const { id } = useParams();
   const navigate = useNavigate();
   const [post, setPost] = useState<Post | null>(null);
   const [comments, setComments] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [commentContent, setCommentContent] = useState('');
   const [isSubmittingComment, setIsSubmittingComment] = useState(false);
   const [showPasswordInput, setShowPasswordInput] = useState(false);
   const [inputPassword, setInputPassword] = useState('');
   const [isAuthorized, setIsAuthorized] = useState(false);

   const fetchPost = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
         const data = await apiService.getPostById(id);
         setPost(data);

         // If it's a secret post and we don't have authorization, show password input
         if (data?.is_secret && !isAuthorized) {
            setShowPasswordInput(true);
         } else {
            // Increment views (mocking "not author" check by just doing it)
            await apiService.incrementPostViews(id);
         }

         // Fetch comments
         const commentData = await apiService.getComments(id);
         setComments(commentData);
      } catch (error) {
         console.error('Fetch post detail error:', error);
      }
      setIsLoading(false);
   };

   useEffect(() => {
      fetchPost();
   }, [id, isAuthorized]);

   const handleVerifyPassword = (e: React.FormEvent) => {
      e.preventDefault();
      if (inputPassword === post?.password) {
         setIsAuthorized(true);
         setShowPasswordInput(false);
      } else {
         alert('비밀번호가 일치하지 않습니다.');
      }
   };

   const handleLikePost = async () => {
      if (!id) return;
      const success = await apiService.likePost(id);
      if (success) {
         setPost(prev => prev ? { ...prev, likes: (prev.likes || 0) + 1 } : null);
      }
   };

   const handlePostComment = async () => {
      if (!id || !commentContent.trim()) return;
      setIsSubmittingComment(true);
      const success = await apiService.createComment({
         postId: id,
         author: '길동이', // Mock user
         content: commentContent
      });
      if (success) {
         setCommentContent('');
         const newComments = await apiService.getComments(id);
         setComments(newComments);
      }
      setIsSubmittingComment(false);
   };

   const handleCommentReaction = async (commentId: string, action: 'like' | 'dislike') => {
      const success = action === 'like'
         ? await apiService.likeComment(commentId)
         : await apiService.dislikeComment(commentId);

      if (success) {
         setComments(prev => prev.map(c =>
            c.id === commentId
               ? { ...c, [action === 'like' ? 'likes' : 'dislikes']: (c[action === 'like' ? 'likes' : 'dislikes'] || 0) + 1 }
               : c
         ));
      }
   };

   const handleDeletePost = async () => {
      if (!id || !window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;
      const success = await apiService.deletePost(id);
      if (success) {
         alert('삭제되었습니다.');
         navigate('/community');
      }
   };

   if (isLoading) {
      return (
         <div className="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark">
            <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-black uppercase tracking-widest text-primary animate-pulse">콘텐츠를 불러오는 중...</p>
         </div>
      );
   }

   if (!post) {
      return (
         <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">error</span>
            <h2 className="text-2xl font-black mb-2">게시글을 찾을 수 없습니다</h2>
            <p className="text-gray-500 mb-6">존재하지 않거나 삭제된 게시글입니다.</p>
            <button onClick={() => navigate('/community')} className="bg-primary text-black px-8 py-3 rounded-xl font-black uppercase text-sm">커뮤니티로 돌아가기</button>
         </div>
      );
   }

   if (showPasswordInput) {
      return (
         <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-950">
            <div className="bg-zinc-900 p-10 rounded-[2rem] border border-white/10 w-full max-w-md shadow-2xl text-center">
               <span className="material-symbols-outlined text-5xl text-primary mb-4">lock</span>
               <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight italic">Secret Post</h2>
               <p className="text-gray-400 text-xs font-bold mb-8 uppercase tracking-widest">이 게시글은 비밀번호가 필요합니다</p>

               <form onSubmit={handleVerifyPassword} className="space-y-4">
                  <input
                     type="password"
                     placeholder="비밀번호 4자리"
                     value={inputPassword}
                     onChange={(e) => setInputPassword(e.target.value)}
                     className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-center text-white text-xl font-black tracking-[0.5em] outline-none focus:ring-2 focus:ring-primary/20"
                     maxLength={4}
                  />
                  <button className="w-full bg-primary text-black h-14 rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                     확인
                  </button>
                  <button
                     type="button"
                     onClick={() => navigate('/community')}
                     className="w-full text-gray-500 text-[10px] font-black uppercase tracking-widest mt-4 hover:text-white"
                  >
                     목록으로 돌아가기
                  </button>
               </form>
            </div>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark pb-32">
         <div className="max-w-4xl mx-auto w-full px-4 pt-12">
            {/* Header & Meta */}
            <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-2 border-zinc-900 dark:border-white pb-8">
               <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                     <span className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">
                        {post.category || 'GENERAL'}
                     </span>
                     <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
                        {post.created_at ? new Date(post.created_at.replace(/\./g, '-')).toLocaleDateString() : (post.date ? post.date : 'DATE UNKNOWN')}
                     </span>
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight text-zinc-950 dark:text-white uppercase italic">
                     {post.title}
                  </h1>
               </div>
               <div className="flex items-center gap-4">
                  <div className="size-16 rounded-3xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center overflow-hidden border border-zinc-200 dark:border-white/10">
                     <img src={post.authorAvatar || 'https://picsum.photos/100/100?random=1'} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div>
                     <p className="font-black text-lg text-zinc-950 dark:text-white">{post.author}</p>
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Post Author</p>
                  </div>
               </div>
            </div>

            {/* Post Content */}
            <article className="space-y-12">
               {/* Fixed Image Display at the Top */}
               {post.image && (
                  <div className="w-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-zinc-200 dark:border-white/5 bg-zinc-100 dark:bg-white/5">
                     <img src={post.image} alt="Post Attachment" className="w-full h-auto max-h-[600px] object-contain" />
                  </div>
               )}

               <div className="text-lg md:text-xl leading-relaxed text-zinc-800 dark:text-zinc-300 font-medium whitespace-pre-wrap px-2">
                  {post.content}
               </div>

               {/* Post Stats & Actions */}
               <div className="flex flex-col md:flex-row items-center justify-between py-10 border-y border-zinc-200 dark:border-white/5 gap-6">
                  <div className="flex items-center gap-10">
                     <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Views</span>
                        <span className="text-2xl font-black">{post.views || 0}</span>
                     </div>
                     <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Likes</span>
                        <span className="text-2xl font-black text-primary">{post.likes || 0}</span>
                     </div>
                  </div>

                  <div className="flex items-center gap-4">
                     {/* Edit/Delete shown only to author (mocking check) */}
                     <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-zinc-100 dark:bg-white/5 text-[11px] font-black text-gray-500 hover:text-zinc-950 dark:hover:text-white transition-colors uppercase tracking-widest">
                        <span className="material-symbols-outlined text-sm">edit</span>
                        Edit
                     </button>
                     <button
                        onClick={handleDeletePost}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-zinc-100 dark:bg-white/5 text-[11px] font-black text-gray-500 hover:text-red-500 transition-colors uppercase tracking-widest"
                     >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        Delete
                     </button>
                     <button
                        onClick={handleLikePost}
                        className="flex items-center gap-3 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 px-10 py-3 rounded-2xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-all uppercase text-[11px] tracking-widest"
                     >
                        <span className="material-symbols-outlined text-base">thumb_up</span>
                        LIKE POST
                     </button>
                  </div>
               </div>
            </article>

            {/* Comments Section */}
            <section className="mt-20 space-y-12">
               <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-black uppercase italic tracking-tight">
                     Comments <span className="text-primary not-italic">({comments.length})</span>
                  </h3>
               </div>

               <div className="space-y-6">
                  {comments.length > 0 ? (
                     comments.map((c) => (
                        <div key={c.id} className="bg-zinc-50 dark:bg-white/5 rounded-[2rem] p-8 border border-zinc-200 dark:border-white/5 flex gap-6 group transition-all hover:border-primary/20">
                           <div className="size-14 rounded-2xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xl font-black overflow-hidden border border-zinc-300 dark:border-white/10 shrink-0">
                              <img src={`https://picsum.photos/100/100?random=${c.id}`} alt="Avatar" className="w-full h-full object-cover" />
                           </div>
                           <div className="flex-1 space-y-4">
                              <div className="flex items-center justify-between">
                                 <div>
                                    <p className="font-black text-zinc-950 dark:text-white uppercase tracking-tight">{c.author}</p>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                                       {c.created_at ? new Date(c.created_at.replace(/\./g, '-')).toLocaleString() : ''}
                                    </p>
                                 </div>
                                 <div className="flex items-center gap-4">
                                    <button
                                       onClick={() => handleCommentReaction(c.id, 'like')}
                                       className="flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-primary transition-colors uppercase"
                                    >
                                       <span className="material-symbols-outlined text-sm">thumb_up</span>
                                       {c.likes || 0}
                                    </button>
                                    <button
                                       onClick={() => handleCommentReaction(c.id, 'dislike')}
                                       className="flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-red-500 transition-colors uppercase"
                                    >
                                       <span className="material-symbols-outlined text-sm">thumb_down</span>
                                       {c.dislikes || 0}
                                    </button>
                                 </div>
                              </div>
                              <p className="text-base text-zinc-700 dark:text-zinc-400 font-medium whitespace-pre-wrap leading-relaxed">
                                 {c.content}
                              </p>
                           </div>
                        </div>
                     ))
                  ) : (
                     <div className="py-20 text-center bg-zinc-50 dark:bg-white/5 rounded-[2.5rem] border border-dashed border-zinc-200 dark:border-white/10">
                        <span className="material-symbols-outlined text-5xl text-gray-300 mb-4 opacity-30">chat_bubble</span>
                        <p className="font-black text-[10px] text-gray-400 uppercase tracking-[0.2em]">첫 번째 댓글의 주인공이 되어보세요!</p>
                     </div>
                  )}
               </div>

               {/* Comment Input */}
               <div className="bg-zinc-950 p-8 rounded-[2.5rem] shadow-2xl border border-white/10">
                  <div className="flex flex-col gap-6">
                     <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-primary flex items-center justify-center font-black text-black">G</div>
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">WRITE A COMMENT</span>
                     </div>
                     <textarea
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-sm text-white font-medium outline-none focus:ring-2 focus:ring-primary/20 resize-none min-h-[120px] placeholder:text-gray-600"
                        placeholder="타인을 비방하거나 부적절한 언어 사용은 제재의 대상이 될 수 있습니다..."
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                     ></textarea>
                     <div className="flex justify-end">
                        <button
                           onClick={handlePostComment}
                           disabled={isSubmittingComment || !commentContent.trim()}
                           className="bg-primary text-black px-12 h-14 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:scale-100"
                        >
                           {isSubmittingComment ? (
                              <span className="size-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                           ) : (
                              <>
                                 <span className="material-symbols-outlined text-sm">send</span>
                                 POST COMMENT
                              </>
                           )}
                        </button>
                     </div>
                  </div>
               </div>
            </section>

            {/* Navigation Buttons */}
            <div className="mt-20 flex justify-center pb-20">
               <button
                  onClick={() => navigate('/community')}
                  className="px-12 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] hover:opacity-90 active:scale-95 transition-all flex items-center gap-3 border border-white/10"
               >
                  <span className="material-symbols-outlined text-sm">list</span>
                  BACK TO LIST
               </button>
            </div>
         </div>
      </div>
   );
};

export default PostDetail;