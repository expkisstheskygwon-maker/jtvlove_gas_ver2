
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { POSTS } from '../constants';

const PostDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const post = POSTS.find(p => p.id === id) || POSTS[0];
  const [comment, setComment] = useState('');

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
                   <img src={post.authorAvatar} alt="Author" className="size-14 rounded-full border-2 border-primary/20 p-0.5" />
                   <div>
                      <p className="font-extrabold text-lg">{post.author}</p>
                      <p className="text-[10px] text-primary font-black uppercase tracking-tighter">Level 4 Member • Verified</p>
                   </div>
                </div>
                <div className="text-right text-xs text-gray-500 font-bold uppercase tracking-widest">
                   <p>{post.date} • 14:30</p>
                   <p className="flex items-center justify-end gap-1 mt-1 opacity-60">
                      <span className="material-symbols-outlined text-sm">visibility</span> {post.views} Views
                   </p>
                </div>
             </div>

             <div className="prose prose-lg dark:prose-invert max-w-none">
                <p className="text-xl leading-relaxed text-gray-600 dark:text-gray-400 font-medium">
                   {post.content}
                </p>
                {post.image && (
                   <figure className="my-10">
                      <img src={post.image} alt="Lounge" className="rounded-3xl w-full aspect-video object-cover shadow-2xl border border-primary/10" />
                      <figcaption className="text-center text-xs mt-4 text-gray-400 font-bold uppercase tracking-widest italic opacity-60">Premier JTV Atmosphere Showcase</figcaption>
                   </figure>
                )}
                <p className="leading-relaxed">
                   When it comes to hospitality, the attention to detail is paramount. Most high-end spots in the Makati and Malate areas have upgraded their sound systems and interior lighting to create a more immersive experience for guests. I visited five different locations last week, and here are my detailed impressions.
                </p>
                <div className="bg-primary/5 border-l-4 border-primary p-8 rounded-r-3xl my-10 space-y-2">
                   <h4 className="font-black text-primary uppercase tracking-widest text-sm">Pro Tip for First-Timers</h4>
                   <p className="text-sm font-bold opacity-80">Make sure to call ahead for VIP room bookings. Most premium spots are fully booked by 8:00 PM on weekends.</p>
                </div>
             </div>

             <div className="flex items-center justify-between py-6 border-y border-primary/10">
                <div className="flex items-center gap-8">
                   <button className="flex items-center gap-2 text-primary font-black hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined fill-1">thumb_up</span>
                      <span>{post.likes}</span>
                   </button>
                   <button className="flex items-center gap-2 text-gray-400 font-black hover:text-primary transition-colors">
                      <span className="material-symbols-outlined">chat_bubble</span>
                      <span>{post.commentsCount}</span>
                   </button>
                </div>
                <button className="flex items-center gap-3 bg-primary text-[#1b180d] px-8 py-3 rounded-full font-black shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all uppercase text-xs tracking-widest">
                   <span className="material-symbols-outlined text-xl">recommend</span>
                   Recommend
                </button>
             </div>
          </article>

          {/* Comments */}
          <section className="px-6 py-12 space-y-10">
             <h3 className="text-2xl font-extrabold flex items-center gap-2">
                Comments <span className="text-primary text-lg">({post.commentsCount})</span>
             </h3>
             <div className="space-y-10">
                <div className="space-y-6">
                   <div className="flex gap-4 group">
                      <img src="https://picsum.photos/100/100?random=5" alt="User" className="size-12 rounded-full border-2 border-primary/5" />
                      <div className="flex-1 space-y-3">
                         <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl rounded-tl-none shadow-sm border border-primary/5 group-hover:shadow-xl transition-shadow">
                            <div className="flex justify-between items-center mb-3">
                               <span className="font-black text-sm uppercase tracking-tighter">Park Seo-jun</span>
                               <span className="text-[10px] font-bold text-gray-400">2 HOURS AGO</span>
                            </div>
                            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">Great list! I've been to the second spot you mentioned, and the service was absolutely top-notch. Highly recommend the VIP suite.</p>
                         </div>
                         <div className="flex items-center gap-6 ml-1">
                            <button className="text-[10px] font-black text-primary uppercase tracking-widest">Reply</button>
                            <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary">Like</button>
                         </div>
                      </div>
                   </div>
                   
                   <div className="ml-12 pl-6 border-l-2 border-primary/10 space-y-6">
                      <div className="flex gap-4">
                         <img src={post.authorAvatar} alt="OP" className="size-10 rounded-full border-2 border-primary/10" />
                         <div className="flex-1 space-y-2">
                            <div className="bg-primary/5 p-5 rounded-2xl rounded-tl-none border border-primary/10">
                               <div className="flex justify-between items-center mb-2">
                                  <span className="font-black text-xs uppercase text-primary">Kim Min-jun <span className="ml-2 bg-primary text-white text-[8px] px-2 py-0.5 rounded-full">OP</span></span>
                                  <span className="text-[10px] font-bold text-primary/60">1 HOUR AGO</span>
                               </div>
                               <p className="text-sm leading-relaxed font-medium">I agree! The VIP suites there are perfect for business meetings or private gatherings.</p>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
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
                <button className="text-primary/40 hover:text-primary transition-colors ml-3"><span className="material-symbols-outlined">sentiment_satisfied</span></button>
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
