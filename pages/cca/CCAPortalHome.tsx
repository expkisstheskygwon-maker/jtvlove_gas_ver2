
import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/apiService';

const CCA_ID = 'c1'; // 현재 로그인된 CCA ID (추후 인증 시스템 연동)

const CCAPortalHome: React.FC = () => {
   const [loading, setLoading] = useState(true);
   const [data, setData] = useState<any>(null);
   const [attendance, setAttendance] = useState<any>(null);
   const [checkingIn, setCheckingIn] = useState(false);
   const [checkingOut, setCheckingOut] = useState(false);

   const fetchData = useCallback(async () => {
      setLoading(true);
      const result = await apiService.getCCAPortalHome(CCA_ID);
      setData(result);
      setAttendance(result.attendance);
      setLoading(false);
   }, []);

   useEffect(() => { fetchData(); }, [fetchData]);

   const handleCheckIn = async () => {
      if (!data?.cca) return;
      setCheckingIn(true);
      const result = await apiService.ccaCheckIn(CCA_ID, data.cca.venue_id || 'v1');
      if (result.success) {
         setAttendance({ status: 'checked_in', check_in_at: result.time || new Date().toISOString() });
      }
      setCheckingIn(false);
   };

   const handleCheckOut = async () => {
      if (!data?.cca) return;
      setCheckingOut(true);
      const result = await apiService.ccaCheckOut(CCA_ID, data.cca.venue_id || 'v1');
      if (result.success) {
         setAttendance({ ...attendance, status: 'checked_out', check_out_at: result.time || new Date().toISOString() });
      }
      setCheckingOut(false);
   };

   const formatTime = (dateStr: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
   };

   const formatRelativeTime = (dateStr: string) => {
      if (!dateStr) return '';
      const now = new Date();
      const d = new Date(dateStr);
      const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
      if (diff < 1) return '방금 전';
      if (diff < 60) return `${diff}분 전`;
      if (diff < 1440) return `${Math.floor(diff / 60)}시간 전`;
      return `${Math.floor(diff / 1440)}일 전`;
   };

   const todayFormatted = () => {
      const now = new Date();
      const days = ['일', '월', '화', '수', '목', '금', '토'];
      return `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 (${days[now.getDay()]})`;
   };

   if (loading) {
      return (
         <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
               <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
               <p className="text-sm font-bold text-gray-400">로딩 중...</p>
            </div>
         </div>
      );
   }

   const cca = data?.cca;
   const reservations = data?.reservations || [];
   const customerMessages = data?.customerMessages || [];
   const adminMessages = data?.adminMessages || [];
   const notices = data?.notices || [];
   const isCheckedIn = attendance?.status === 'checked_in';
   const isCheckedOut = attendance?.status === 'checked_out';
   const unreadMsgCount = customerMessages.filter((m: any) => !m.replied).length;

   return (
      <div className="space-y-6 animate-fade-in pb-8">

         {/* ──── 1. 인사 & 출석 카드 ──── */}
         <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1612] via-[#2a2318] to-[#1a1612] p-6 md:p-8 text-white">
            {/* 글로우 장식 */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-[60px] pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
               <div className="flex items-center gap-4">
                  <div className="relative">
                     <img
                        src={cca?.image || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200'}
                        className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-primary/30 shadow-xl"
                        alt="Profile"
                     />
                     {isCheckedIn && !isCheckedOut && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#1a1612] flex items-center justify-center">
                           <span className="text-[8px] text-white font-black">ON</span>
                        </div>
                     )}
                  </div>
                  <div>
                     <p className="text-xs font-bold text-primary/60 tracking-wider uppercase">{todayFormatted()}</p>
                     <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-1">
                        안녕하세요, <span className="text-primary">{cca?.name || 'CCA'}</span>님 👋
                     </h2>
                     <div className="flex items-center gap-3 mt-2">
                        <span className="px-2.5 py-0.5 bg-primary/15 text-primary text-[10px] font-black rounded-full uppercase tracking-wider">{cca?.grade || 'PRO'}</span>
                        <span className="text-xs text-gray-400 font-medium">{cca?.venue_name || 'Venue'}</span>
                     </div>
                  </div>
               </div>

               <div className="flex flex-col items-stretch md:items-end gap-3">
                  {!attendance || (!isCheckedIn && !isCheckedOut) ? (
                     <button
                        onClick={handleCheckIn}
                        disabled={checkingIn}
                        className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-yellow-500 text-[#1b180d] rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98] transition-all disabled:opacity-60"
                     >
                        <span className="material-symbols-outlined text-lg">login</span>
                        {checkingIn ? '처리 중...' : '출근하기'}
                     </button>
                  ) : isCheckedIn && !isCheckedOut ? (
                     <div className="text-right">
                        <div className="flex items-center gap-2 mb-2 justify-end">
                           <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                           <span className="text-xs font-bold text-emerald-400">근무 중</span>
                           <span className="text-xs text-gray-500">{attendance.check_in_at ? formatTime(attendance.check_in_at) + ' 출근' : ''}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium">하단의 퇴근하기 버튼을 눌러주세요</p>
                     </div>
                  ) : (
                     <div className="flex items-center gap-2 justify-end">
                        <span className="material-symbols-outlined text-sm text-gray-500">check_circle</span>
                        <span className="text-xs font-bold text-gray-400">
                           오늘 근무 완료 ({attendance.check_in_at ? formatTime(attendance.check_in_at) : ''} ~ {attendance.check_out_at ? formatTime(attendance.check_out_at) : ''})
                        </span>
                     </div>
                  )}
               </div>
            </div>
         </section>

         {/* ──── 2+3. 오늘 예약 & 고객 메시지 (좌우 배치) ──── */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white dark:bg-zinc-900/80 rounded-3xl border border-primary/5 overflow-hidden flex flex-col">
               <div className="flex items-center justify-between p-5 md:p-6 border-b border-primary/5">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-xl">calendar_today</span>
                     </div>
                     <div>
                        <h3 className="text-base font-black tracking-tight">오늘 예약</h3>
                        <p className="text-[11px] text-gray-400 font-medium">{reservations.length}건의 예약</p>
                     </div>
                  </div>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest cursor-pointer hover:underline">전체보기 →</span>
               </div>

               <div className="flex-1 overflow-auto">
                  {reservations.length === 0 ? (
                     <div className="p-8 text-center">
                        <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">event_busy</span>
                        <p className="text-sm text-gray-400 font-medium">오늘 예정된 예약이 없습니다</p>
                     </div>
                  ) : (
                     <div className="divide-y divide-primary/5">
                        {reservations.map((r: any) => (
                           <div key={r.id} className="flex items-center gap-4 p-5 md:p-6 hover:bg-primary/[0.02] transition-colors">
                              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center flex-shrink-0">
                                 <span className="text-sm font-black text-primary">{r.reservation_time}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-sm font-bold truncate">{r.customer_name}</p>
                                 <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                                    {r.reservation_time} 예약
                                 </p>
                              </div>
                              <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide flex-shrink-0 ${r.status === 'confirmed'
                                 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                 : r.status === 'pending'
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                                 }`}>
                                 {r.status === 'confirmed' ? '확정' : r.status === 'pending' ? '대기' : '취소'}
                              </span>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </section>

            {/* ──── 3. 고객 메시지 ──── */}
            <section className="bg-white dark:bg-zinc-900/80 rounded-3xl border border-primary/5 overflow-hidden flex flex-col">
               <div className="flex items-center justify-between p-5 md:p-6 border-b border-primary/5">
                  <div className="flex items-center gap-3">
                     <div className="relative w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-blue-500 text-xl">chat</span>
                        {unreadMsgCount > 0 && (
                           <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-[9px] font-black text-white">{unreadMsgCount}</span>
                           </div>
                        )}
                     </div>
                     <div>
                        <h3 className="text-base font-black tracking-tight">고객 메시지</h3>
                        <p className="text-[11px] text-gray-400 font-medium">미답변 {unreadMsgCount}건</p>
                     </div>
                  </div>
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest cursor-pointer hover:underline">전체보기 →</span>
               </div>

               <div className="flex-1 overflow-auto">
                  {customerMessages.length === 0 ? (
                     <div className="p-8 text-center">
                        <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">chat_bubble_outline</span>
                        <p className="text-sm text-gray-400 font-medium">새로운 메시지가 없습니다</p>
                     </div>
                  ) : (
                     <div className="divide-y divide-primary/5">
                        {customerMessages.map((m: any) => (
                           <div key={m.id} className={`flex items-start gap-4 p-5 md:p-6 transition-colors ${!m.replied ? 'hover:bg-blue-500/[0.02]' : 'opacity-60'}`}>
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black ${!m.replied ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-400'
                                 }`}>
                                 {m.customer_name?.charAt(0) || '?'}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-2 mb-1">
                                    <p className="text-sm font-bold truncate">{m.customer_name}</p>
                                    {!m.replied && !m.is_read && (
                                       <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                                    )}
                                 </div>
                                 <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">{m.message}</p>
                                 <p className="text-[10px] text-gray-400 mt-1.5 font-medium">{formatRelativeTime(m.created_at)}</p>
                              </div>
                              {!m.replied ? (
                                 <button className="flex-shrink-0 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors">
                                    답변
                                 </button>
                              ) : (
                                 <span className="flex-shrink-0 text-[10px] font-bold text-emerald-500">답변완료</span>
                              )}
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </section>
         </div>

         {/* ──── 4+5. 관리자 메시지 & 공지사항 (좌우 배치) ──── */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white dark:bg-zinc-900/80 rounded-3xl border border-primary/5 overflow-hidden flex flex-col">
               <div className="flex items-center justify-between p-5 md:p-6 border-b border-primary/5">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-purple-500 text-xl">shield_person</span>
                     </div>
                     <div>
                        <h3 className="text-base font-black tracking-tight">관리자 메시지</h3>
                        <p className="text-[11px] text-gray-400 font-medium">업체 관리자가 보낸 메시지</p>
                     </div>
                  </div>
               </div>

               <div className="flex-1 overflow-auto">
                  {adminMessages.length === 0 ? (
                     <div className="p-8 text-center">
                        <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">mark_email_read</span>
                        <p className="text-sm text-gray-400 font-medium">새로운 관리자 메시지가 없습니다</p>
                     </div>
                  ) : (
                     <div className="divide-y divide-primary/5">
                        {adminMessages.map((m: any) => (
                           <div key={m.id} className={`p-5 md:p-6 transition-colors hover:bg-purple-500/[0.02] ${m.is_read ? 'opacity-60' : ''}`}>
                              <div className="flex items-start gap-4">
                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${m.priority === 'urgent' ? 'bg-red-500/15' :
                                    m.priority === 'important' ? 'bg-amber-500/15' : 'bg-purple-500/10'
                                    }`}>
                                    <span className={`material-symbols-outlined text-lg ${m.priority === 'urgent' ? 'text-red-500' :
                                       m.priority === 'important' ? 'text-amber-500' : 'text-purple-400'
                                       }`}>
                                       {m.priority === 'urgent' ? 'priority_high' : m.priority === 'important' ? 'star' : 'mail'}
                                    </span>
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                       {m.priority !== 'normal' && (
                                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${m.priority === 'urgent' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-600'
                                             }`}>
                                             {m.priority === 'urgent' ? '긴급' : '중요'}
                                          </span>
                                       )}
                                       <p className="text-sm font-bold">{m.title}</p>
                                       {!m.is_read && <span className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></span>}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{m.message}</p>
                                    <div className="flex items-center gap-3 mt-2">
                                       <p className="text-[10px] text-gray-400 font-medium">{m.sender_name}</p>
                                       <span className="text-[10px] text-gray-300 dark:text-gray-600">•</span>
                                       <p className="text-[10px] text-gray-400 font-medium">{formatRelativeTime(m.created_at)}</p>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </section>

            {/* ──── 5. 공지사항 ──── */}
            <section className="bg-white dark:bg-zinc-900/80 rounded-3xl border border-primary/5 overflow-hidden flex flex-col">
               <div className="flex items-center justify-between p-5 md:p-6 border-b border-primary/5">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-orange-500 text-xl">campaign</span>
                     </div>
                     <div>
                        <h3 className="text-base font-black tracking-tight">공지사항</h3>
                        <p className="text-[11px] text-gray-400 font-medium">{cca?.venue_name || 'Venue'} 공지</p>
                     </div>
                  </div>
               </div>

               <div className="flex-1 overflow-auto">
                  {notices.length === 0 ? (
                     <div className="p-8 text-center">
                        <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">notifications_none</span>
                        <p className="text-sm text-gray-400 font-medium">등록된 공지사항이 없습니다</p>
                     </div>
                  ) : (
                     <div className="divide-y divide-primary/5">
                        {notices.map((n: any) => (
                           <div key={n.id} className="p-5 md:p-6 hover:bg-orange-500/[0.02] transition-colors cursor-pointer group">
                              <div className="flex items-start gap-3">
                                 {n.is_pinned ? (
                                    <span className="material-symbols-outlined text-sm text-orange-500 mt-0.5 flex-shrink-0 fill-1">push_pin</span>
                                 ) : (
                                    <span className="material-symbols-outlined text-sm text-gray-300 dark:text-gray-600 mt-0.5 flex-shrink-0">article</span>
                                 )}
                                 <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-bold group-hover:text-primary transition-colors ${n.is_pinned ? 'text-orange-600 dark:text-orange-400' : ''}`}>
                                       {n.title}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{n.content}</p>
                                    <p className="text-[10px] text-gray-400 mt-2 font-medium">{formatRelativeTime(n.created_at)}</p>
                                 </div>
                                 <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 group-hover:text-primary transition-colors flex-shrink-0">chevron_right</span>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </section>
         </div>

         {/* ──── 6. 퇴근하기 버튼 ──── */}
         {isCheckedIn && !isCheckedOut && (
            <section className="sticky bottom-20 lg:bottom-4 z-40">
               <button
                  onClick={handleCheckOut}
                  disabled={checkingOut}
                  className="w-full flex items-center justify-center gap-3 py-5 bg-gradient-to-r from-rose-600 to-red-500 text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-2xl shadow-red-500/30 hover:shadow-red-500/50 active:scale-[0.99] transition-all disabled:opacity-60"
               >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  {checkingOut ? '처리 중...' : '퇴근하기'}
               </button>
            </section>
         )}

         {isCheckedOut && (
            <section className="text-center pb-4">
               <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-white/5 rounded-2xl">
                  <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>
                  <span className="text-sm font-bold text-gray-500">
                     오늘 근무가 완료되었습니다. 수고하셨습니다! 🎉
                  </span>
               </div>
            </section>
         )}
      </div>
   );
};

export default CCAPortalHome;
