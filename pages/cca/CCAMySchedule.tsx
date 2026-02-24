
import React, { useState, useEffect } from 'react';
import { RESERVATIONS } from '../../constants';
import { Reservation } from '../../types';
import { apiService } from '../../services/apiService';

const CCAMySchedule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('2023-11-20');
  const [appointments, setAppointments] = useState<Reservation[]>(RESERVATIONS);
  const [dayOffDates, setDayOffDates] = useState<Set<string>>(new Set());
  const [soldOutDates, setSoldOutDates] = useState<Set<string>>(new Set());
  
  // Modal States
  const [showDayDetailModal, setShowDayDetailModal] = useState(false);
  const [showDayOffModal, setShowDayOffModal] = useState(false);
  const [showAddAppointmentModal, setShowAddAppointmentModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);

  // Holiday Modal Calendar State
  const [viewDate, setViewDate] = useState(new Date(2023, 10, 1)); // Nov 2023
  const [isSyncingHolidays, setIsSyncingHolidays] = useState(false);

  const currentCcaId = 'c1';

  useEffect(() => {
    loadHolidays();
    loadSoldOutDates();
  }, []);

  const loadHolidays = async () => {
    const dates = await apiService.getHolidays(currentCcaId);
    setDayOffDates(new Set(dates));
  };

  const loadSoldOutDates = async () => {
    const dates = await apiService.getSoldOutDates(currentCcaId);
    setSoldOutDates(new Set(dates));
  };

  // Status Colors for Calendar
  const getDayStatus = (dateStr: string) => {
    // 1. Day Off (Gray)
    if (dayOffDates.has(dateStr)) return 'bg-gray-400 text-white';
    
    // 2. Sold Out (Red)
    if (soldOutDates.has(dateStr)) return 'bg-red-500 text-white';
    
    // 3. Available (Blue) - At least 1 reservation
    const hasRes = appointments.some(r => r.date === dateStr);
    if (hasRes) return 'bg-blue-500 text-white';
    
    // 4. None - No display
    return 'bg-transparent text-gray-700 dark:text-gray-300';
  };

  const dayReservations = appointments.filter(r => r.date === selectedDate);

  const handleToggleDayOff = (date: string) => {
    const newDayOff = new Set(dayOffDates);
    if (newDayOff.has(date)) {
      newDayOff.delete(date);
    } else {
      newDayOff.add(date);
    }
    setDayOffDates(newDayOff);
  };

  const handleToggleSoldOut = async (date: string) => {
    const newSoldOut = new Set(soldOutDates);
    if (newSoldOut.has(date)) {
      newSoldOut.delete(date);
    } else {
      newSoldOut.add(date);
    }
    setSoldOutDates(newSoldOut);
    // Auto-sync sold out status to DB
    await apiService.syncSoldOutDates(currentCcaId, Array.from(newSoldOut));
  };

  const handleSaveHolidays = async () => {
    setIsSyncingHolidays(true);
    const success = await apiService.syncHolidays(currentCcaId, Array.from(dayOffDates));
    if (success) {
      setShowDayOffModal(false);
    } else {
      alert("Failed to sync holidays");
    }
    setIsSyncingHolidays(false);
  };

  const handleAddAppointment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newRes: Reservation = {
      id: Math.random().toString(36).substr(2, 9),
      venueId: 'v1',
      ccaId: 'c1',
      ccaName: 'Yumi Kim',
      customerName: formData.get('customerName') as string,
      customerNote: formData.get('note') as string,
      time: formData.get('time') as string,
      date: selectedDate,
      status: 'pending',
      shortMessage: formData.get('note') as string,
    };
    setAppointments([...appointments, newRes]);
    setShowAddAppointmentModal(false);
  };

  const handleUpdateStatus = (id: string, status: Reservation['status']) => {
    setAppointments(appointments.map(r => r.id === id ? { ...r, status } : r));
    setShowManageModal(false);
  };

  // Calendar Helpers for Modal
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderHolidayCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const monthName = viewDate.toLocaleString('default', { month: 'long' });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => setViewDate(new Date(year, month - 1, 1))}
            className="size-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <h4 className="text-xl font-black uppercase tracking-widest">{monthName} {year}</h4>
          <button 
            onClick={() => setViewDate(new Date(year, month + 1, 1))}
            className="size-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-center text-[10px] font-black text-gray-400 py-2">{d}</div>)}
          {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isDayOff = dayOffDates.has(dateStr);
            return (
              <button
                key={day}
                onClick={() => handleToggleDayOff(dateStr)}
                className={`aspect-square rounded-xl flex items-center justify-center text-sm font-black transition-all ${isDayOff ? 'bg-gray-400 text-white shadow-lg' : 'bg-gray-50 dark:bg-white/5 hover:bg-primary/10'}`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start animate-fade-in pb-20">
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
                {Array.from({length: 30}).map((_, i) => {
                  const dateStr = `2023-11-${String(i+1).padStart(2, '0')}`;
                  return (
                    <button 
                      key={i} 
                      onClick={() => setSelectedDate(dateStr)}
                      className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${getDayStatus(dateStr)} ${selectedDate === dateStr ? 'ring-4 ring-primary !bg-primary !text-[#1b180d]' : ''}`}
                    >
                       <span className="text-sm font-black">{i+1}</span>
                       {soldOutDates.has(dateStr) && <span className="text-[8px] font-black uppercase opacity-60">Full</span>}
                    </button>
                  );
                })}
             </div>
             
             {/* Legend */}
             <div className="mt-10 flex flex-wrap gap-4 pt-10 border-t border-primary/5">
                <div className="flex items-center gap-2"><div className="size-3 rounded-full bg-red-500"></div><span className="text-[9px] font-black uppercase text-gray-400">Sold Out</span></div>
                <div className="flex items-center gap-2"><div className="size-3 rounded-full bg-blue-500"></div><span className="text-[9px] font-black uppercase text-gray-400">Available</span></div>
                <div className="flex items-center gap-2"><div className="size-3 rounded-full bg-gray-400"></div><span className="text-[9px] font-black uppercase text-gray-400">Day Off</span></div>
             </div>
          </div>
       </div>

       {/* Right: Detailed View */}
       <div className="xl:col-span-7 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-[3rem] p-10 border border-primary/5 shadow-sm space-y-10">
             <div className="flex items-center justify-between border-b border-primary/5 pb-8">
                <div>
                   <h4 className="text-2xl font-black">{selectedDate}</h4>
                   <div className="flex items-center gap-4 mt-1">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Timeline Detail</p>
                      <button 
                        onClick={() => handleToggleSoldOut(selectedDate)}
                        className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border transition-all ${soldOutDates.has(selectedDate) ? 'bg-red-500 border-red-500 text-white' : 'border-primary/20 text-gray-400 hover:border-red-500 hover:text-red-500'}`}
                      >
                        {soldOutDates.has(selectedDate) ? 'Sold Out' : 'Mark Sold Out'}
                      </button>
                   </div>
                </div>
                <button 
                  onClick={() => setShowDayDetailModal(true)}
                  className="material-symbols-outlined size-12 flex items-center justify-center bg-primary/10 text-primary rounded-full hover:scale-110 transition-all"
                >
                  more_horiz
                </button>
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
                                  {res.customerGrade === 'VIP' && <span className="text-[8px] font-black px-2 py-0.5 bg-primary text-[#1b180d] rounded-full">VIP</span>}
                               </div>
                               <p className="text-xs italic text-gray-400 font-bold truncate max-w-[150px]">"{res.shortMessage}"</p>
                            </div>
                         </div>
                         <button 
                           onClick={() => {
                             setSelectedRes(res);
                             setShowManageModal(true);
                           }}
                           className="px-6 py-2.5 bg-white dark:bg-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:scale-105 transition-all"
                         >
                           Manage
                         </button>
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
             <button 
               onClick={() => setShowDayOffModal(true)}
               className="h-16 bg-white dark:bg-zinc-900 border border-primary/10 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-primary transition-all"
             >
               Set Day Off
             </button>
             <button 
               onClick={() => setShowAddAppointmentModal(true)}
               className="h-16 bg-background-dark text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all"
             >
               Add Appointment
             </button>
          </div>
       </div>

       {/* Day Detail Modal */}
       {showDayDetailModal && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl animate-scale-in border border-primary/10">
             <div className="flex items-center justify-between mb-8">
               <h3 className="text-2xl font-black tracking-tight">{selectedDate} Full Schedule</h3>
               <button onClick={() => setShowDayDetailModal(false)} className="size-10 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center"><span className="material-symbols-outlined">close</span></button>
             </div>
             <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
               {dayReservations.map(res => (
                 <div key={res.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-primary/5">
                   <div className="flex items-center gap-4">
                     <span className="text-sm font-black w-16">{res.time}</span>
                     <div>
                       <p className="font-black">{res.customerName}</p>
                       <p className="text-[10px] text-gray-400 uppercase font-black">{res.status}</p>
                     </div>
                   </div>
                   <button 
                     onClick={() => {
                       setSelectedRes(res);
                       setShowManageModal(true);
                       setShowDayDetailModal(false);
                     }}
                     className="text-primary font-black text-[10px] uppercase tracking-widest"
                   >
                     Manage
                   </button>
                 </div>
               ))}
               {dayReservations.length === 0 && <p className="text-center py-10 text-gray-400 font-bold">No appointments scheduled.</p>}
             </div>
           </div>
         </div>
       )}

       {/* Day Off Modal (Multi-date Calendar) */}
       {showDayOffModal && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-scale-in border border-primary/10">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black tracking-tight">Manage Day Offs</h3>
                <button onClick={() => setShowDayOffModal(false)} className="size-10 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center"><span className="material-symbols-outlined">close</span></button>
             </div>
             
             {renderHolidayCalendar()}

             <div className="mt-10 flex gap-4">
               <button 
                 onClick={handleSaveHolidays}
                 disabled={isSyncingHolidays}
                 className="flex-1 py-4 bg-primary text-[#1b180d] rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
               >
                 {isSyncingHolidays ? (
                   <div className="size-4 border-2 border-[#1b180d] border-t-transparent rounded-full animate-spin"></div>
                 ) : (
                   <>
                     <span className="material-symbols-outlined text-sm">save</span>
                     Save Changes
                   </>
                 )}
               </button>
               <button 
                 onClick={() => setShowDayOffModal(false)}
                 className="flex-1 py-4 bg-gray-100 dark:bg-white/5 rounded-2xl font-black uppercase text-xs tracking-widest"
               >
                 Cancel
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Add Appointment Modal */}
       {showAddAppointmentModal && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
           <form onSubmit={handleAddAppointment} className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-scale-in border border-primary/10">
             <h3 className="text-2xl font-black tracking-tight mb-8">Add Appointment</h3>
             <div className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Customer Name</label>
                 <input name="customerName" required type="text" className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl p-4 font-bold text-sm" placeholder="Name" />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Time</label>
                 <input name="time" required type="time" className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl p-4 font-bold text-sm" />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Note</label>
                 <textarea name="note" className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl p-4 font-bold text-sm h-24 resize-none" placeholder="Short message..."></textarea>
               </div>
               <div className="flex gap-4 pt-4">
                 <button type="submit" className="flex-1 py-4 bg-primary text-[#1b180d] rounded-2xl font-black uppercase text-xs tracking-widest">Add</button>
                 <button type="button" onClick={() => setShowAddAppointmentModal(false)} className="flex-1 py-4 bg-gray-100 dark:bg-white/5 rounded-2xl font-black uppercase text-xs tracking-widest">Cancel</button>
               </div>
             </div>
           </form>
         </div>
       )}

       {/* Manage Modal */}
       {showManageModal && selectedRes && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-scale-in border border-primary/10">
             <h3 className="text-2xl font-black tracking-tight mb-4">Manage Appointment</h3>
             <p className="text-gray-400 font-bold text-sm mb-8">Customer: {selectedRes.customerName} at {selectedRes.time}</p>
             <div className="grid grid-cols-1 gap-4">
               <button 
                 onClick={() => handleUpdateStatus(selectedRes.id, 'confirmed')}
                 className="py-4 bg-green-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest"
               >
                 Confirm
               </button>
               <button 
                 onClick={() => handleUpdateStatus(selectedRes.id, 'no_show')}
                 className="py-4 bg-red-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest"
               >
                 Mark No Show
               </button>
               <button 
                 onClick={() => handleUpdateStatus(selectedRes.id, 'cancelled')}
                 className="py-4 bg-gray-400 text-white rounded-2xl font-black uppercase text-xs tracking-widest"
               >
                 Cancel Appointment
               </button>
               <button 
                 onClick={() => setShowManageModal(false)}
                 className="py-4 bg-gray-100 dark:bg-white/5 rounded-2xl font-black uppercase text-xs tracking-widest"
               >
                 Close
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
};

export default CCAMySchedule;
