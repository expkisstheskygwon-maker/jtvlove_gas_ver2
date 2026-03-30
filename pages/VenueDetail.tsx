import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { Venue, CCA } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Helmet } from 'react-helmet-async';

const VenueDetail: React.FC = () => {
   const { id } = useParams();
   const navigate = useNavigate();

   const [venue, setVenue] = useState<Venue | null>(null);
   const [venueCCAs, setVenueCCAs] = useState<CCA[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [activeTab, setActiveTab] = useState<'info' | 'menu' | 'tables' | 'staff'>('info');
   const [venueNotices, setVenueNotices] = useState<any[]>([]);
   const [expandedNoticeId, setExpandedNoticeId] = useState<string | null>(null);
   const [noticePage, setNoticePage] = useState(1);
   const NOTICES_PER_PAGE = 7;

   // Message state
   const { user } = useAuth();
   const [showMsgModal, setShowMsgModal] = useState(false);
   const [msgSubject, setMsgSubject] = useState('');
   const [msgContent, setMsgContent] = useState('');
   const [msgSending, setMsgSending] = useState(false);
   const [msgSuccess, setMsgSuccess] = useState(false);

   const handleSendMessage = async () => {
      if (!venue || !user || !msgContent.trim()) return;
      setMsgSending(true);
      const result = await apiService.sendMessage({
         sender_id: user.id,
         sender_type: 'user',
         sender_name: user.nickname || user.realName || '',
         receiver_id: venue.id,
         receiver_type: 'venue_admin',
         receiver_name: venue.name,
         subject: msgSubject || `${user.nickname || '고객'}님의 메시지`,
         content: msgContent
      });
      setMsgSending(false);
      if (result.success) {
         setMsgSuccess(true);
         setTimeout(() => {
            setShowMsgModal(false);
            setMsgSuccess(false);
            setMsgContent('');
            setMsgSubject('');
         }, 2000);
      } else {
         alert('메시지 전송 실패: ' + (result.error || ''));
      }
   };

   useEffect(() => {
      const fetchData = async () => {
         if (!id) return;
         setIsLoading(true);
         try {
            const [venueData, ccaData, noticesData] = await Promise.all([
               apiService.getVenueById(id),
               apiService.getCCAs(id),
               apiService.getVenueNotices(id)
            ]);

            if (venueData) {
               // Map DB snake_case to frontend camelCase if necessary
               const mappedVenue = {
                  ...venueData,
                  reviewsCount: (venueData as any).reviews_count || 0,
                  operatingHours: (venueData as any).operating_hours || venueData.operatingHours || { open: '19:00', close: '02:00' },
               };
               setVenue(mappedVenue);
            }
            setVenueCCAs(ccaData || []);
            setVenueNotices(Array.isArray(noticesData) ? noticesData : []);
         } catch (err) {
            console.error("Failed to load venue detail", err);
         } finally {
            setIsLoading(false);
         }
      };
      fetchData();
   }, [id]);

   if (isLoading) {
      return (
         <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <div className="size-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-black uppercase tracking-widest text-primary">Synchronizing Venue Archives...</p>
         </div>
      );
   }

   if (!venue) {
      return (
         <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <p className="text-xl font-bold">업소를 찾을 수 없습니다.</p>
            <button onClick={() => navigate(-1)} className="bg-primary text-black px-8 py-3 rounded-2xl font-black">돌아가기</button>
         </div>
      );
   }

   const tabs = [
      { id: 'info', label: '상세정보', icon: 'info' },
      { id: 'menu', label: '메뉴', icon: 'menu_book' },
      { id: 'tables', label: '룸/테이블', icon: 'meeting_room' },
      { id: 'staff', label: '소속 CCA', icon: 'groups' },
   ];

   const timeSlots = ['19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00'];

   return (
      <div className="bg-background-light dark:bg-background-dark min-h-screen pb-32 animate-fade-in">
         <Helmet>
            <title>{venue.name}</title>
            <meta name="description" content={`${venue.name} (${venue.region}) 상세 정보, 평점 및 예약.`} />
            <meta property="og:title" content={venue.name} />
            <meta property="og:description" content={`${venue.name} (${venue.region}) 상세 정보, 평점 및 예약.`} />
            {venue.image && <meta property="og:image" content={venue.image} />}
            {venue.image && <meta name="twitter:image" content={venue.image} />}
         </Helmet>
         {/* Hero Banner Section */}
         <div className="relative h-[300px] md:h-[450px] w-full bg-zinc-900 overflow-hidden">
            {venue.banner_image || venue.bannerImage ? (
               <img src={venue.banner_image || venue.bannerImage} alt="Banner" className="w-full h-full object-cover" />
            ) : (
               <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-white/10">image</span>
               </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>

            {/* Back Button */}
            <button
               onClick={() => navigate(-1)}
               className="absolute top-6 left-6 size-10 md:size-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-all z-20"
            >
               <span className="material-symbols-outlined text-xl md:text-2xl">arrow_back</span>
            </button>

            {/* Logo Overlay */}
            <div className="absolute -bottom-12 left-6 md:left-12 flex items-end gap-6 z-10">
               <div className="size-24 md:size-32 rounded-3xl overflow-hidden border-4 border-white dark:border-zinc-900 bg-white shadow-2xl">
                  {venue.image ? (
                     <img src={venue.image} alt={venue.name} className="w-full h-full object-cover" />
                  ) : (
                     <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-zinc-300">store</span>
                     </div>
                  )}
               </div>
               <div className="pb-4 space-y-1">
                  <div className="flex items-center gap-2">
                     <span className="bg-primary text-black text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded">PREMIUM</span>
                     <div className="flex items-center text-primary font-bold">
                        <span className="material-symbols-outlined text-sm fill-1">star</span>
                        <span className="text-sm ml-0.5">{venue.rating || 0}</span>
                     </div>
                  </div>
                  <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight drop-shadow-lg">{venue.name}</h1>
                  <p className="flex items-center gap-1 text-white/80 text-xs md:text-sm font-bold">
                     <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                     {venue.region}
                  </p>
               </div>
            </div>
         </div>

         <div className="max-w-4xl mx-auto w-full mt-20 md:mt-24 px-6 space-y-8">
            {/* Action Bar (Status & Contact Quick Info) */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-primary/5 shadow-xl">
               <div className="flex items-center gap-4">
                  <span className="flex items-center gap-2 text-green-500 font-black uppercase text-xs">
                     <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                     </span>
                     Open Now
                  </span>
                  <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800"></div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                     {venue.operatingHours?.open} - {venue.operatingHours?.close}
                  </span>
               </div>
               <div className="flex gap-2">
                  <button
                     onClick={() => {
                        if (!user) {
                           alert('메시지를 보내려면 로그인이 필요합니다.');
                           navigate('/login', { state: { returnTo: `/venues/${id}` } });
                           return;
                        }
                        setShowMsgModal(true);
                     }}
                     className="px-5 py-2.5 bg-primary/10 text-primary rounded-xl flex items-center gap-2 hover:bg-primary hover:text-[#1b180d] transition-all font-black text-xs uppercase tracking-widest"
                  >
                     <span className="material-symbols-outlined text-lg">mail</span>
                     Message
                  </button>
               </div>
            </div>

            {/* Custom Navigation Tabs */}
            <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 p-1.5 rounded-3xl border border-primary/5 shadow-inner">
               {tabs.map(tab => (
                  <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id as any)}
                     className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-primary text-black shadow-lg shadow-primary/20 scale-[1.02]' : 'text-gray-400 hover:text-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/5'}`}
                  >
                     <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                     <span className="hidden md:inline">{tab.label}</span>
                  </button>
               ))}
            </div>

            {/* Tab Contents */}
            <div className="min-h-[400px]">
               {activeTab === 'info' && (
                  <div className="space-y-10 animate-fade-in">
                     <div className="space-y-4">
                        <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                           <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                           About {venue.name}
                        </h3>
                        <p className="text-gray-600 dark:text-zinc-400 leading-relaxed font-medium whitespace-pre-wrap">
                           {venue.introduction || venue.description || '업소 소개 정보가 아직 등록되지 않았습니다.'}
                        </p>
                     </div>

                     {venue.media && Array.isArray(venue.media) && venue.media.length > 0 && (
                        <div className="space-y-4">
                           <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                              <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                              Venue Gallery
                           </h3>
                           <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {venue.media.map((url: string, idx: number) => (
                                 <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group">
                                    <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     )}

                     {venue.features && venue.features.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           {venue.features.map((feat: string) => (
                              <div key={feat} className="flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-primary/5 shadow-sm hover:border-primary transition-all group">
                                 <span className="material-symbols-outlined text-primary mb-3 text-3xl group-hover:scale-110 transition-transform">
                                    {feat.includes('VIP') ? 'king_bed' : feat.includes('Live') ? 'mic_external_on' : feat.includes('Audio') ? 'surround_sound' : 'done'}
                                 </span>
                                 <span className="text-[10px] font-black uppercase tracking-widest text-center">{feat}</span>
                              </div>
                           ))}
                        </div>
                     )}

                     <div className="p-8 bg-zinc-900 text-white rounded-[2.5rem] space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-10">
                           <span className="material-symbols-outlined text-8xl">location_on</span>
                        </div>
                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Location Archive</h4>
                        <div className="space-y-2 relative z-10">
                           <p className="text-2xl font-black">{venue.region}</p>
                           <p className="text-zinc-400 font-bold text-sm leading-tight">{venue.address || '상세 주소를 확인하려면 문의해주세요.'}</p>
                        </div>
                     </div>
                  </div>
               )}

               {activeTab === 'menu' && (
                  <div className="space-y-8 animate-fade-in">
                     <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black uppercase tracking-tight">Main Menu</h3>
                        <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Digital Board v1.0</span>
                     </div>
                     {venue.menu && Array.isArray(venue.menu) && venue.menu.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {venue.menu.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-primary/5 hover:border-primary/20 transition-all">
                                 <div className="space-y-1">
                                    <p className="font-black dark:text-white uppercase">{item.name}</p>
                                    <p className="text-[10px] text-zinc-400 font-bold">{item.description || 'Premium Select'}</p>
                                 </div>
                                 <p className="text-primary font-black text-lg">{item.price ? typeof item.price === 'number' ? `₱${item.price.toLocaleString()}` : item.price : 'ASK'}</p>
                              </div>
                           ))}
                        </div>
                     ) : (
                        <div className="py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem]">
                           <span className="material-symbols-outlined text-4xl text-zinc-300 mb-2">restaurant_menu</span>
                           <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">메뉴 정보가 준비 중입니다.</p>
                        </div>
                     )}
                  </div>
               )}

               {activeTab === 'tables' && (
                  <div className="space-y-8 animate-fade-in">
                     <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black uppercase tracking-tight">Facilities & Rooms</h3>
                        <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Capacity Analysis</span>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Rooms */}
                        <div className="space-y-4">
                           <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">VIP Rooms</h4>
                           {venue.rooms && Array.isArray(venue.rooms) && venue.rooms.length > 0 ? (
                              <div className="space-y-2">
                                 {venue.rooms.map((room: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-black/20 rounded-xl border border-primary/5">
                                       <div className="flex items-center gap-3">
                                          <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                                             <span className="material-symbols-outlined text-xl">door_front</span>
                                          </div>
                                          <p className="font-bold text-sm">{room.name || room.number}</p>
                                       </div>
                                       <span className="text-[10px] font-black text-zinc-500">{room.capacity || '4'} Persons</span>
                                    </div>
                                 ))}
                              </div>
                           ) : (
                              <p className="text-xs text-zinc-400 ml-2">정보 없음</p>
                           )}
                        </div>
                        {/* Tables */}
                        <div className="space-y-4">
                           <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Hall Tables</h4>
                           {venue.tables && Array.isArray(venue.tables) && venue.tables.length > 0 ? (
                              <div className="space-y-2">
                                 {venue.tables.map((table: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-black/20 rounded-xl border border-primary/5">
                                       <div className="flex items-center gap-3">
                                          <div className="size-10 bg-zinc-200 dark:bg-white/10 rounded-lg flex items-center justify-center">
                                             <span className="material-symbols-outlined text-xl">table_bar</span>
                                          </div>
                                          <p className="font-bold text-sm">{table.name || table.number}</p>
                                       </div>
                                       <span className="text-[10px] font-black text-zinc-500">{table.capacity || '2-4'} Persons</span>
                                    </div>
                                 ))}
                              </div>
                           ) : (
                              <p className="text-xs text-zinc-400 ml-2">정보 없음</p>
                           )}
                        </div>
                     </div>
                  </div>
               )}

               {activeTab === 'staff' && (
                  <div className="space-y-8 animate-fade-in">
                     <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black uppercase tracking-tight">Active Staff Members</h3>
                        <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest">
                           {venueCCAs.length} Verified
                        </span>
                     </div>
                     {venueCCAs.length > 0 ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                           {venueCCAs.map(cca => (
                              <Link to={`/ccas/${cca.id}`} key={cca.id} className="group space-y-4">
                                 <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-xl shadow-black/5 dark:shadow-none">
                                    <img src={cca.image} alt={cca.name} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                                    <div className="absolute bottom-4 left-4 right-4">
                                       <div className="flex items-center gap-1.5 bg-primary/20 backdrop-blur-md px-3 py-1.5 rounded-full w-fit">
                                          <span className="material-symbols-outlined text-primary text-xs fill-1">star</span>
                                          <span className="text-white text-[10px] font-black">{cca.rating}</span>
                                       </div>
                                    </div>
                                 </div>
                                 <div className="px-2">
                                    <h4 className="font-black text-lg group-hover:text-primary transition-colors">{cca.nickname || cca.name}</h4>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Japanese Speaker</p>
                                 </div>
                              </Link>
                           ))}
                        </div>
                     ) : (
                        <div className="py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem]">
                           <span className="material-symbols-outlined text-4xl text-zinc-300 mb-2">person_off</span>
                           <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">현재 출근 중인 스태프가 없습니다.</p>
                        </div>
                     )}
                  </div>
               )}
            </div>

            {/* Venue Notices Section */}
            <div className="mt-10 space-y-4">
               <div className="flex items-center justify-between px-2">
                  <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                     <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                     업체 공지사항
                  </h3>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Latest {venueNotices.length}</span>
               </div>

               {venueNotices.length > 0 ? (
                  <div className="space-y-4">
                     <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-primary/5 shadow-xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
                        {venueNotices
                           .slice((noticePage - 1) * NOTICES_PER_PAGE, noticePage * NOTICES_PER_PAGE)
                           .map((notice: any) => {
                              const isExpanded = expandedNoticeId === notice.id;
                              const dateStr = notice.created_at ? new Date(notice.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }) : '';
                              return (
                                 <div
                                    key={notice.id}
                                    className={`transition-all cursor-pointer ${notice.is_pinned ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-zinc-50 dark:hover:bg-white/5'}`}
                                    onClick={() => setExpandedNoticeId(isExpanded ? null : notice.id)}
                                 >
                                    <div className="flex items-center justify-between px-8 py-5">
                                       <div className="flex items-center gap-3 flex-1 min-w-0">
                                          {notice.is_pinned ? (
                                             <span className="material-symbols-outlined text-primary text-lg flex-shrink-0">push_pin</span>
                                          ) : (
                                             <span className="material-symbols-outlined text-zinc-300 dark:text-zinc-600 text-lg flex-shrink-0">article</span>
                                          )}
                                          <p className={`font-bold text-sm truncate ${notice.is_pinned ? 'text-primary' : ''}`}>{notice.title}</p>
                                       </div>
                                       <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                                          <span className="text-[10px] font-bold text-zinc-400">{dateStr}</span>
                                          <span className={`material-symbols-outlined text-zinc-400 text-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                                       </div>
                                    </div>
                                    {isExpanded && (
                                       <div className="px-8 pb-6 pt-0">
                                          <div className="bg-zinc-50 dark:bg-black/30 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800">
                                             <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">{notice.content}</p>
                                          </div>
                                       </div>
                                    )}
                                 </div>
                              );
                           })}
                     </div>

                     {/* Pagination Controls */}
                     {venueNotices.length > NOTICES_PER_PAGE && (
                        <div className="flex justify-center items-center gap-2 pt-2">
                           <button
                              onClick={() => setNoticePage(p => Math.max(1, p - 1))}
                              disabled={noticePage === 1}
                              className="size-8 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-primary hover:border-primary disabled:opacity-30 disabled:hover:border-zinc-200 disabled:hover:text-zinc-400 transition-all"
                           >
                              <span className="material-symbols-outlined text-sm">chevron_left</span>
                           </button>
                           <div className="flex items-center gap-1">
                              {Array.from({ length: Math.ceil(venueNotices.length / NOTICES_PER_PAGE) }).map((_, idx) => (
                                 <button
                                    key={idx}
                                    onClick={() => setNoticePage(idx + 1)}
                                    className={`size-8 rounded-full text-xs font-black transition-all ${noticePage === idx + 1 ? 'bg-primary text-[#1b180d] shadow-md shadow-primary/20' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                                 >
                                    {idx + 1}
                                 </button>
                              ))}
                           </div>
                           <button
                              onClick={() => setNoticePage(p => Math.min(Math.ceil(venueNotices.length / NOTICES_PER_PAGE), p + 1))}
                              disabled={noticePage === Math.ceil(venueNotices.length / NOTICES_PER_PAGE)}
                              className="size-8 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-primary hover:border-primary disabled:opacity-30 disabled:hover:border-zinc-200 disabled:hover:text-zinc-400 transition-all"
                           >
                              <span className="material-symbols-outlined text-sm">chevron_right</span>
                           </button>
                        </div>
                     )}
                  </div>
               ) : (
                  <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-primary/5 shadow-xl py-16 text-center">
                     <span className="material-symbols-outlined text-4xl text-zinc-200 dark:text-zinc-700 mb-2">campaign</span>
                     <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mt-2">등록된 공지사항이 없습니다.</p>
                  </div>
               )}
            </div>
         </div>

         {/* Message Modal */}
         {showMsgModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-lg" onClick={() => setShowMsgModal(false)}>
               <div className="bg-white dark:bg-zinc-900 rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                  {msgSuccess ? (
                     <div className="py-20 flex flex-col items-center gap-4 animate-fade-in">
                        <div className="size-20 bg-green-500/10 rounded-full flex items-center justify-center">
                           <span className="material-symbols-outlined text-green-500 text-4xl">check_circle</span>
                        </div>
                        <p className="text-lg font-black dark:text-white">메시지가 전송되었습니다!</p>
                     </div>
                  ) : (
                     <div className="p-8 space-y-6">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                 <span className="material-symbols-outlined text-primary">mail</span>
                              </div>
                              <div>
                                 <h3 className="text-lg font-black dark:text-white">{venue?.name}에게 메시지</h3>
                                 <p className="text-[10px] text-gray-400 font-bold uppercase">Direct Message</p>
                              </div>
                           </div>
                           <button onClick={() => setShowMsgModal(false)} className="size-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center dark:text-white">
                              <span className="material-symbols-outlined">close</span>
                           </button>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">제목</label>
                           <input
                              type="text"
                              value={msgSubject}
                              onChange={(e) => setMsgSubject(e.target.value)}
                              placeholder="메시지 제목 (선택사항)"
                              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 font-bold text-sm focus:border-primary outline-none transition-all dark:text-white"
                           />
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">내용 *</label>
                           <textarea
                              rows={5}
                              value={msgContent}
                              onChange={(e) => setMsgContent(e.target.value)}
                              placeholder="메시지 내용을 입력하세요..."
                              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 font-bold text-sm focus:border-primary outline-none transition-all resize-none dark:text-white"
                           />
                        </div>

                        <button
                           onClick={handleSendMessage}
                           disabled={msgSending || !msgContent.trim()}
                           className="w-full py-5 bg-primary text-[#1b180d] rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                           {msgSending ? (
                              <div className="size-5 border-2 border-[#1b180d] border-t-transparent rounded-full animate-spin"></div>
                           ) : (
                              <>
                                 <span className="material-symbols-outlined">send</span>
                                 메시지 보내기
                              </>
                           )}
                        </button>
                     </div>
                  )}
               </div>
            </div>
         )}
      </div>
   );
};

export default VenueDetail;