
import React, { useState } from 'react';
import { RESERVATIONS } from '../../constants';

const CCAMySchedule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('2023-11-20');
  
  // Status Colors for Calendar (Simplified Logic)
  const getDayStatus = (day: number) => {
    if (day === 15) return 'bg-red-100 text-red-500'; // Holiday
    if (day === 20) return 'bg-blue-100 text-blue-500'; // Sold Out
    if (day === 22) return 'bg-yellow-100 text-yellow-600 line-through'; // Cancelled
    return 'bg-transparent';
  };

  const dayReservations = RESERVATIONS.filter(r => r.date === selectedDate);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start animate-fade-in">
       {/* Left: Premium Calendar */}
       <div className="xl:col-span-5 space-y-8">
          <div className="flex items-center justify-between">
             <h3 className="text-3xl font-black tracking-tight">My Schedule</h3>
             <div className="flex gap-2">
                <button className="size-10 rounded-2xl border border-primary/10 flex items-center justify-center hover:bg-primary/10 transition-colors"><span className="material-symbols-outlined">chevron_left</span></button>
                <button className="size-10 rounded-2xl border border-primary/10 flex items-center justify-center hover:bg-primary/10 transition-colors"><span className="material-symbols-outlined">chevron_right</span></button>
             </div>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 rounded-[3rem] p-10 border border-primary/5 shadow-2xl overflow-hidden relative">
             <div className="absolute top-0 right-0 size-48 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
             
             <div className="grid grid-cols-7 gap-4 relative z-10">
                {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-center text-[10px] font-black text-gray-300 py-4">{d}</div>)}
                {Array.from({length: 30}).map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setSelectedDate(`2023-11-${String(i+1).padStart(2, '0')}`)}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${getDayStatus(i+1)} ${selectedDate.endsWith(String(i+1).padStart(2, '0')) ? 'ring-4 ring-primary bg-primary text-[#1b180d]' : ''}`}
                  >
                     <span className="text-sm font-black">{i+1}</span>
                     {i === 19 && <span className="text-[8px] font-black uppercase opacity-60">Full</span>}
                  </button>
                ))}
             </div>
             
             {/* Legend */}
             <div className="mt-10 flex flex-wrap gap-4 pt-10 border-t border-primary/5">
                <div className="flex items-center gap-2"><div className="size-3 rounded-full bg-blue-100"></div><span className="text-[9px] font-black uppercase text-gray-400">Sold Out</span></div>
                <div className="flex items-center gap-2"><div className="size-3 rounded-full bg-red-100"></div><span className="text-[9px] font-black uppercase text-gray-400">Holiday</span></div>
                <div className="flex items-center gap-2"><div className="size-3 rounded-full bg-yellow-100"></div><span className="text-[9px] font-black uppercase text-gray-400">No Show</span></div>
             </div>
          </div>
       </div>

       {/* Right: Detailed View */}
       <div className="xl:col-span-7 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-[3rem] p-10 border border-primary/5 shadow-sm space-y-10">
             <div className="flex items-center justify-between border-b border-primary/5 pb-8">
                <div>
                   <h4 className="text-2xl font-black">{selectedDate}</h4>
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Timeline Detail</p>
                </div>
                <button className="material-symbols-outlined size-12 flex items-center justify-center bg-primary/10 text-primary rounded-full">more_horiz</button>
             </div>

             <div className="space-y-6">
                {dayReservations.length > 0 ? dayReservations.map((res, idx) => (
                   <div key={res.id} className={`flex items-stretch gap-6 group`}>
                      <div className="flex flex-col items-center gap-2 py-2">
                         <span className="text-lg font-black">{res.time}</span>
                         <div className="flex-1 w-0.5 bg-primary/20 rounded-full group-last:hidden"></div>
                      </div>
                      <div className="flex-1 bg-background-light dark:bg-white/5 rounded-3xl p-6 border border-primary/5 flex items-center justify-between hover:border-primary/30 transition-all cursor-pointer">
                         <div className="flex items-center gap-4">
                            <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                               <span className="material-symbols-outlined">{idx % 2 === 0 ? 'verified_user' : 'stars'}</span>
                            </div>
                            <div>
                               <div className="flex items-center gap-2">
                                  <span className="font-black text-lg">{res.customerName}</span>
                                  <span className="text-[8px] font-black px-2 py-0.5 bg-primary text-[#1b180d] rounded-full">VIP</span>
                               </div>
                               <p className="text-xs italic text-gray-400 font-bold truncate max-w-[150px]">"{res.shortMessage}"</p>
                            </div>
                         </div>
                         <button className="px-6 py-2.5 bg-white dark:bg-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:scale-105 transition-all">Manage</button>
                      </div>
                   </div>
                )) : (
                   <div className="py-20 text-center space-y-4 opacity-40">
                      <span className="material-symbols-outlined text-6xl">event_busy</span>
                      <p className="font-black uppercase tracking-widest text-xs">No Requests for this Day</p>
                   </div>
                )}
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
             <button className="h-16 bg-white dark:bg-zinc-900 border border-primary/10 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-primary transition-all">Set Holiday</button>
             <button className="h-16 bg-background-dark text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all">Add Appointment</button>
          </div>
       </div>
    </div>
  );
};

export default CCAMySchedule;
