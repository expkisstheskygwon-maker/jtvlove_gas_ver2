import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { VENUES, CCAS } from '../constants';

const VenueDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const venue = VENUES.find(v => v.id === id) || VENUES[0];
  const featuredCCAs = CCAS.slice(0, 3);

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen pb-32">
      <div className="max-w-4xl mx-auto w-full">
        {/* Gallery Header */}
        <div className="relative h-[400px] w-full lg:rounded-b-3xl overflow-hidden shadow-2xl">
          <img src={venue.image} alt={venue.name} className="w-full h-full object-cover" />
          <button 
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 size-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-all shadow-xl"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
             <div className="flex gap-2">
                <div className="w-10 h-1 rounded-full bg-primary"></div>
                <div className="w-2 h-1 rounded-full bg-white/50"></div>
                <div className="w-2 h-1 rounded-full bg-white/50"></div>
             </div>
             <button className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white">
                <span className="material-symbols-outlined fill-1">favorite</span>
             </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8 space-y-8">
           <div className="flex justify-between items-start">
              <div className="space-y-2">
                 <div className="flex items-center gap-2">
                    <span className="bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">프리미엄 인증 업소</span>
                    <div className="flex items-center text-primary font-bold">
                       <span className="material-symbols-outlined text-sm fill-1">star</span>
                       <span className="text-sm ml-1">{venue.rating} ({venue.reviewsCount} 리뷰)</span>
                    </div>
                 </div>
                 <h1 className="text-4xl font-extrabold tracking-tight">{venue.name}</h1>
                 <p className="flex items-center gap-1 text-gray-500 text-sm">
                    <span className="material-symbols-outlined text-lg text-primary">location_on</span>
                    {venue.region}
                 </p>
              </div>
              <div className="text-right">
                 <span className="text-green-500 font-bold flex items-center gap-2">
                   <span className="relative flex h-3 w-3">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                   </span>
                   현재 영업 중
                 </span>
                 <p className="text-[10px] text-gray-400 uppercase mt-1">영업 종료 04:00 AM</p>
              </div>
           </div>

           {/* Features */}
           <div className="grid grid-cols-4 gap-4">
              {venue.features.map(feat => (
                <div key={feat} className="flex flex-col items-center justify-center aspect-square bg-white dark:bg-zinc-900 rounded-2xl border border-primary/5 shadow-sm p-2 text-center group hover:border-primary transition-all cursor-default">
                   <span className="material-symbols-outlined text-primary mb-2 text-2xl group-hover:scale-125 transition-transform">
                      {feat === 'VIP Rooms' ? 'king_bed' : feat === 'Live Stage' ? 'mic_external_on' : feat === 'Pro Audio' ? 'surround_sound' : 'local_parking'}
                   </span>
                   <span className="text-[10px] font-extrabold uppercase tracking-tighter">
                    {feat === 'VIP Rooms' ? 'VIP 룸' : feat === 'Live Stage' ? '라이브 스테이지' : feat === 'Pro Audio' ? '음향 시설' : '주차 지원'}
                   </span>
                </div>
              ))}
           </div>

           {/* About */}
           <div className="space-y-4">
              <h3 className="text-2xl font-bold">업소 소개</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {venue.description} 저희 업소는 최첨단 시설과 전문적인 서비스를 통해 격조 높은 밤을 약속드립니다. 
              </p>
           </div>

           {/* Featured CCAs */}
           <div className="space-y-6">
              <div className="flex items-center justify-between">
                 <h3 className="text-2xl font-bold">추천 CCA</h3>
                 <Link to="/ccas" className="text-primary font-bold text-sm">전체 보기</Link>
              </div>
              <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
                 {featuredCCAs.map(cca => (
                    <Link to={`/ccas/${cca.id}`} key={cca.id} className="min-w-[160px] flex flex-col gap-3 group">
                       <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg">
                          <img src={cca.image} alt={cca.name} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" />
                          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full text-[10px] text-white font-bold">
                             <span className="material-symbols-outlined text-primary text-[12px] fill-1">star</span>
                             {cca.rating}
                          </div>
                       </div>
                       <div>
                          <p className="font-bold text-base group-hover:text-primary transition-colors">{cca.name}</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">일본어 가능</p>
                       </div>
                    </Link>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-background-dark/80 backdrop-blur-xl border-t border-primary/10 px-6 py-4 z-50">
        <div className="max-w-4xl mx-auto flex gap-4">
           <button className="flex-1 h-14 bg-white dark:bg-white/5 border-2 border-primary text-primary rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-primary/10 active:scale-95 transition-all">
              <span className="material-symbols-outlined">call</span>
              전화 문의하기
           </button>
           <button className="flex-[1.5] h-14 bg-primary text-[#1b180d] rounded-2xl font-black flex items-center justify-center gap-2 shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all">
              <span className="material-symbols-outlined">send</span>
              텔레그램 예약
           </button>
        </div>
      </div>
    </div>
  );
};

export default VenueDetail;