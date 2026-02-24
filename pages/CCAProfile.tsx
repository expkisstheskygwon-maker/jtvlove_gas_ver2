import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { CCA, MediaItem } from '../types';

const ZODIAC_SIGNS = [
  { name: 'Aries (양자리)', start: '03-21', end: '04-19' },
  { name: 'Taurus (황소자리)', start: '04-20', end: '05-20' },
  { name: 'Gemini (쌍둥이자리)', start: '05-21', end: '06-20' },
  { name: 'Cancer (게자리)', start: '06-21', end: '07-22' },
  { name: 'Leo (사자자리)', start: '07-23', end: '08-22' },
  { name: 'Virgo (처녀자리)', start: '08-23', end: '09-22' },
  { name: 'Libra (천칭자리)', start: '09-23', end: '10-22' },
  { name: 'Scorpio (전갈자리)', start: '10-23', end: '11-21' },
  { name: 'Sagittarius (궁수자리)', start: '11-22', end: '12-21' },
  { name: 'Capricorn (염소자리)', start: '12-22', end: '01-19' },
  { name: 'Aquarius (물병자리)', start: '01-20', end: '02-18' },
  { name: 'Pisces (물고기자리)', start: '02-19', end: '03-20' }
];

const calculateZodiac = (birthday: string) => {
  if (!birthday) return 'N/A';
  const date = new Date(birthday);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const mmdd = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  
  const sign = ZODIAC_SIGNS.find(s => {
    if (s.start <= s.end) {
      return mmdd >= s.start && mmdd <= s.end;
    } else {
      return mmdd >= s.start || mmdd <= s.end;
    }
  });
  return sign ? sign.name : 'N/A';
};

