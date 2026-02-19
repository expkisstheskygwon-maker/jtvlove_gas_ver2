
import React from 'react';
import { Link } from 'react-router-dom';
import { POSTS } from '../constants';

const Community: React.FC = () => {
  const boards = [
    { id: 'free', name: 'Free Board', icon: 'forum', tag: 'Social', recent: 'Just visited the new spot in Makati, the ambiance is incredible...' },
    { id: 'qa', name: 'Q&A Board', icon: 'quiz', tag: 'Expert', recent: 'What are the updated visa requirements for specialized staff?' },
    { id: 'jtv', name: 'JTV Review', icon: 'reviews', tag: 'Venues', recent: 'Verified review: Ginza Premium continues to hold high standards...' },
    { id: 'cca', name: 'CCA Review', icon: 'star_rate', tag: 'Service', recent: 'Professional feedback for the team at Malate branch...' }
  ];

  return (
    <div className="max-w-7xl mx-auto pb-24">
       {/* Hero Banner */}
       <section className="px-4 py-6">
          <div className="relative overflow-hidden rounded-3xl bg-background-dark h-56 md:h-80 flex items-end p-8 border border-primary/20 shadow-2xl group">
             <div className="absolute inset-0 z-0 opacity-40 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCtmwKLSWB5Z1hpz91PLye97IbHC4HXgkUGC-sTWvGKowSoQCRRSKiQXjEjhznvTvT0F00BRosnyJ3A5Ub8pkeMm8WdqH2fP6-dTaNgNaSlezi3bQf_nJly6Sc22_SYnvKSA9ZtDcgeYiOHAc7VlWBKlY7CmjvGOzzV1l2lWK1HNqcc_Ka0P1TPl8CSRL2CUCN5hXAdJdSBsjdUSEozn_U1Nvx_3O_BdzN1swbZzpX5Ed__MF7eIfaue6gDwFaVGi0vqnOAUE9nNS3U')"}}></div>
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
             <h3 className="text-2xl font-extrabold tracking-tight">Community Boards</h3>
             <button className="text-primary font-bold text-sm flex items-center gap-1">View All <span className="material-symbols-outlined text-sm">arrow_forward</span></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
             {boards.map(board => (
                <div key={board.id} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-primary/10 shadow-sm hover:shadow-2xl hover:border-primary/40 transition-all flex flex-col gap-5 group cursor-pointer">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary transition-transform group-hover:scale-110">
                            <span className="material-symbols-outlined text-3xl">{board.icon}</span>
                         </div>
                         <h4 className="font-extrabold text-xl group-hover:text-primary transition-colors">{board.name}</h4>
                      </div>
                      <span className="text-[10px] font-black px-3 py-1 bg-primary/10 text-primary rounded-full uppercase tracking-widest">{board.tag}</span>
                   </div>
                   <div className="bg-background-light dark:bg-background-dark/50 p-4 rounded-xl border-l-4 border-primary/60 group-hover:border-primary transition-all">
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-[10px] font-bold uppercase tracking-tighter opacity-60">Latest Activity</span>
                         <span className="text-[10px] font-bold text-gray-400">2 mins ago</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 italic leading-relaxed">"{board.recent}"</p>
                   </div>
                </div>
             ))}
          </div>
       </section>

       {/* Latest Post Teaser */}
       <section className="px-4 mt-12">
          <h3 className="text-2xl font-extrabold tracking-tight mb-8">Latest Community Insights</h3>
          {POSTS.map(post => (
             <Link to={`/community/post/${post.id}`} key={post.id} className="block group bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-primary/10 hover:shadow-2xl transition-all">
                <div className="flex flex-col md:flex-row h-full md:h-64">
                   {post.image && <img src={post.image} alt="Post" className="md:w-1/3 w-full h-48 md:h-full object-cover group-hover:scale-105 transition-transform duration-700" />}
                   <div className="flex-1 p-8 flex flex-col justify-between">
                      <div className="space-y-4">
                         <div className="flex items-center gap-3">
                            <img src={post.authorAvatar} alt="Avatar" className="size-8 rounded-full" />
                            <span className="text-xs font-black uppercase text-primary tracking-widest">{post.author}</span>
                         </div>
                         <h4 className="text-2xl font-extrabold leading-tight group-hover:text-primary transition-colors">{post.title}</h4>
                         <p className="text-sm text-gray-500 line-clamp-2">{post.content}</p>
                      </div>
                      <div className="flex items-center gap-6 mt-6 border-t border-primary/5 pt-4">
                         <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <span className="material-symbols-outlined text-sm">visibility</span> {post.views}
                         </span>
                         <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <span className="material-symbols-outlined text-sm">chat_bubble</span> {post.commentsCount}
                         </span>
                         <span className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-widest">
                            <span className="material-symbols-outlined text-sm fill-1">thumb_up</span> {post.likes}
                         </span>
                      </div>
                   </div>
                </div>
             </Link>
          ))}
       </section>

       {/* FAB */}
       <button className="fixed right-6 bottom-24 md:bottom-12 z-40 w-16 h-16 bg-primary text-[#1b180d] rounded-full shadow-2xl flex items-center justify-center hover:scale-110 hover:rotate-90 transition-all duration-300">
          <span className="material-symbols-outlined text-4xl font-black">add</span>
       </button>
    </div>
  );
};

export default Community;
