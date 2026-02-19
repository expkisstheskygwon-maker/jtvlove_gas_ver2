
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { CCA, Venue } from '../types';

const Home: React.FC = () => {
  const [ccas, setCCAs] = useState<CCA[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [currentCcaIndex, setCurrentCcaIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [fetchedCCAs, fetchedVenues] = await Promise.all([
        apiService.getCCAs(),
        apiService.getVenues()
      ]);
      setCCAs(fetchedCCAs);
      setVenues(fetchedVenues);
      setIsLoading(false);
    };

    loadData();
  }, []);

  useEffect(() => {
    if (ccas.length === 0) return;
    
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentCcaIndex((prev) => (prev + 1) % ccas.length);
        setFade(true);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, [ccas.length]);

  if (isLoading || ccas.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-dark text-primary">
        <div className="flex flex-col items-center gap-4">
           <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
           <p className="font-black uppercase tracking-[0.3em] animate-pulse">Loading Luminous Night...</p>
        </div>
      </div>
    );
  }

  const currentCca = ccas[currentCcaIndex];

  return (
    <div className="animate-fade-in overflow-x-hidden">
      {/* Dynamic Hero Section */}
      <section className="bg-white dark:bg-background-dark py-12 md:py-24 px-6 relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          {/* Left Text Content */}
          <div className={`md:w-1/2 space-y-6 transition-all duration-700 ${fade ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            <div className="flex items-center gap-3">
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest border border-primary/20">
                Member of JTV Association
              </span>
              <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{currentCca.venueName}</span>
            </div>
            
            <h2 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tighter">
              Meet <span className="text-primary">{currentCca.name}</span>
            </h2>
            
            <p className="text-slate-600 dark:text-slate-400 text-xl max-w-lg leading-relaxed italic font-medium">
              "{currentCca.description}"
            </p>
            
            <div className="flex flex-wrap gap-2 py-2">
              {currentCca.languages?.map(lang => (
                <span key={lang} className="text-[10px] font-black border border-primary/20 px-3 py-1 rounded-full uppercase text-primary bg-primary/5">{lang} Speaker</span>
              ))}
            </div>

            <Link 
              to={`/ccas/${currentCca.id}`} 
              className="inline-flex px-12 py-5 bg-primary text-[#1b180d] rounded-2xl font-black hover:shadow-2xl hover:scale-105 transition-all items-center gap-4 group text-lg shadow-xl shadow-primary/20"
            >
              Request ({currentCca.name})
              <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform font-black">arrow_forward</span>
            </Link>
          </div>

          {/* Right Image Content */}
          <div className="md:w-1/2 relative h-[450px] md:h-[650px] w-full flex items-center justify-center">
             <div className="absolute inset-0 bg-primary/10 rounded-full blur-[100px] -z-10 scale-90 animate-pulse"></div>
             
             <div className={`relative h-full w-full flex items-center justify-center transition-all duration-1000 ${fade ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-95 rotate-2'}`}>
               <img 
                 src={currentCca.image} 
                 alt={currentCca.name} 
                 className="h-full object-contain drop-shadow-[0_35px_35px_rgba(238,189,43,0.3)] pointer-events-none"
               />
               
               {fade && (
                 <div className="absolute top-1/4 -right-4 bg-white/90 dark:bg-zinc-800/90 backdrop-blur px-4 py-2 rounded-2xl shadow-xl border border-primary/20 animate-bounce">
                    <div className="flex items-center gap-2">
                       <span className="material-symbols-outlined text-primary fill-1">verified</span>
                       <span className="text-xs font-black uppercase tracking-tighter">Top Elite</span>
                    </div>
                 </div>
               )}
             </div>
             
             <div className="absolute bottom-4 flex gap-2">
                {ccas.map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setCurrentCcaIndex(i)}
                    className={`h-1.5 transition-all duration-500 rounded-full ${i === currentCcaIndex ? 'w-8 bg-primary shadow-lg shadow-primary/50' : 'w-2 bg-gray-300'}`}
                  ></button>
                ))}
             </div>
          </div>
        </div>
      </section>

      {/* Featured CCAs Section */}
      <section className="py-16 px-4 bg-background-light dark:bg-background-dark/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8 px-4">
            <div>
              <h3 className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-1">Top Rated CCA</h3>
              <h2 className="text-2xl font-bold">Featured Ambassadors</h2>
            </div>
            <Link to="/ccas" className="text-sm font-semibold text-primary flex items-center gap-1">
              View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-6 px-4 snap-x">
            {ccas.map(cca => (
              <Link to={`/ccas/${cca.id}`} key={cca.id} className="snap-start flex-shrink-0 w-64 group">
                <div className="relative overflow-hidden rounded-xl aspect-[3/4] mb-3 border border-primary/5">
                  <img src={cca.image} alt={cca.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  {cca.isNew && <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-primary border border-primary/20">NEW</div>}
                </div>
                <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{cca.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{cca.venueName} | Premium Class</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Best Lounges */}
      <section className="py-20 px-4 bg-background-dark text-white overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">
          <div className="lg:w-1/3">
            <span className="text-primary font-bold tracking-[0.3em] uppercase text-xs mb-4 block">Selection of the Month</span>
            <h2 className="text-4xl font-extrabold mb-8 font-display">BEST <span className="text-primary">JTV</span> LOUNGE</h2>
            <div className="space-y-8">
              {venues.map(venue => (
                <Link to={`/venues/${venue.id}`} key={venue.id} className="block group border-l-2 border-white/10 pl-6 hover:border-primary transition-all">
                  <h4 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">{venue.name}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">{venue.description}</p>
                </Link>
              ))}
            </div>
          </div>
          <div className="lg:w-2/3 h-[400px] md:h-[500px] flex gap-4">
             {venues.length > 0 && (
               <div className="flex-grow group relative overflow-hidden rounded-2xl">
                  <img src={venues[0].image} alt="Venue" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col justify-end p-8">
                    <p className="font-bold text-2xl">{venues[0].name}</p>
                    <p className="text-sm text-primary font-bold">{venues[0].region}</p>
                  </div>
               </div>
             )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