const calculateAge = (birthday: string) => {
  if (!birthday) return '??';
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const CCAProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cca, setCca] = useState<CCA | null>(null);
  const [gallery, setGallery] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const [ccaData, galleryData] = await Promise.all([
          apiService.getCCAById(id),
          apiService.getGallery(id)
        ]);
        setCca(ccaData);
        setGallery(galleryData);
      } catch (error) {
        console.error('Failed to load CCA profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background-light dark:bg-background-dark">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black uppercase tracking-widest text-xs text-gray-400">Loading Profile...</p>
      </div>
    );
  }

  if (!cca) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background-light dark:bg-background-dark">
        <span className="material-symbols-outlined text-6xl text-gray-300">person_off</span>
        <p className="font-black uppercase tracking-widest text-sm text-gray-400">CCA Not Found</p>
        <button onClick={() => navigate('/ccas')} className="px-8 py-3 bg-primary text-[#1b180d] rounded-xl font-black text-xs uppercase tracking-widest">Back to Directory</button>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen pb-24 md:pb-20">
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
                <span className="material-symbols-outlined text-primary block">location_on</span>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">소속 JTV</p>
                <p className="text-sm font-black">{cca.venueName}</p>
              </div>
              <div className="bg-white dark:bg-zinc-800/50 p-6 rounded-2xl border border-primary/5 text-center space-y-2 shadow-sm">
                <span className="material-symbols-outlined text-primary block">cake</span>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">나이</p>
                <p className="text-sm font-black">{calculateAge(cca.birthday || '')} Years</p>
              </div>
              <div className="bg-white dark:bg-zinc-800/50 p-6 rounded-2xl border border-primary/5 text-center space-y-2 shadow-sm">
                <span className="material-symbols-outlined text-primary block">translate</span>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">언어</p>
                <p className="text-sm font-black">{(cca.languages || []).join(', ') || 'N/A'}</p>
              </div>
            </div>

            {/* SNS Links */}
            {cca.sns && Object.values(cca.sns).some(v => v) && (
              <div className="hidden md:flex flex-wrap gap-3 justify-center">
                {cca.sns.instagram && <a href={`https://instagram.com/${cca.sns.instagram}`} target="_blank" rel="noopener noreferrer" className="size-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center border border-primary/10 hover:bg-primary/10 transition-colors"><img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" className="size-5" alt="IG" /></a>}
                {cca.sns.facebook && <a href={`https://facebook.com/${cca.sns.facebook}`} target="_blank" rel="noopener noreferrer" className="size-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center border border-primary/10 hover:bg-primary/10 transition-colors"><img src="https://cdn-icons-png.flaticon.com/512/124/124010.png" className="size-5" alt="FB" /></a>}
                {cca.sns.tiktok && <a href={`https://tiktok.com/@${cca.sns.tiktok}`} target="_blank" rel="noopener noreferrer" className="size-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center border border-primary/10 hover:bg-primary/10 transition-colors"><img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" className="size-5" alt="TT" /></a>}
                {cca.sns.telegram && <a href={`https://t.me/${cca.sns.telegram}`} target="_blank" rel="noopener noreferrer" className="size-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center border border-primary/10 hover:bg-primary/10 transition-colors"><img src="https://cdn-icons-png.flaticon.com/512/2111/2111646.png" className="size-5" alt="TG" /></a>}
              </div>
            )}

            {/* PC Desktop CTA */}
            <div className="hidden md:block">
              <button className="w-full py-6 bg-primary text-[#1b180d] rounded-2xl font-black text-lg tracking-tight shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 uppercase">
                <span className="material-symbols-outlined font-black">calendar_month</span>
                예약 요청하기
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
               <div className="flex items-center gap-6">
                 <p className="text-xl font-bold text-gray-500 flex items-center gap-2 italic">
                    <span className="material-symbols-outlined text-primary">location_on</span>
                    <span className="text-[#1b180d] dark:text-white not-italic underline decoration-primary underline-offset-4">{cca.venueName}</span> 전속
                 </p>
                 {cca.oneLineStory && (
                   <p className="text-lg font-medium text-primary italic">"{cca.oneLineStory}"</p>
                 )}
               </div>
            </div>

            {/* Bento Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-3xl border border-primary/5 space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Age</p>
                  <p className="text-lg font-black">{calculateAge(cca.birthday || '')} Years</p>
               </div>
               <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-3xl border border-primary/5 space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">MBTI</p>
                  <p className="text-lg font-black uppercase">{cca.mbti || 'N/A'}</p>
               </div>
               <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-3xl border border-primary/5 space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Zodiac</p>
                  <p className="text-lg font-black">{calculateZodiac(cca.birthday || '')}</p>
               </div>
               <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-3xl border border-primary/5 space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Marital</p>
                  <p className="text-lg font-black">{cca.maritalStatus || 'Single'}</p>
               </div>
            </div>

            {/* Section: Introduction */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                <h3 className="text-2xl font-extrabold tracking-tight">인사말</h3>
              </div>
              <div className="bg-white dark:bg-zinc-900/50 p-8 rounded-3xl border border-primary/10 shadow-sm leading-relaxed text-lg md:text-xl text-gray-600 dark:text-gray-300 italic font-medium">
                "{cca.oneLineStory || cca.description}"
              </div>
            </div>

            {/* Section: Lifestyle & Habits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-3xl border border-primary/5 flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">local_bar</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase">Drinking</p>
                    <p className="text-sm font-black">{cca.drinking || 'Social'}</p>
                  </div>
               </div>
               <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-3xl border border-primary/5 flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">smoking_rooms</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase">Smoking</p>
                    <p className="text-sm font-black">{cca.smoking || 'No'}</p>
                  </div>
               </div>
               <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-3xl border border-primary/5 flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">pets</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase">Pets</p>
                    <p className="text-sm font-black">{cca.pets || 'None'}</p>
                  </div>
               </div>
            </div>

            {/* Section: Specialties */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                <h3 className="text-2xl font-extrabold tracking-tight">특징 / 특기</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {(cca.specialties || []).map(s => (
                   <div key={s} className="bg-primary/5 border border-primary/20 px-6 py-3 rounded-2xl flex items-center justify-center text-center">
                      <span className="text-xs font-black text-primary uppercase tracking-tighter">{s}</span>
                   </div>
                ))}
                {(!cca.specialties || cca.specialties.length === 0) && <p className="text-gray-400 italic">No specialties listed.</p>}
              </div>
            </div>

            {/* Section: Gallery - Clean Design */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                  <h3 className="text-2xl font-extrabold tracking-tight uppercase">Gallery</h3>
                </div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{gallery.length} Items</span>
              </div>
              
              {gallery.length > 0 ? (
                <div className="columns-2 md:columns-3 gap-4 space-y-4">
                  {gallery.map((item) => (
                    <div key={item.id} className="break-inside-avoid relative group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer">
                      {item.type === 'photo' ? (
                        <img src={item.url} alt={item.caption || 'Gallery'} className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="aspect-video bg-zinc-900 flex items-center justify-center relative">
                           <span className="material-symbols-outlined text-primary text-4xl">play_circle</span>
                           <p className="absolute bottom-4 left-4 text-[10px] font-black text-white uppercase">Video Content</p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                         <p className="text-white text-xs font-bold line-clamp-2">{item.caption}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 bg-white dark:bg-zinc-900/50 rounded-[3rem] border border-dashed border-primary/20 flex flex-col items-center justify-center gap-4">
                   <span className="material-symbols-outlined text-4xl text-gray-300">photo_library</span>
                   <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No media uploaded yet</p>
                </div>
              )}
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
