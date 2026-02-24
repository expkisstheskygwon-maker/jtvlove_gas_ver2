
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { CCA } from '../types';

const CCAList: React.FC = () => {
  const [activeRegion, setActiveRegion] = useState('ALL');
  const [ccas, setCcas] = useState<CCA[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const regions = ['ALL', 'Manila', 'Clark/Angeles', 'Cebu', 'Others'];

  useEffect(() => {
    const fetchCCAs = async () => {
      setIsLoading(true);
      try {
        const data = await apiService.getCCAs();
        setCcas(data);
      } catch (error) {
        console.error('Failed to fetch CCAs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCCAs();
  }, []);

  const filteredCCAs = ccas
    .filter(cca => {
      if (activeRegion === 'ALL') return true;
      
      const ccaRegion = (cca.region || '').toLowerCase();
      const targetRegion = activeRegion.toLowerCase();

      if (targetRegion === 'manila') {
        return ccaRegion.includes('manila') || ['pasay', 'makati', 'malate', 'quezon', 'paranaque', 'taguig'].some(city => ccaRegion.includes(city));
      }
      if (targetRegion === 'clark/angeles') {
        return ccaRegion.includes('clark') || ccaRegion.includes('angeles') || ccaRegion.includes('pampanga');
      }
      if (targetRegion === 'cebu') {
        return ccaRegion.includes('cebu');
      }
      if (targetRegion === 'others') {
        const known = ['manila', 'pasay', 'makati', 'malate', 'quezon', 'paranaque', 'taguig', 'clark', 'angeles', 'pampanga', 'cebu'];
        return !known.some(k => ccaRegion.includes(k));
      }
      return ccaRegion === targetRegion;
    })
    .filter(cca => {
      if (!searchQuery) return true;
      const name = (cca.nickname || cca.name).toLowerCase();
      const venue = cca.venueName.toLowerCase();
      const query = searchQuery.toLowerCase();
      return name.includes(query) || venue.includes(query);
    })
    .sort((a, b) => {
      // LIKES > VIEWS > NEW
      const likesA = a.likesCount || 0;
      const likesB = b.likesCount || 0;
      if (likesB !== likesA) return likesB - likesA;

      const viewsA = a.viewsCount || 0;
      const viewsB = b.viewsCount || 0;
      if (viewsB !== viewsA) return viewsB - viewsA;

      const newA = a.isNew ? 1 : 0;
      const newB = b.isNew ? 1 : 0;
      return newB - newA;
    });

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Hero Banner */}
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
               <h3 className="text-3xl md:text-5xl font-extrabold tracking-tighter">
                 {activeRegion === 'ALL' ? 'All' : activeRegion} CCAs
               </h3>
            </div>
            <div className="flex items-center gap-4">
               <div className="relative flex-1 md:w-64">
                  <input 
                    type="text" 
                    placeholder="Search by name..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border-primary/10 rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary" 
                  />
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
               </div>
            </div>
         </div>

         {isLoading ? (
           <div className="py-40 flex flex-col items-center justify-center gap-4">
             <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
             <p className="font-black uppercase tracking-widest text-xs text-gray-400">Loading CCAs...</p>
           </div>
         ) : (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-10">
              {filteredCCAs.map(cca => (
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
                             <h4 className="text-xl md:text-2xl font-extrabold group-hover:text-primary transition-colors">{cca.nickname || cca.name}</h4>
                             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{cca.venueName}</p>
                          </div>
                          <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-lg">
                             <span className="material-symbols-outlined text-[16px] fill-1">star</span>
                             <span className="text-xs font-black">{cca.rating}</span>
                          </div>
                       </div>
                       <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 italic mb-6">"{cca.description}"</p>
                       <div className="mt-auto flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase">
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">favorite</span>
                              {cca.likesCount || 0}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">visibility</span>
                              {cca.viewsCount || 0}
                            </div>
                          </div>
                          <button className="px-6 py-3 bg-primary text-[#1b180d] font-black text-[10px] rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/10 uppercase tracking-widest">
                             Profile
                          </button>
                       </div>
                    </div>
                 </Link>
              ))}
              {filteredCCAs.length === 0 && (
                <div className="col-span-full py-40 text-center space-y-4 opacity-40">
                  <span className="material-symbols-outlined text-6xl">person_search</span>
                  <p className="font-black uppercase tracking-widest text-xs">No CCAs found in this region</p>
                </div>
              )}
           </div>
         )}
      </section>
    </div>
  );
};

export default CCAList;
