import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { Post } from '../types';

const PostDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      setIsLoading(true);
      const data = await apiService.getPostById(id);
      setPost(data);
      setIsLoading(false);
    };
    fetchPost();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-black uppercase tracking-widest text-primary animate-pulse">Fetching Content...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">error</span>
        <h2 className="text-2xl font-black mb-2">Post Not Found</h2>
        <p className="text-gray-500 mb-6">The article you are looking for might have been deleted.</p>
        <button onClick={() => navigate('/community')} className="bg-primary px-8 py-3 rounded-xl font-black uppercase text-sm">Back to Community</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-32">
       <div className="max-w-3xl mx-auto w-full">
          {/* Header */}
          <header className="sticky top-0 z-50 flex items-center bg-white/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-primary/10 p-4 justify-between h-16">
             <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors">
                   <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </button>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{post.board}</span>
             </div>
             <div className="flex items-center gap-2">
                <button className="size-10 flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors"><span className="material-symbols-outlined">share</span></button>
                <button className="size-10 flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors"><span className="material-symbols-outlined">more_vert</span></button>
             </div>
          </header>

          <article className="p-6 space-y-8 bg-white dark:bg-zinc-900/30">
             <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight text-[#1b180d] dark:text-white">
                {post.title}
             </h1>

             <div className="flex items-center justify-between pb-8 border-b border-primary/10">
                <div className="flex items-center gap-4">
                   <div className="size-14 rounded-full border-2 border-primary/20 bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
                      {post.author.charAt(0)}
                   </div>
                   <div>
                      <p className="font-extrabold text-lg">{post.author}</p>
                      <p className="text-[10px] text-primary font-black uppercase tracking-tighter">Verified Member</p>
                   </div>
                </div>
                <div className="text-right text-xs text-gray-500 font-bold uppercase tracking-widest">
                   <p>{post.date || 'Today'}</p>
                   <p className="flex items-center justify-end gap-1 mt-1 opacity-60">
                      <span className="material-symbols-outlined text-sm">visibility</span> {post.views} Views
                   </p>
                </div>
             </div>

             <div className="prose prose-lg dark:prose-invert max-w-none">
                <div className="text-xl leading-relaxed text-gray-600 dark:text-gray-400 font-medium whitespace-pre-wrap">
                   {post.content}
                </div>
                {post.image && (
                   <figure className="my-10">
                      <img src={post.image} alt="Visual" className="rounded-3xl w-full aspect-video object-cover shadow-2xl border border-primary/10" />
                   </figure>
                )}
             </div>

             <div className="flex items-center justify-between py-6 border-y border-primary/10">
                <div className="flex items-center gap-8">
                   <button className="flex items-center gap-2 text-primary font-black hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined fill-1">thumb_up</span>
                      <span>{post.likes}</span>
                   </button>
                </div>
                <button className="flex items-center gap-3 bg-primary text-[#1b180d] px-8 py-3 rounded-full font-black shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all uppercase text-xs tracking-widest">
                   <span className="material-symbols-outlined text-xl">recommend</span>
                   Recommend
                </button>
             </div>
          </article>

          {/* Comments Section (Static Placeholder) */}
          <section className="px-6 py-12 space-y-10">
             <h3 className="text-2xl font-extrabold flex items-center gap-2">
                Comments <span className="text-primary text-lg">(0)</span>
             </h3>
             <div className="py-10 text-center opacity-40">
               <p className="font-bold text-sm uppercase tracking-widest">No comments yet. Be the first!</p>
             </div>
          </section>
       </div>

       {/* Comment Input Sticky */}
       <div className="fixed bottom-0 left-0 right-0 md:bottom-2 bg-white/80 dark:bg-background-dark/80 backdrop-blur-xl border-t border-primary/10 px-6 py-4 z-50">
          <div className="max-w-3xl mx-auto flex items-center gap-4">
             <div className="flex-1 flex items-center bg-gray-100 dark:bg-white/5 border border-primary/10 rounded-full px-6 py-3 focus-within:border-primary transition-all">
                <textarea 
                   className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-0 resize-none max-h-32 min-h-[24px]" 
                   placeholder="Share your thoughts..." 
                   rows={1}
                   value={comment}
                   onChange={(e) => setComment(e.target.value)}
                ></textarea>
             </div>
             <button className="bg-primary text-[#1b180d] size-12 flex items-center justify-center rounded-full shadow-2xl hover:brightness-110 active:scale-90 transition-all">
                <span className="material-symbols-outlined font-black">send</span>
             </button>
          </div>
       </div>
    </div>
  );
};

export default PostDetail;