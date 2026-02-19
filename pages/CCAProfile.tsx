import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CCAS } from '../constants';

const CCAProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const cca = CCAS.find(c => c.id === id) || CCAS[0];

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen pb-24 md:pb-0">
      {/* Mobile-only sticky header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10 px-4 py-3 flex items-center justify-between">
         <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors">
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
         </button>
         <h1 className="text-xs font-black uppercase tracking-[0.3em] text-primary">프로필 상세</h1>
         <div className="flex gap-2">
            <button className="size-10 flex items-center justify-center rounded-full"><span className="material-symbols-outlined">favorite</span></button>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-0 md:px-8 lg:px-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 md:gap-12 items-start">
          
          {/* Left Side: Profile Photo */}
          <div className="lg:col-span-5 md:sticky md:top-24 space-y-6">
            <div className="relative aspect-[4/5] md:aspect-[3/4] lg:aspect-[4/5] md:rounded-3xl overflow-hidden shadow-2xl group">
               <img src={cca.image} alt={cca.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:hidden"></div>
               
               {/* Mobile Floating Overlay Info */}
               <div className="absolute bottom-6 left-6 right-6 md:hidden text-white space-y-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-4xl font-extrabold tracking-tighter">{cca.name}</h2>
                    <span className="material-symbols-outlined text-primary fill-1">verified</span>
                  </div>
                  <p className="text-sm font-bold opacity-80">{cca.venueName}</p>
               </div>
            </div>

            {/* PC Display Stats Quick View */}
            <div className="hidden md:grid grid-cols-3 gap-4">
              <div className="bg-white dark:bg-zinc-800/50 p-6 rounded-2xl border border-primary/5 text-center space-y-2 shadow-sm">
                <span className="material-symbols-outlined text-primary block">history</span>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">경력</p>
                <p className="text-sm font-black">{cca.experience}</p>
              </div>
              <div className="bg-white dark:bg-zinc-800/50 p-6 rounded-2xl border border-primary/5 text-center space-y-2 shadow-sm">
                <span className="material-symbols-outlined text-primary block">translate</span>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">구사 가능 언어</p>
                <p className="text-sm font-black">{cca.languages[0]} 외</p>
              </div>
              <div className="bg-white dark:bg-zinc-800/50 p-6 rounded-2xl border border-primary/5 text-center space-y-2 shadow-sm">
                <span className="material-symbols-outlined text-primary block">straighten</span>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">신장</p>
                <p className="text-sm font-black">{cca.height}</p>
              </div>
            </div>

            {/* PC Desktop CTA */}
            <div className="hidden md:block">
              <button className="w-full py-6 bg-primary text-[#1b180d] rounded-2xl font-black text-lg tracking-tight shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 uppercase">
                <span className="material-symbols-outlined font-black">add_circle</span>
                지명 요청하기
              </button>
            </div>
          </div>

          {/* Right Side: Detailed Content */}
          <div className="lg:col-span-7 px-6 py-10 md:px-0 md:py-0 space-y-12">
            
            {/* Name and Rating Block - Desktop Only */}
            <div className="hidden md:block space-y-4">
               <div className="flex items-center gap-4">
                 <h1 className="text-6xl font-extrabold tracking-tighter">{cca.name}</h1>
                 <div className="bg-primary/10 text-primary px-4 py-2 rounded-2xl flex items-center gap-2">
                    <span className="material-symbols-outlined fill-1 text-2xl">star</span>
                    <span className="text-2xl font-black">{cca.rating}</span>
                 </div>
               </div>
               <p className="text-xl font-bold text-gray-500 flex items-center gap-2 italic">
                  <span className="material-symbols-outlined text-primary">location_on</span>
                  <span className="text-[#1b180d] dark:text-white not-italic underline decoration-primary underline-offset-4">{cca.venueName}</span> 전속 소속
               </p>
            </div>

            {/* Section: Introduction */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                <h3 className="text-2xl font-extrabold tracking-tight">인사말</h3>
              </div>
              <div className="bg-white dark:bg-zinc-900/50 p-8 rounded-3xl border border-primary/10 shadow-sm leading-relaxed text-lg md:text-xl text-gray-600 dark:text-gray-300 italic font-medium">
                "{cca.description}"
              </div>
            </div>

            {/* Section: Specialties */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                <h3 className="text-2xl font-extrabold tracking-tight">주요 전문 분야 및 기술</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {cca.specialties.map(s => (
                   <div key={s} className="bg-primary/5 border border-primary/20 px-6 py-4 rounded-2xl flex items-center justify-center text-center">
                      <span className="text-xs md:text-sm font-black text-primary uppercase tracking-tighter">{s}</span>
                   </div>
                ))}
              </div>
            </div>

            {/* Section: Gallery */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                  <h3 className="text-2xl font-extrabold tracking-tight">최근 갤러리</h3>
                </div>
                <button className="text-primary font-bold text-sm uppercase tracking-widest hover:underline">전체 보기</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 shadow-sm hover:shadow-xl transition-shadow cursor-pointer">
                    <img src={`https://picsum.photos/600/600?random=${i + 20}`} alt="Profile" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-background-dark/80 backdrop-blur-xl border-t border-primary/10 px-6 py-4 z-50">
          <button className="w-full bg-primary text-[#1b180d] py-5 rounded-2xl font-black text-lg tracking-tight shadow-2xl shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase">
             <span className="material-symbols-outlined font-black">calendar_month</span>
             지금 지명하기
          </button>
      </div>
    </div>
  );
};

export default CCAProfile;