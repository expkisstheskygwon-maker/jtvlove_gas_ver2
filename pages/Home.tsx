
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CCAS, VENUES } from '../constants';

const Home: React.FC = () => {
  const [currentCcaIndex, setCurrentCcaIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentCcaIndex((prev) => (prev + 1) % CCAS.length);
        setFade(true);
      }, 500); // Wait for fade out before changing index
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const currentCca = CCAS[currentCcaIndex];

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
              {currentCca.languages.map(lang => (
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

          {/* Right Image Content (Rolling) */}
          <div className="md:w-1/2 relative h-[450px] md:h-[650px] w-full flex items-center justify-center">
             {/* Glow effect background */}
             <div className="absolute inset-0 bg-primary/10 rounded-full blur-[100px] -z-10 scale-90 animate-pulse"></div>
             
             <div className={`relative h-full w-full flex items-center justify-center transition-all duration-1000 ${fade ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-95 rotate-2'}`}>
               <img 
                 src={currentCca.image} 
                 alt={currentCca.name} 
                 className="h-full object-contain drop-shadow-[0_35px_35px_rgba(238,189,43,0.3)] pointer-events-none"
               />
               
               {/* Floating Badges */}
               {fade && (
                 <div className="absolute top-1/4 -right-4 bg-white/90 dark:bg-zinc-800/90 backdrop-blur px-4 py-2 rounded-2xl shadow-xl border border-primary/20 animate-bounce">
                    <div className="flex items-center gap-2">
                       <span className="material-symbols-outlined text-primary fill-1">verified</span>
                       <span className="text-xs font-black uppercase tracking-tighter">Top Elite</span>
                    </div>
                 </div>
               )}
             </div>
             
             {/* Carousel Indicators */}
             <div className="absolute bottom-4 flex gap-2">
                {CCAS.map((_, i) => (
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

      {/* Featured CCAs (Rest of the Page) */}
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
            {CCAS.map(cca => (
              <Link to={`/ccas/${cca.id}`} key={cca.id} className="snap-start flex-shrink-0 w-64 group">
                <div className="relative overflow-hidden rounded-xl aspect-[3/4] mb-3 border border-primary/5">
                  <img src={cca.image} alt={cca.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  {cca.isNew && <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-primary border border-primary/20">NEW</div>}
                  {cca.isTopRated && <div className="absolute top-3 right-3 bg-primary text-white px-2 py-1 rounded text-[10px] font-bold">TOP 1</div>}
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
              {VENUES.map(venue => (
                <Link to={`/venues/${venue.id}`} key={venue.id} className="block group border-l-2 border-white/10 pl-6 hover:border-primary transition-all">
                  <h4 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">{venue.name}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">{venue.description}</p>
                </Link>
              ))}
            </div>
          </div>
          <div className="lg:w-2/3 h-[400px] md:h-[500px] flex gap-4">
             <div className="flex-grow group relative overflow-hidden rounded-2xl">
                <img src={VENUES[0].image} alt="Venue" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col justify-end p-8">
                  <p className="font-bold text-2xl">{VENUES[0].name}</p>
                  <p className="text-sm text-primary font-bold">{VENUES[0].region}</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white dark:bg-background-dark/30 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold mb-12 font-display">Trusted By <span className="text-primary">Thousands</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {[1,2,3].map(i => (
               <div key={i} className="bg-background-light dark:bg-zinc-900/50 p-8 rounded-2xl border border-primary/5">
                 <div className="flex justify-center text-primary mb-6">
                    {Array(5).fill(0).map((_, j) => <span key={j} className="material-symbols-outlined fill-1 text-2xl">star</span>)}
                 </div>
                 <p className="italic text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                   "연합회를 통해 방문한 덕분에 바가지 요금 걱정 없이 정말 편안하게 즐겼습니다. CCA 분들도 너무 친절하고 시설도 최고였어요!"
                 </p>
                 <div className="font-bold">Member Name {i}</div>
                 <div className="text-xs text-slate-400 uppercase tracking-widest mt-1">Regular Member</div>
               </div>
             ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
