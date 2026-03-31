import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { CCA, Venue, HeroSection } from '../types';
import { Helmet } from 'react-helmet-async';

const GRADE_COLORS: Record<string, string> = {
  ACE: 'bg-gradient-to-r from-amber-400 to-yellow-300 text-[#1b180d]',
  PRO: 'bg-gradient-to-r from-sky-400 to-blue-500 text-white',
  CUTE: 'bg-gradient-to-r from-pink-400 to-rose-400 text-white',
};

const Home: React.FC = () => {
  const [ccas, setCCAs] = useState<CCA[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [heroSections, setHeroSections] = useState<HeroSection[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [currentCcaIndex, setCurrentCcaIndex] = useState(0);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [hoveredVenueIndex, setHoveredVenueIndex] = useState(0);
  const ccaScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [fetchedCCAs, fetchedVenues, fetchedHeros, fetchedSettings] = await Promise.all([
          apiService.getCCAs(),
          apiService.getVenues(),
          apiService.getHeroSections(),
          apiService.getSiteSettings()
        ]);
        setCCAs(fetchedCCAs);
        setVenues(fetchedVenues);
        setHeroSections(fetchedHeros);
        setSettings(fetchedSettings);
      } catch (error) {
        console.error("Data load failed", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const totalSlides = heroSections.length > 0 ? heroSections.length : ccas.length;
    if (totalSlides === 0 || isPaused) return;

    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        if (heroSections.length > 0) {
          setCurrentHeroIndex((prev) => (prev + 1) % heroSections.length);
        } else {
          setCurrentCcaIndex((prev) => (prev + 1) % ccas.length);
        }
        setFade(true);
      }, 500);
    }, 6000);

    return () => clearInterval(interval);
  }, [ccas.length, heroSections.length, isPaused]);

  const goToSlide = useCallback((index: number) => {
    setFade(false);
    setTimeout(() => {
      if (heroSections.length > 0) {
        setCurrentHeroIndex(index);
      } else {
        setCurrentCcaIndex(index);
      }
      setFade(true);
    }, 300);
  }, [heroSections.length]);

  const scrollCCA = (direction: 'left' | 'right') => {
    if (ccaScrollRef.current) {
      const scrollAmount = 280;
      ccaScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const liveCCAs = React.useMemo(() => {
    const isMock = !settings || settings.marketing_live_ccas !== 'false'; // Default to true
    const activeCcas = ccas.filter(cca => cca.status === 'active');
    
    if (isMock) {
      // Shuffle for random mock check-ins
      return [...activeCcas].sort(() => 0.5 - Math.random()).slice(0, 8);
    } else {
      // Actual real check-ins
      return activeCcas.filter(cca => (cca as any).isWorking || (cca as any).attendanceStatus === 'checked_in').slice(0, 8);
    }
  }, [ccas, settings]);

  if (isLoading || (ccas.length === 0 && heroSections.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-dark text-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-black uppercase tracking-[0.3em] animate-pulse">화려한 밤을 준비 중입니다...</p>
        </div>
      </div>
    );
  }

  const isCustomHero = heroSections.length > 0;
  const currentCca = ccas[currentCcaIndex];
  const currentHero = heroSections[currentHeroIndex];
  const totalSlides = isCustomHero ? heroSections.length : ccas.length;
  const activeIndex = isCustomHero ? currentHeroIndex : currentCcaIndex;
  const activeVenue = venues[hoveredVenueIndex] || venues[0];

  return (
    <div className="animate-fade-in overflow-x-hidden">
      <Helmet>
        <title>{settings?.site_name || 'JTV STAR'}</title>
        <meta name="description" content="필리핀 JTV 최신 정보, 업소 리뷰, CCA 평점 및 커뮤니티! 실시간으로 확인하고 소통하세요." />
        <meta property="og:title" content={settings?.site_name || 'JTV STAR'} />
        <meta property="og:description" content="필리핀 JTV 최신 정보, 업소 리뷰, CCA 평점 및 커뮤니티! 필리핀 여행의 밤을 책임지는 JTV LOVE에서 모든 것을 확인하세요." />
      </Helmet>
      {/* ═══════════════════════════════════════════════ */}
      {/* HERO SECTION - Full-screen immersive design    */}
      {/* ═══════════════════════════════════════════════ */}
      <section
        className="relative min-h-[85vh] md:min-h-[90vh] flex items-center overflow-hidden bg-background-dark"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Background Image with Overlay */}
        <div className={`absolute inset-0 transition-all duration-1000 ${fade ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}>
          <img
            src={isCustomHero ? currentHero?.imageUrl : currentCca?.image}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a1608]/95 via-[#1a1608]/70 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1608]/80 via-transparent to-[#1a1608]/30"></div>
        </div>

        {/* Decorative glow */}
        <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] -translate-y-1/2 pointer-events-none"></div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-12 flex flex-col md:flex-row items-center gap-8 md:gap-16">
          {/* Left: Text Area */}
          <div className={`md:w-1/2 space-y-5 md:space-y-7 text-white transition-all duration-700 ${fade ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            {/* Badges */}
            <div className="flex items-center gap-3 flex-wrap">
              {isCustomHero ? (
                <>
                  {currentHero?.badge1 && (
                    <span className="inline-block px-4 py-1.5 bg-primary/20 text-primary text-[11px] font-black rounded-full uppercase tracking-widest border border-primary/30 backdrop-blur-sm">
                      {currentHero.badge1}
                    </span>
                  )}
                  {currentHero?.badge2 && (
                    <span className="text-white/60 text-[11px] font-bold uppercase tracking-widest">{currentHero.badge2}</span>
                  )}
                </>
              ) : (
                <>
                  <span className="inline-block px-4 py-1.5 bg-primary/20 text-primary text-[11px] font-black rounded-full uppercase tracking-widest border border-primary/30 backdrop-blur-sm">
                    인기 멤버
                  </span>
                  <span className="text-white/60 text-[11px] font-bold uppercase tracking-widest">{currentCca?.venueName}</span>
                </>
              )}
            </div>

            {/* Title */}
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tighter">
              {isCustomHero ? (
                <div dangerouslySetInnerHTML={{ __html: currentHero?.title?.replace(/\\n/g, '<br/>') || '' }} />
              ) : (
                <>인기 <span className="text-primary">{currentCca?.nickname || currentCca?.name}</span></>
              )}
            </h2>

            {/* Description */}
            <p className="text-white/60 text-base md:text-lg max-w-lg leading-relaxed font-medium line-clamp-3">
              "{isCustomHero ? currentHero?.content : currentCca?.description}"
            </p>

            {/* Language Tags (CCA only) */}
            {!isCustomHero && currentCca?.languages && (
              <div className="flex flex-wrap gap-2 py-1">
                {currentCca.languages.map(lang => (
                  <span key={lang} className="text-[10px] font-black border border-primary/30 px-3 py-1 rounded-full uppercase text-primary bg-primary/10 backdrop-blur-sm">{lang} 가능</span>
                ))}
              </div>
            )}

            {/* CTA Button */}
            <Link
              to={isCustomHero ? (currentHero?.buttonLink || '/') : `/ccas/${currentCca?.id}`}
              className="inline-flex px-10 py-4 bg-primary text-[#1b180d] rounded-2xl font-black hover:shadow-2xl hover:shadow-primary/30 hover:scale-105 transition-all items-center gap-3 group text-base shadow-xl"
            >
              {isCustomHero ? currentHero?.buttonText : `프로필 보기`}
              <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform font-black">arrow_forward</span>
            </Link>
          </div>

          {/* Right: Featured Image (Desktop) */}
          <div className="hidden md:flex md:w-1/2 justify-center items-center relative">
            <div className={`relative transition-all duration-1000 ${fade ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
              <div className="w-[350px] h-[500px] lg:w-[400px] lg:h-[560px] rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl shadow-black/50">
                <img
                  src={isCustomHero ? currentHero?.imageUrl : currentCca?.image}
                  alt={isCustomHero ? currentHero?.title : currentCca?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating badge */}
              {!isCustomHero && currentCca && fade && (
                <div className="absolute -bottom-4 -left-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur px-5 py-3 rounded-2xl shadow-xl border border-primary/20">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary fill-1 text-xl">verified</span>
                    <div>
                      <span className="text-xs font-black uppercase tracking-tight block">{currentCca.nickname || currentCca.name}</span>
                      <span className="text-[10px] text-slate-500">{currentCca.grade || 'PRO'} · {currentCca.venueName}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2.5 z-20">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`h-2 transition-all duration-500 rounded-full ${i === activeIndex ? 'w-10 bg-primary shadow-lg shadow-primary/50' : 'w-2.5 bg-white/30 hover:bg-white/60'}`}
            ></button>
          ))}
        </div>

        {/* Prev/Next Arrows (Desktop) */}
        {totalSlides > 1 && (
          <>
            <button
              onClick={() => goToSlide((activeIndex - 1 + totalSlides) % totalSlides)}
              className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white transition-all hover:scale-110"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button
              onClick={() => goToSlide((activeIndex + 1) % totalSlides)}
              className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white transition-all hover:scale-110"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </>
        )}
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* LIVE CCAs SECTION (CURRENTLY CLOCKED-IN)       */}
      {/* ═══════════════════════════════════════════════ */}
      {liveCCAs.length > 0 && (
        <section className="py-10 bg-zinc-950 overflow-hidden relative border-y border-zinc-900 border-t-primary/20 shadow-[0_0_50px_rgba(255,215,0,0.05)]">
           <div className="absolute top-0 right-1/4 w-[300px] h-[300px] bg-red-500/10 rounded-full blur-[100px] pointer-events-none"></div>
           <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                   <div className="relative flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-600"></span>
                   </div>
                   <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">NOW LIVE <span className="text-primary font-medium text-lg ml-2 opacity-80">현재 출근자</span></h2>
                </div>
                <Link to="/ccas" className="text-xs font-bold text-zinc-400 hover:text-white transition-colors">전체보기 &rarr;</Link>
              </div>
              <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2 snap-x pr-4">
                 {liveCCAs.map(cca => (
                   <Link to={`/ccas/${cca.id}`} key={`live-${cca.id}`} className="snap-start flex-shrink-0 w-36 md:w-44 group relative">
                      <div className="aspect-[3/4] rounded-2xl overflow-hidden relative border border-white/5 group-hover:border-primary/50 transition-colors shadow-2xl">
                         <img src={cca.image} alt={cca.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                              onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop'; }}/>
                         <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                         <div className="absolute top-2 left-2 bg-red-600/90 px-2.5 py-1 rounded text-[9px] font-black text-white uppercase tracking-wider backdrop-blur-md shadow-lg shadow-red-500/20 border border-white/10 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                            출근중
                         </div>
                         <div className="absolute bottom-3 left-3 right-3">
                            <div className="flex justify-between items-end">
                               <h4 className="font-extrabold text-sm text-white truncate drop-shadow-md">{cca.nickname || cca.name}</h4>
                               {cca.grade && <span className="text-[8px] px-1.5 py-0.5 rounded uppercase font-black bg-primary text-[#1b180d]">{cca.grade}</span>}
                            </div>
                            <p className="text-[10px] text-zinc-300 truncate mt-1 opacity-80 font-medium flex items-center gap-1">
                               <span className="material-symbols-outlined text-[10px]">location_on</span> {cca.venueName}
                            </p>
                         </div>
                      </div>
                   </Link>
                 ))}
              </div>
           </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* FEATURED CCAs SECTION                          */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="py-16 md:py-20 px-4 bg-background-light dark:bg-[#1a1608]">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-end justify-between mb-10 px-4">
            <div>
              <h3 className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-2">{settings?.ui_texts?.home_cca_subtitle || '인기 CCA 리스트'}</h3>
              <h2 className="text-2xl md:text-3xl font-extrabold">
                {settings?.ui_texts?.home_cca_title ? (
                  <span dangerouslySetInnerHTML={{ __html: settings.ui_texts.home_cca_title }} />
                ) : (
                  <>이번 주 화제의 <span className="text-primary">홍보 대사</span></>
                )}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {/* Scroll Arrows (Desktop) */}
              <div className="hidden md:flex gap-2">
                <button
                  onClick={() => scrollCCA('left')}
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-primary/20 hover:bg-primary hover:text-[#1b180d] transition-all hover:scale-110"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button
                  onClick={() => scrollCCA('right')}
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-primary/20 hover:bg-primary hover:text-[#1b180d] transition-all hover:scale-110"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
              <Link to="/ccas" className="text-sm font-semibold text-primary flex items-center gap-1 hover:gap-2 transition-all">
                전체 보기 <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Cards */}
          <div
            ref={ccaScrollRef}
            className="flex gap-5 overflow-x-auto hide-scrollbar pb-6 px-4 snap-x scroll-smooth"
          >
            {ccas.map(cca => (
              <Link to={`/ccas/${cca.id}`} key={cca.id} className="snap-start flex-shrink-0 w-56 md:w-64 group">
                <div className="relative overflow-hidden rounded-2xl aspect-[3/4] mb-3 border border-primary/5 shadow-lg group-hover:shadow-xl group-hover:shadow-primary/10 transition-all">
                  <img
                    src={cca.image}
                    alt={cca.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop';
                    }}
                  />
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  {/* Grade Badge */}
                  {cca.grade && (
                    <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg ${GRADE_COLORS[cca.grade] || 'bg-zinc-700 text-white'}`}>
                      {cca.grade}
                    </div>
                  )}

                  {/* New Badge */}
                  {cca.isNew && (
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-black text-primary border border-primary/20 shadow-lg">
                      신규
                    </div>
                  )}

                  {/* Hover info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="material-symbols-outlined text-primary fill-1 text-sm">star</span>
                      <span className="text-white text-xs font-bold">{cca.rating}</span>
                    </div>
                    {cca.languages && (
                      <div className="flex flex-wrap gap-1">
                        {cca.languages.slice(0, 3).map(lang => (
                          <span key={lang} className="text-[9px] font-bold text-white/80 bg-white/15 px-2 py-0.5 rounded-full backdrop-blur-sm">{lang}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <h4 className="font-bold text-base group-hover:text-primary transition-colors">{cca.nickname || cca.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span className="material-symbols-outlined text-xs text-primary/60">location_on</span>
                  {cca.venueName}
                  {cca.grade && (
                    <> · <span className="text-primary font-bold">{cca.grade}</span></>
                  )}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* BEST VENUES / LOUNGES SECTION                  */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 px-4 bg-background-dark text-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-primary font-bold tracking-[0.3em] uppercase text-xs mb-3 block">{settings?.ui_texts?.home_venue_subtitle || '이달의 추천 업소'}</span>
              <h2 className="text-3xl md:text-4xl font-extrabold font-display">
                {settings?.ui_texts?.home_venue_title ? (
                  <span dangerouslySetInnerHTML={{ __html: settings.ui_texts.home_venue_title }} />
                ) : (
                  <>최고의 <span className="text-primary">JTV</span> 라운지</>
                )}
              </h2>
            </div>
            <Link to="/venues" className="text-sm font-semibold text-primary flex items-center gap-1 hover:gap-2 transition-all">
              전체 보기 <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Left: Venue list */}
            <div className="lg:w-1/3 space-y-2">
              {venues.map((venue, index) => (
                <Link
                  to={`/venues/${venue.id}`}
                  key={venue.id}
                  className={`block group p-5 rounded-2xl transition-all duration-300 border ${hoveredVenueIndex === index
                    ? 'bg-primary/10 border-primary/30 shadow-lg shadow-primary/5'
                    : 'border-white/5 hover:border-primary/20 hover:bg-white/5'
                    }`}
                  onMouseEnter={() => setHoveredVenueIndex(index)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${hoveredVenueIndex === index ? 'bg-primary text-[#1b180d]' : 'bg-white/5 text-white/50'}`}>
                      <span className="material-symbols-outlined">apartment</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-bold text-lg mb-1 transition-colors ${hoveredVenueIndex === index ? 'text-primary' : 'group-hover:text-primary'}`}>
                        {venue.name}
                      </h4>
                      {venue.description && (
                        <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">{venue.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        {venue.region && (
                          <span className="text-[10px] font-bold text-primary/70 bg-primary/10 px-2 py-0.5 rounded-full">{venue.region}</span>
                        )}
                        {venue.rating > 0 && (
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-primary fill-1 text-xs">star</span>
                            {venue.rating}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`material-symbols-outlined text-sm transition-all ${hoveredVenueIndex === index ? 'text-primary translate-x-1' : 'text-white/20'}`}>
                      arrow_forward
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Right: Featured venue image */}
            <div className="lg:w-2/3 h-[350px] md:h-[500px] relative">
              {activeVenue && (
                <Link to={`/venues/${activeVenue.id}`} className="block w-full h-full group">
                  <div className="relative w-full h-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                    <img
                      src={activeVenue.image || activeVenue.banner_image || activeVenue.bannerImage}
                      alt={activeVenue.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=1200&h=800&fit=crop';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-8">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-sm text-primary font-bold mb-1 uppercase tracking-wider">{activeVenue.region}</p>
                          <p className="font-extrabold text-2xl md:text-3xl text-white">{activeVenue.name}</p>
                          {activeVenue.tags && activeVenue.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {activeVenue.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="text-[10px] font-bold text-white/70 bg-white/10 backdrop-blur px-3 py-1 rounded-full">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl group-hover:bg-primary group-hover:text-[#1b180d] transition-all">
                          <span className="text-sm font-bold">자세히 보기</span>
                          <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* QUICK ACTION BANNER                            */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-primary/5 via-background-light to-primary/10 dark:from-primary/5 dark:via-[#1a1608] dark:to-primary/10 relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/15 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-block px-5 py-2 bg-primary/15 text-primary text-[11px] font-black rounded-full uppercase tracking-[0.2em] mb-6 border border-primary/20">
            {settings?.ui_texts?.home_premium_title || 'PREMIUM EXPERIENCE'}
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight tracking-tight">
            {settings?.ui_texts?.home_premium_subtitle ? (
              <span dangerouslySetInnerHTML={{ __html: settings.ui_texts.home_premium_subtitle }} />
            ) : (
              <>특별한 밤을 위한<br /><span className="text-primary">최고의 선택</span></>
            )}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            {settings?.ui_texts?.home_premium_content || (
              <>엄선된 프리미엄 업소와 검증된 CCA를 만나보세요.<br className="hidden md:block" />안전하고 만족스러운 경험을 보장합니다.</>
            )}
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
            <Link
              to="/guide"
              className="inline-flex px-8 md:px-10 py-4 bg-emerald-500 text-white rounded-2xl font-black hover:bg-emerald-400 hover:shadow-2xl hover:shadow-emerald-500/30 hover:scale-105 transition-all items-center justify-center gap-3 group text-sm md:text-base shadow-xl border border-emerald-400/50"
            >
              초보자 가이드북 펼치기
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">menu_book</span>
            </Link>
            <Link
              to="/ccas"
              className="inline-flex px-8 md:px-10 py-4 bg-primary text-[#1b180d] rounded-2xl font-black hover:shadow-2xl hover:shadow-primary/30 hover:scale-105 transition-all items-center justify-center gap-3 group text-sm md:text-base shadow-xl"
            >
              {settings?.ui_texts?.home_btn_cca || 'CCA 둘러보기'}
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
            <Link
              to="/venues"
              className="inline-flex px-8 md:px-10 py-4 bg-white dark:bg-white/10 text-zinc-900 dark:text-white rounded-2xl font-black hover:shadow-xl hover:scale-105 transition-all items-center justify-center gap-3 group text-sm md:text-base border border-zinc-200 dark:border-white/10"
            >
              {settings?.ui_texts?.home_btn_venue || '업소 정보 찾기'}
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">apartment</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;