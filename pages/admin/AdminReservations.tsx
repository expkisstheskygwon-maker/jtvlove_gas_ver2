
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../../services/apiService';
import { RESERVATIONS, CCAS } from '../../constants';
import { Reservation, CCA, Venue, CCAStatus } from '../../types';

const AdminReservations: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('2023-11-20');
  const [viewDate, setViewDate] = useState(new Date(2023, 10, 1)); // Nov 2023
  const [venue, setVenue] = useState<Venue | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>(RESERVATIONS);
  const [showManagePopup, setShowManagePopup] = useState<string | null>(null); // time slot for popup
  const [isHolidayMode, setIsHolidayMode] = useState(false);
  const [selectedHolidays, setSelectedHolidays] = useState<string[]>([]);

  useEffect(() => {
    fetchVenue();
  }, []);

  const fetchVenue = async () => {
    const data = await apiService.getVenueById('v1');
    if (data) setVenue(data);
  };

  // --- Date Helpers ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const isPast = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  };

  const getDayStatusColor = (status: CCAStatus | string) => {
    switch (status) {
      case 'absent': return 'bg-orange-500 text-white';
      case 'off': return 'bg-blue-500 text-white';
      case 'late': return 'bg-red-500 text-white';
      default: return 'bg-gray-100 dark:bg-white/5 text-gray-500';
    }
  };

  // --- Time Slot Generation ---
  const generateTimeSlots = () => {
    if (!venue?.operating_hours) return ['19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00'];
    const { open, close } = venue.operating_hours;
    let slots: string[] = [];
    let current = parseInt(open.split(':')[0]);
    let end = parseInt(close.split(':')[0]);
    if (end < current) end += 24;

    for (let h = current; h <= end; h++) {
      const hour = h % 24;
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const dayReservations = reservations.filter(r => r.date === selectedDate);

  const toggleHoliday = (date: string) => {
    if (selectedHolidays.includes(date)) {
      setSelectedHolidays(selectedHolidays.filter(d => d !== date));
    } else {
      setSelectedHolidays([...selectedHolidays, date]);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
      {/* LEFT: Calendar Section */}
      <div className="xl:col-span-12 2xl:col-span-12 bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-primary/10">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
          <div>
            <h3 className="text-3xl font-black italic uppercase italic">
              {viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월
            </h3>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">Reservation Calendar</p>
          </div>
          <div className="flex gap-4">
            <button onClick={handlePrevMonth} className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl hover:bg-primary hover:text-[#1b180d] transition-all group">
              <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">chevron_left</span>
            </button>
            <button onClick={handleNextMonth} className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl hover:bg-primary hover:text-[#1b180d] transition-all group">
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">chevron_right</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-3">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
            <div key={d} className="text-center text-[10px] font-black text-gray-400 py-4 tracking-[0.2em]">{d}</div>
          ))}
          {Array.from({ length: getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth()) }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth()) }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = selectedDate === dateStr;
            const isHoliday = selectedHolidays.includes(dateStr);
            const resCount = reservations.filter(r => r.date === dateStr).length;
            const past = isPast(dateStr);

            return (
              <button
                key={i}
                onClick={() => isHolidayMode ? toggleHoliday(dateStr) : setSelectedDate(dateStr)}
                className={`aspect-square rounded-[2rem] p-4 flex flex-col items-center justify-between border-2 transition-all relative overflow-hidden group 
                  ${isSelected ? 'bg-primary border-primary text-[#1b180d] shadow-xl shadow-primary/20 scale-105 z-10' : 'bg-transparent border-primary/5 hover:border-primary/40'}
                  ${past ? 'grayscale opacity-50 bg-gray-50/50' : ''}
                  ${isHoliday ? 'ring-4 ring-blue-500 ring-offset-4 dark:ring-offset-zinc-950 shadow-lg' : ''}
                `}
              >
                <span className={`text-base font-black ${isSelected ? 'text-[#1b180d]' : 'text-gray-600 dark:text-gray-300'}`}>{day}</span>
                {resCount > 0 && !isHoliday && (
                  <div className={`text-[10px] font-black px-2.5 py-1 rounded-full ${isSelected ? 'bg-white/50 animate-pulse' : 'bg-primary/20 text-primary'}`}>
                    {resCount}
                  </div>
                )}
                {isHoliday && <div className="absolute top-2 right-2 size-3 bg-blue-500 rounded-full shadow-lg border-2 border-white" />}
              </button>
            );
          })}
        </div>

        {/* Day Summary */}
        <div className="mt-12 space-y-6 bg-gray-50/50 dark:bg-white/5 p-8 rounded-[2.5rem] border border-primary/5">
          <div className="flex items-center justify-between border-b border-primary/10 pb-4">
            <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-primary">analytics</span> Day Summary — {selectedDate}
            </h4>
          </div>
          <div className="flex flex-wrap gap-3">
            {reservations.filter(r => r.date === selectedDate).map(res => {
              const targetCcaIds = res.ccaIds || (res.ccaId ? [res.ccaId] : []);
              return targetCcaIds.map(cid => {
                const cca = CCAS.find((c: CCA) => c.id === cid);
                if (!cca || cca.status === 'active') return null;
                return (
                  <div key={`${res.id}-${cid}`} className={`text-[11px] font-black px-5 py-3 rounded-2xl shadow-sm flex items-center gap-3 animate-fade-in border border-white/10 ${getDayStatusColor(cca.status || '')}`}>
                    <span className="material-symbols-outlined text-[16px]">
                      {cca.status === 'absent' ? 'block' : cca.status === 'off' ? 'event_busy' : 'schedule'}
                    </span>
                    {cca.name} ({res.time})
                  </div>
                );
              });
            })}
            {dayReservations.length === 0 && <p className="text-gray-400 text-xs italic font-bold">No summary data available for this date.</p>}
          </div>

          <div className="pt-4 flex gap-4">
            <button
              onClick={() => setIsHolidayMode(!isHolidayMode)}
              className={`flex-1 py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${isHolidayMode ? 'bg-blue-600 text-white shadow-xl scale-95' : 'bg-[#1b180d] text-white hover:bg-primary hover:text-[#1b180d]'}`}
            >
              <span className="material-symbols-outlined text-lg">{isHolidayMode ? 'check_circle' : 'event_busy'}</span>
              {isHolidayMode ? 'Finish Selection' : 'Set Holiday Group'}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: Detail View */}
      <div className="xl:col-span-12 2xl:col-span-12 space-y-8 mt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-primary/10 shadow-sm">
          <div>
            <h3 className="text-4xl font-black tracking-tight uppercase italic flex items-center gap-4">
              {selectedDate}
              <span className="text-sm font-bold text-primary not-italic tracking-normal bg-primary/10 px-4 py-2 rounded-full uppercase">Today's Schedule</span>
            </h3>
            <p className="text-sm font-bold text-gray-500 mt-2">1-hour intervals based on venue operating hours</p>
          </div>
          <div className="flex bg-gray-50 dark:bg-zinc-950 p-3 rounded-[2rem] border border-primary/5">
            <div className="px-8 py-4 border-r border-primary/10 text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CCA Requests</p>
              <p className="text-3xl font-black text-primary mt-1">{dayReservations.reduce((acc, r) => acc + (r.ccaIds?.length || (r.ccaId ? 1 : 0)), 0)}</p>
            </div>
            <div className="px-8 py-4 text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tables/Rooms</p>
              <p className="text-3xl font-black text-primary mt-1">{dayReservations.filter(r => r.tableId || r.roomId).length}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {timeSlots.map(time => {
            const slotReservations = dayReservations.filter(r => r.time === time);
            const requestCount = slotReservations.reduce((acc, r) => acc + (r.ccaIds?.length || (r.ccaId ? 1 : 0)), 0);
            const tableRoomCount = slotReservations.filter(r => r.tableId || r.roomId).length;

            return (
              <div key={time} className={`group flex items-stretch bg-white dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden border-2 transition-all p-2 ${slotReservations.length > 0 ? 'border-primary/30 shadow-2xl scale-[1.02] z-10' : 'border-primary/5 opacity-80'}`}>
                <div className={`w-28 md:w-40 flex flex-col items-center justify-center rounded-[2rem] ${slotReservations.length > 0 ? 'bg-primary text-[#1b180d]' : 'bg-gray-50 dark:bg-zinc-950 text-gray-400'}`}>
                  <span className="text-3xl font-black">{time}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-60">{slotReservations.length > 0 ? 'Active' : 'Empty'}</span>
                </div>

                <div className="flex-1 px-8 py-6 flex flex-col justify-center gap-4">
                  {slotReservations.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CCA Requests</p>
                          <p className="text-sm font-black text-primary">REQUEST : {requestCount}</p>
                        </div>
                        <div className="h-1 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${Math.min(100, requestCount * 20)}%` }} />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inventory</p>
                          <p className="text-sm font-black text-primary">T/R : {tableRoomCount}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowManagePopup(time)}
                        className="w-full mt-2 py-4 bg-[#1b180d] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-[#1b180d] transition-all shadow-lg hover:shadow-primary/30"
                      >
                        Manage Details
                      </button>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-300 dark:text-gray-700 italic border-2 border-dashed border-gray-100 dark:border-white/5 rounded-2xl">
                      <span className="material-symbols-outlined text-4xl mb-2 opacity-20">event_available</span>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-40">No bookings for this slot</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* POPUP: Detail Management */}
      <AnimatePresence>
        {showManagePopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowManagePopup(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ y: 100, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 100, opacity: 0, scale: 0.9 }}
              className="bg-[#1b180d] border border-primary/30 w-full max-w-6xl md:h-[85vh] rounded-[4rem] overflow-hidden shadow-[0_0_100px_rgba(238,206,108,0.15)] z-10 flex flex-col relative"
            >
              <div className="p-12 border-b border-primary/10 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                <div>
                  <h4 className="text-5xl font-black text-white italic uppercase tracking-tighter">Reservation Control</h4>
                  <div className="flex items-center gap-6 mt-4">
                    <p className="text-[11px] font-black text-primary bg-primary/10 px-5 py-2.5 rounded-full uppercase tracking-[0.3em] flex items-center gap-3">
                      <span className="material-symbols-outlined text-sm">event</span>
                      {selectedDate}
                    </p>
                    <p className="text-[11px] font-black text-white bg-white/5 px-5 py-2.5 rounded-full uppercase tracking-[0.3em] flex items-center gap-3">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {showManagePopup} Slot
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowManagePopup(null)} className="size-20 flex items-center justify-center rounded-[2.5rem] bg-white/5 text-white hover:bg-primary hover:text-[#1b180d] hover:rotate-90 transition-all duration-700 active:scale-90">
                  <span className="material-symbols-outlined text-4xl font-light">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 space-y-12">
                {dayReservations.filter(r => r.time === showManagePopup).map(res => (
                  <div key={res.id} className="bg-white/5 border border-primary/10 p-10 rounded-[3.5rem] space-y-10 group hover:bg-white/[0.07] transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />

                    <div className="flex flex-col xl:flex-row justify-between gap-10">
                      <div className="flex gap-8">
                        <div className="size-24 rounded-[2rem] bg-primary flex items-center justify-center text-[#1b180d] shadow-2xl shadow-primary/20">
                          <span className="material-symbols-outlined text-5xl">person_filled</span>
                        </div>
                        <div className="flex flex-col justify-center">
                          <h5 className="text-3xl font-black text-white tracking-tight">{res.customerName} <span className="text-primary/40 ml-3 text-xl font-bold">Group of {res.groupSize}</span></h5>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="material-symbols-outlined text-primary text-base">location_on</span>
                            <p className="text-sm text-gray-400 font-black uppercase tracking-[0.2em]">{res.roomId ? res.roomName : res.tableName || 'Standby'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="xl:text-right flex items-center xl:items-end flex-col justify-center gap-2">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Status</p>
                        <span className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl ${res.status === 'confirmed' ? 'bg-green-600 text-white' : 'bg-primary text-[#1b180d]'}`}>
                          {res.status}
                        </span>
                      </div>
                    </div>

                    {/* Requested CCAs Grid */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-white/10" />
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Requested Personnel</p>
                        <div className="h-px flex-1 bg-white/10" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(res.ccaIds || (res.ccaId ? [res.ccaId] : [])).map(cid => {
                          const cca = CCAS.find((c: CCA) => c.id === cid);
                          return (
                            <div key={cid} className="flex items-center gap-5 bg-[#0a0a0a] p-5 rounded-[2rem] border border-white/5 group-hover:border-primary/20 transition-all hover:scale-105 active:scale-95 cursor-pointer">
                              <div className="size-16 rounded-2xl overflow-hidden border-2 border-primary/20">
                                <img src={cca?.image} className="w-full h-full object-cover" alt={cca?.nickname} />
                              </div>
                              <div>
                                <p className="font-black text-lg text-white tracking-tight">{cca?.nickname || 'Unknown'}</p>
                                <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest mt-1 inline-block ${cca?.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                  {cca?.status}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {res.customerNote && (
                      <div className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/5 relative group/note">
                        <span className="material-symbols-outlined absolute top-4 left-4 text-primary/30 text-4xl select-none">format_quote</span>
                        <p className="text-gray-400 text-base italic leading-relaxed pl-8">
                          {res.customerNote}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap justify-end gap-5 pt-4">
                      <button className="flex-1 sm:flex-none px-10 py-5 rounded-[1.5rem] border-2 border-red-500/20 text-red-500 font-black text-xs uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all active:scale-95">Cancel</button>
                      <button className="flex-1 sm:flex-none px-10 py-5 rounded-[1.5rem] bg-primary text-[#1b180d] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">Verify & Update</button>
                    </div>
                  </div>
                ))}

                <div className="pt-16 border-t border-white/10 flex flex-col md:flex-row gap-10 items-center justify-center">
                  {[
                    { label: 'Available Tables', val: (venue?.tables?.length || 10) - dayReservations.filter(r => r.time === showManagePopup && r.tableId).length, icon: 'table_bar' },
                    { label: 'Available Rooms', val: (venue?.rooms?.length || 5) - dayReservations.filter(r => r.time === showManagePopup && r.roomId).length, icon: 'door_front' },
                    { label: 'Active Personnel', val: CCAS.filter((c: CCA) => c.status === 'active').length, icon: 'groups' }
                  ].map(stat => (
                    <div key={stat.label} className="bg-white/5 px-12 py-8 rounded-[2.5rem] border border-white/5 flex flex-col items-center min-w-[240px] hover:bg-white/[0.08] transition-colors border-b-4 border-b-primary/40">
                      <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-primary text-3xl">{stat.icon}</span>
                      </div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">{stat.label}</p>
                      <p className="text-4xl font-black text-white mt-3 italic">{stat.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminReservations;
