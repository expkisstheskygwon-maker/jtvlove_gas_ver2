
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
  const [direction, setDirection] = useState(0);

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

  const handlePrevMonth = () => {
    setDirection(-1);
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setDirection(1);
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

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

  const calendarVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in relative">

      {/* LEFT: Calendar Section */}
      <div className="lg:col-span-5 xl:col-span-4 space-y-8 sticky top-8">
        <section className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 shadow-sm border border-primary/10 overflow-hidden relative">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-black italic uppercase italic text-[#1b180d] dark:text-white">
                {viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월
              </h3>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">Select Reservation Date</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrevMonth}
                className="size-10 flex items-center justify-center bg-gray-50 dark:bg-white/5 rounded-xl hover:bg-primary hover:text-[#1b180d] transition-all"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button
                onClick={handleNextMonth}
                className="size-10 flex items-center justify-center bg-gray-50 dark:bg-white/5 rounded-xl hover:bg-primary hover:text-[#1b180d] transition-all"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="relative min-h-[320px]">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={viewDate.getMonth()}
                custom={direction}
                variants={calendarVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                className="w-full"
              >
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                    <div key={d} className="text-center text-[10px] font-black text-gray-300 dark:text-gray-600 py-2">{d}</div>
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
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 border transition-all relative group
                          ${isSelected ? 'bg-primary border-primary text-[#1b180d] shadow-lg shadow-primary/10' : 'bg-transparent border-primary/5 hover:border-primary/20'}
                          ${past ? 'opacity-30' : ''}
                          ${isHoliday ? 'ring-2 ring-blue-500/50' : ''}
                        `}
                      >
                        <span className={`text-[11px] font-black ${isSelected ? 'text-[#1b180d]' : ''}`}>{day}</span>
                        {resCount > 0 && !isHoliday && (
                          <div className={`text-[8px] font-black px-1 rounded-full ${isSelected ? 'bg-black/20' : 'bg-primary/20 text-primary'}`}>
                            {resCount}
                          </div>
                        )}
                        {isHoliday && <div className="absolute top-1 right-1 size-1.5 bg-blue-500 rounded-full" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <button
            onClick={() => setIsHolidayMode(!isHolidayMode)}
            className={`w-full mt-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${isHolidayMode ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:text-primary'}`}
          >
            {isHolidayMode ? 'Finish Holiday Setup' : 'Manage Holidays'}
          </button>
        </section>

        {/* Day Summary */}
        <section className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 shadow-sm border border-primary/10 space-y-6">
          <div className="flex items-center gap-2 border-b border-primary/5 pb-4">
            <span className="material-symbols-outlined text-primary text-lg">monochrome_photos</span>
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Attendance Alert ({selectedDate})</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {reservations.filter(r => r.date === selectedDate).length > 0 ? (
              reservations.filter(r => r.date === selectedDate).flatMap(res => {
                const targetCcaIds = res.ccaIds || (res.ccaId ? [res.ccaId] : []);
                return targetCcaIds.map(cid => {
                  const cca = CCAS.find((c: CCA) => c.id === cid);
                  if (!cca || cca.status === 'active') return null;
                  return (
                    <div key={`${res.id}-${cid}`} className={`text-[10px] font-black px-4 py-2 rounded-xl flex items-center gap-2 border border-white/5 shadow-sm ${getDayStatusColor(cca.status || '')}`}>
                      <span className="material-symbols-outlined text-[12px]">
                        {cca.status === 'absent' ? 'block' : cca.status === 'off' ? 'event_busy' : 'schedule'}
                      </span>
                      {cca.name}
                    </div>
                  );
                });
              })
            ) : (
              <p className="text-[10px] font-bold text-gray-400 italic">No critical alerts for today.</p>
            )}
          </div>
        </section>
      </div>

      {/* RIGHT: Detail View */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-8 pb-20">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-primary/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full" />
          <div className="relative z-10">
            <h3 className="text-5xl font-black tracking-tighter uppercase italic text-primary">{selectedDate}</h3>
            <p className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-widest flex items-center gap-2">
              <span className="size-2 bg-green-500 rounded-full animate-pulse" /> Live Booking Inventory
            </p>
          </div>
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-zinc-950 p-2 rounded-[2rem] border border-primary/5 relative z-10">
            <div className="px-8 py-3 border-r border-primary/10 text-center">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Requests</p>
              <p className="text-2xl font-black text-white">{dayReservations.reduce((acc, r) => acc + (r.ccaIds?.length || (r.ccaId ? 1 : 0)), 0)}</p>
            </div>
            <div className="px-8 py-3 text-center">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Inventory</p>
              <p className="text-2xl font-black text-white">{dayReservations.filter(r => r.tableId || r.roomId).length}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4">
          {timeSlots.map(time => {
            const slotReservations = dayReservations.filter(r => r.time === time);
            const requestCount = slotReservations.reduce((acc, r) => acc + (r.ccaIds?.length || (r.ccaId ? 1 : 0)), 0);
            const tableRoomCount = slotReservations.filter(r => r.tableId || r.roomId).length;
            const hasBookings = slotReservations.length > 0;

            return (
              <motion.div
                layout
                key={time}
                className={`group flex items-stretch bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden border-2 transition-all duration-300 ${hasBookings ? 'border-primary/30 shadow-xl' : 'border-primary/5 opacity-70 hover:opacity-100 hover:border-primary/20'}`}
              >
                <div className={`w-24 md:w-36 flex flex-col items-center justify-center p-6 ${hasBookings ? 'bg-primary text-[#1b180d]' : 'bg-gray-50 dark:bg-zinc-950 text-gray-400'}`}>
                  <span className="text-xl md:text-3xl font-black">{time}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest mt-1 opacity-60">{hasBookings ? 'Booked' : 'Free'}</span>
                </div>

                <div className="flex-1 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {hasBookings ? (
                    <>
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Requested Staff</p>
                          <p className="text-sm font-black text-[#1b180d] dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px] text-primary">groups</span>
                            REQUEST: {requestCount}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Floor Space</p>
                          <p className="text-sm font-black text-[#1b180d] dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px] text-primary">chair</span>
                            T/R: {tableRoomCount}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowManagePopup(time)}
                        className="px-6 py-4 bg-[#1b180d] dark:bg-white/5 dark:hover:bg-primary dark:hover:text-[#1b180d] text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                      >
                        Details
                      </button>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-between text-gray-300 dark:text-zinc-700 italic px-4">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-40">No bookings for this slot</span>
                      <span className="material-symbols-outlined opacity-20">history_toggle_off</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* POPUP: Detail Management */}
      <AnimatePresence>
        {showManagePopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowManagePopup(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="bg-[#1b180d] border border-primary/20 w-full max-w-5xl h-[90vh] md:h-[80vh] rounded-[3rem] overflow-hidden shadow-2xl z-10 flex flex-col relative"
            >
              <div className="p-8 border-b border-primary/10 flex items-center justify-between">
                <div>
                  <h4 className="text-3xl font-black text-white italic uppercase">{showManagePopup} Reservations</h4>
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-1">{selectedDate}</p>
                </div>
                <button onClick={() => setShowManagePopup(null)} className="size-14 flex items-center justify-center rounded-[1.5rem] bg-white/5 text-white hover:bg-primary hover:text-[#1b180d] transition-all">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {dayReservations.filter(r => r.time === showManagePopup).map(res => (
                  <div key={res.id} className="bg-white/5 border border-primary/5 p-8 rounded-[2rem] space-y-8">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex gap-6">
                        <div className="size-16 rounded-2xl bg-primary flex items-center justify-center text-[#1b180d] shrink-0">
                          <span className="material-symbols-outlined text-2xl font-black">person</span>
                        </div>
                        <div>
                          <h5 className="text-2xl font-black text-white">{res.customerName} <span className="text-primary/50 text-sm italic font-bold">({res.groupSize} Guests)</span></h5>
                          <p className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-widest flex items-center gap-2">
                            <span className="material-symbols-outlined text-[14px]">location_on</span>
                            {res.roomId ? res.roomName : res.tableName || 'Pending Assignment'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${res.status === 'confirmed' ? 'bg-green-500 text-white' : 'bg-primary text-[#1b180d]'}`}>
                          {res.status}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(res.ccaIds || (res.ccaId ? [res.ccaId] : [])).map(cid => {
                          const cca = CCAS.find((c: CCA) => c.id === cid);
                          return (
                            <div key={cid} className="flex items-center gap-4 bg-black p-4 rounded-2xl border border-white/5">
                              <img src={cca?.image} className="size-12 rounded-xl object-cover" />
                              <div className="overflow-hidden">
                                <p className="font-black text-sm text-white truncate">{cca?.nickname || 'Unknown'}</p>
                                <span className={`text-[8px] font-black px-1.5 rounded-full uppercase ${cca?.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                  {cca?.status}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {res.customerNote && (
                      <div className="p-6 rounded-2xl bg-primary/5 border-l-2 border-primary italic text-gray-500 text-xs leading-relaxed">
                        "{res.customerNote}"
                      </div>
                    )}

                    <div className="flex justify-end gap-3">
                      <button className="px-6 py-3 rounded-xl border border-red-500/20 text-red-500 font-black text-[9px] uppercase hover:bg-red-500 hover:text-white transition-all">Cancel</button>
                      <button className="px-6 py-3 rounded-xl bg-primary text-[#1b180d] font-black text-[9px] uppercase hover:scale-105 transition-all">Update Control</button>
                    </div>
                  </div>
                ))}

                <div className="pt-8 border-t border-white/5 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Left Tables', val: (venue?.tables?.length || 12) - dayReservations.filter(r => r.time === showManagePopup && r.tableId).length, icon: 'table_bar' },
                    { label: 'Left Rooms', val: (venue?.rooms?.length || 6) - dayReservations.filter(r => r.time === showManagePopup && r.roomId).length, icon: 'meeting_room' },
                    { label: 'Staff Ready', val: CCAS.filter((c: CCA) => c.status === 'active').length, icon: 'diversity_3' }
                  ].map(stat => (
                    <div key={stat.label} className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col items-center">
                      <span className="material-symbols-outlined text-primary text-xl mb-1">{stat.icon}</span>
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{stat.label}</p>
                      <p className="text-xl font-black text-white mt-1">{stat.val}</p>
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
