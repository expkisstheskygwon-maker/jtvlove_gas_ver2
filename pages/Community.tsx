import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { Post } from '../types';

const Community: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeBoard, setActiveBoard] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    board: 'Free Board',
    content: '',
    image: ''
  });

  const boards = [
    { id: 'Free Board', name: 'Free Board', icon: 'forum', tag: 'Social' },
    { id: 'Q&A Board', name: 'Q&A Board', icon: 'quiz', tag: 'Expert' },
    { id: 'JTV Review', name: 'JTV Review', icon: 'reviews', tag: 'Venues' },
    { id: 'CCA Review', name: 'CCA Review', icon: 'star_rate', tag: 'Service' }
  ];

  const fetchPosts = async () => {
    setIsLoading(true);
    const data = await apiService.getPosts(activeBoard || undefined);
    setPosts(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [activeBoard]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return alert('Please fill in all fields');

    setIsSubmitting(true);
    const result = await apiService.createPost({
      ...formData,
      author: 'Verified Guest', // Placeholder until auth is implemented
      authorAvatar: 'https://picsum.photos/100/100?random=99'
    });

    if (result) {
      setFormData({ title: '', board: 'Free Board', content: '', image: '' });
      setIsModalOpen(false);
      fetchPosts(); // Refresh list
    } else {
      alert('Failed to create post. Please try again.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 animate-fade-in">
       {/* Hero Banner */}
       <section className="px-4 py-6">
          <div className="relative overflow-hidden rounded-3xl bg-background-dark h-56 md:h-80 flex items-end p-8 border border-primary/20 shadow-2xl group">
             <div className="absolute inset-0 z-0 opacity-40 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{backgroundImage: "url('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2000')"}}></div>
             <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/30 to-transparent z-10"></div>
             <div className="relative z-20 space-y-2">
                <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">Philippine JTV Association</h2>
                <div className="flex items-center gap-3">
                   <div className="h-0.5 w-12 bg-primary"></div>
                   <p className="text-primary font-bold tracking-widest uppercase text-sm">Connecting Professionals & Enthusiasts</p>
                </div>
             </div>
          </div>
       </section>

       {/* Boards Feed */}
       <section className="px-4 mt-8 space-y-8">
          <div className="flex items-center justify-between">
             <h3 className="text-2xl font-extrabold tracking-tight">
               {activeBoard ? `${activeBoard}` : 'Community Boards'}
             </h3>
             {activeBoard && (
               <button 
                onClick={() => setActiveBoard(null)}
                className="text-primary font-bold text-sm flex items-center gap-1"
               >
                 Show All Boards <span className="material-symbols-outlined text-sm">close</span>
               </button>
             )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             {boards.map(board => (
                <div 
                  key={board.id} 
                  onClick={() => setActiveBoard(board.id)}
                  className={`p-6 rounded-2xl border transition-all flex flex-col gap-4 cursor-pointer group ${activeBoard === board.id ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10' : 'bg-white dark:bg-zinc-900 border-primary/10 hover:border-primary/40 shadow-sm'}`}
                >
                   <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                         <span className="material-symbols-outlined text-2xl">{board.icon}</span>
                      </div>
                      <span className="text-[9px] font-black px-2 py-0.5 bg-primary/10 text-primary rounded-full uppercase tracking-widest">{board.tag}</span>
                   </div>
                   <h4 className="font-extrabold text-lg group-hover:text-primary transition-colors">{board.name}</h4>
                </div>
             ))}
          </div>
       </section>

       {/* Latest Post Feed */}
       <section className="px-4 mt-12 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-extrabold tracking-tight">
              {activeBoard ? `${activeBoard} Insights` : 'Latest Community Insights'}
            </h3>
          </div>

          {isLoading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <div className="size-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Feed...</p>
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map(post => (
                 <Link to={`/community/post/${post.id}`} key={post.id} className="block group bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-primary/10 hover:shadow-2xl transition-all">
                    <div className="flex flex-col md:flex-row h-full md:h-64">
                       <div className="md:w-1/3 w-full h-48 md:h-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                         <img 
                          src={post.image || 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=800'} 
                          alt="Post" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                         />
                       </div>
                       <div className="flex-1 p-8 flex flex-col justify-between">
                          <div className="space-y-4">
                             <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-[10px]">
                                  {post.author ? post.author.charAt(0) : 'A'}
                                </div>
                                <span className="text-xs font-black uppercase text-primary tracking-widest">{post.author}</span>
                                <span className="text-[10px] text-gray-400 font-bold">• {post.board}</span>
                             </div>
                             <h4 className="text-2xl font-extrabold leading-tight group-hover:text-primary transition-colors">{post.title}</h4>
                             <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{post.content}</p>
                          </div>
                          <div className="flex items-center gap-6 mt-6 border-t border-primary/5 pt-4">
                             <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <span className="material-symbols-outlined text-sm">visibility</span> {post.views || 0}
                             </span>
                             <span className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-widest">
                                <span className="material-symbols-outlined text-sm fill-1">thumb_up</span> {post.likes || 0}
                             </span>
                          </div>
                       </div>
                    </div>
                 </Link>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-primary/20">
              <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">edit_note</span>
              <p className="font-bold text-gray-400">No posts found in this board yet.</p>
            </div>
          )}
       </section>

       {/* Floating Action Button */}
       <button 
          onClick={() => setIsModalOpen(true)}
          className="fixed right-6 bottom-24 md:bottom-12 z-40 w-16 h-16 bg-primary text-[#1b180d] rounded-full shadow-2xl flex items-center justify-center hover:scale-110 hover:rotate-90 transition-all duration-300"
       >
          <span className="material-symbols-outlined text-4xl font-black">add</span>
       </button>

       {/* Create Post Modal */}
       {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
             <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl border border-primary/10">
                <div className="bg-primary p-6 md:p-8 flex items-center justify-between text-[#1b180d]">
                   <div>
                      <h4 className="text-2xl font-black tracking-tight">Create New Insight</h4>
                      <p className="text-[10px] font-bold opacity-70 uppercase tracking-[0.2em]">Share your experience with the community</p>
                   </div>
                   <button onClick={() => setIsModalOpen(false)} className="size-12 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors">
                      <span className="material-symbols-outlined font-black">close</span>
                   </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Board Category</label>
                         <select 
                            value={formData.board}
                            onChange={(e) => setFormData({...formData, board: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-white/5 border border-primary/10 rounded-2xl px-4 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                         >
                            {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Title</label>
                         <input 
                            type="text" 
                            placeholder="Enter a catchy title..."
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-white/5 border border-primary/10 rounded-2xl px-4 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                         />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Content</label>
                      <textarea 
                         placeholder="What's on your mind? Share tips, reviews, or questions..."
                         rows={6}
                         value={formData.content}
                         onChange={(e) => setFormData({...formData, content: e.target.value})}
                         className="w-full bg-gray-50 dark:bg-white/5 border border-primary/10 rounded-3xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                      ></textarea>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Image URL (Optional)</label>
                      <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 border border-primary/10 rounded-2xl px-4 py-3">
                         <span className="material-symbols-outlined text-gray-400">image</span>
                         <input 
                            type="url" 
                            placeholder="https://images.unsplash.com/..."
                            value={formData.image}
                            onChange={(e) => setFormData({...formData, image: e.target.value})}
                            className="flex-1 bg-transparent border-none text-xs font-bold focus:ring-0"
                         />
                      </div>
                   </div>

                   <div className="pt-4">
                      <button 
                        disabled={isSubmitting}
                        className={`w-full h-16 bg-primary text-[#1b180d] rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                         {isSubmitting ? (
                            <span className="size-5 border-2 border-background-dark border-t-transparent rounded-full animate-spin"></span>
                         ) : (
                            <>
                               <span className="material-symbols-outlined font-black">send</span>
                               Publish Post
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