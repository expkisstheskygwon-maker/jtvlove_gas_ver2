
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CCAS } from '../constants';

const CCAList: React.FC = () => {
  const [activeRegion, setActiveRegion] = useState('Manila');
  const regions = ['Manila', 'Clark/Angeles', 'Cebu', 'Others'];

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Hero Banner - Responsive height */}
      <section className="relative w-full h-[300px] md:h-[500px] bg-background-dark overflow-hidden flex flex-col justify-end">
        <img 
           src="https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?q=80&w=2000&auto=format&fit=crop" 
           alt="BG" 
           className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/20 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto w-full px-4 md:px-8 pb-12 md:pb-20 space-y-4">
           <nav className="flex items-center gap-2 text-primary/70 text-[10px] md:text-xs font-black uppercase tracking-widest">
              <span>Home</span>
              <span className="material-symbols-outlined text-[12px]">chevron_right</span>
              <span className="text-primary">CCA Directory</span>
           </nav>
           <h2 className="text-4xl md:text-7xl font-extrabold text-white tracking-tighter">CCA 소개</h2>
           <p className="text-white/70 max-w-xl text-sm md:text-lg leading-relaxed">
             필리핀 전역 최고의 JTV 파트너사와 함께하는 프리미엄 CCA를 만나보세요. 
             엄격한 기준으로 선발된 최고의 인재들이 여러분을 기다립니다.
           </p>
        </div>
      </section>

      {/* Sticky Region Tabs */}
      <div className="sticky top-16 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-primary/10">
         <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-start md:justify-center gap-6 md:gap-16 overflow-x-auto hide-scrollbar">
            {regions.map(r => (
               <button 
                  key={r}
                  onClick={() => setActiveRegion(r)}
                  className={`py-4 md:py-6 border-b-2 font-black text-xs md:text-sm transition-all whitespace-nowrap uppercase tracking-widest ${activeRegion === r ? 'border-primary text-primary scale-105' : 'border-transparent text-gray-400 hover:text-primary'}`}
               >
                  {r}
               </button>
            ))}
         </div>
      </div>

      {/* Grid Content */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-20">
         <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-16 gap-6">
            <div>
               <span className="text-[10px] md:text-xs font-black text-primary uppercase tracking-[0.3em] mb-2 block">Premium Directory</span>
               <h3 className="text-3xl md:text-5xl font-extrabold tracking-tighter">{activeRegion} Region CCAs</h3>
            </div>
            <div className="flex items-center gap-4">
               <div className="relative flex-1 md:w-64">
                  <input type="text" placeholder="Search by name..." className="w-full bg-white dark:bg-zinc-900 border-primary/10 rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary" />
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
               </div>
               <div className="hidden md:flex gap-2 bg-white dark:bg-zinc-900 p-1.5 rounded-xl border border-primary/10">
                  <button className="p-2 bg-primary text-[#1b180d] rounded-lg shadow-sm"><span className="material-symbols-outlined fill-1">grid_view</span></button>
                  <button className="p-2 text-gray-400 hover:text-primary transition-colors"><span className="material-symbols-outlined">format_list_bulleted</span></button>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-10">
            {CCAS.map(cca => (
               <Link to={`/ccas/${cca.id}`} key={cca.id} className="group flex flex-col bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-primary/5 shadow-sm hover:shadow-2xl transition-all duration-500">
                  <div className="relative aspect-[3/4] overflow-hidden">
                     <img src={cca.image} alt={cca.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                     <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {cca.isTopRated && <span className="bg-primary text-[#1b180d] text-[10px] font-black px-3 py-1 rounded-lg shadow-xl uppercase">Top Class</span>}
                        {cca.isNew && <span className="bg-black text-white text-[10px] font-black px-3 py-1 rounded-lg shadow-xl uppercase">Newly Joined</span>}
                     </div>
                  </div>
                  <div className="p-6 md:p-8 flex-1 flex flex-col">
                     <div className="flex justify-between items-start mb-4">
                        <div>
                           <h4 className="text-xl md:text-2xl font-extrabold group-hover:text-primary transition-colors">{cca.name}</h4>
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{cca.venueName}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-lg">
                           <span className="material-symbols-outlined text-[16px] fill-1">star</span>
                           <span className="text-xs font-black">{cca.rating}</span>
                        </div>
                     </div>
                     <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 italic mb-6">"{cca.description}"</p>
                     <div className="mt-auto">
                        <button className="w-full py-4 bg-primary text-[#1b180d] font-black text-sm rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/10 uppercase tracking-widest">
                           View Profile
                        </button>
                     </div>
                  </div>
               </Link>
            ))}
         </div>

         <div className="mt-16 md:mt-24 flex justify-center">
            <button className="px-10 py-5 bg-white dark:bg-zinc-900 border-2 border-primary/20 rounded-2xl text-sm font-black hover:border-primary hover:text-primary transition-all shadow-xl group flex items-center gap-3">
               Explore More Profiles
               <span className="material-symbols-outlined group-hover:translate-y-1 transition-transform">keyboard_double_arrow_down</span>
            </button>
         </div>
      </section>
    </div>
  );
};

export default CCAList;
