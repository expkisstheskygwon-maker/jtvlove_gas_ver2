
import React, { useState } from 'react';
import { RESERVATIONS, CCAS } from '../../constants';
import { Reservation, CCA } from '../../types';

const AdminReservations: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('2023-11-20');
  const [showManagePopup, setShowManagePopup] = useState<Reservation | null>(null);

  const dayReservations = RESERVATIONS.filter(r => r.date === selectedDate);
  const timeSlots = ['19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00'];

  const getStatusColor = (cca: CCA) => {
    switch (cca.status) {
      case 'absent': return 'bg-orange-500/20 text-orange-600';
      case 'off': return 'bg-blue-500/20 text-blue-600';
      case 'resigned': return 'bg-red-500/20 text-red-600';
      default: return 'bg-gray-100 dark:bg-white/5';
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
      {/* LEFT: Calendar Section */}
      <div className="xl:col-span-5 bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-primary/5">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black">2023년 11월</h3>
          <div className="flex gap-2">
            <button className="p-2 border border-gray-200 dark:border-white/10 rounded-lg"><span className="material-symbols-outlined">chevron_left</span></button>
            <button className="p-2 border border-gray-200 dark:border-white/10 rounded-lg"><span className="material-symbols-outlined">chevron_right</span></button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => (
            <div key={d} className="text-center text-[10px] font-black text-gray-400 py-2">{d}</div>
          ))}
          {Array.from({length: 30}).map((_, i) => {
            const date = `2023-11-${String(i+1).padStart(2, '0')}`;
            const isSelected = selectedDate === date;
            const resCount = RESERVATIONS.filter(r => r.date === date).length;
            
            return (
              <button 
                key={i} 
                onClick={() => setSelectedDate(date)}
                className={`aspect-square rounded-xl p-2 flex flex-col items-center justify-between border transition-all ${isSelected ? 'bg-primary border-primary text-[#1b180d]' : 'bg-transparent border-gray-100 dark:border-white/5 hover:border-primary/30'}`}
              >
                <span className="text-xs font-bold">{i+1}</span>
                {resCount > 0 && (
                  <span className={`text-[8px] font-black px-1.5 rounded-full ${isSelected ? 'bg-white/40' : 'bg-primary/20 text-primary'}`}>
                    {resCount}건
                  </span>
                )}
              </button>
            );
          })}
        </div>
        
        <div className="mt-8 space-y-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-primary/5 pb-2">Day Summary</p>
          <div className="flex flex-wrap gap-2">
            {dayReservations.map(res => {
              const cca = CCAS.find(c => c.id === res.ccaId);
              return (
                <div key={res.id} className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border border-primary/10 flex items-center gap-2 ${cca ? getStatusColor(cca) : ''}`}>
                  <span className="material-symbols-outlined text-[12px]">person</span>
                  {res.ccaName} ({res.time})
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT: Detail View */}
      <div className="xl:col-span-7 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-black">{selectedDate} 상세 내역</h3>
          <button className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">휴무일 지정</button>
        </div>

        <div className="space-y-4">
          {timeSlots.map(time => {
            const res = dayReservations.find(r => r.time === time);
            const cca = res ? CCAS.find(c => c.id === res.ccaId) : null;

            return (
              <div key={time} className={`group flex flex-col md:flex-row items-stretch bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border transition-all ${res ? 'border-primary/20 shadow-md' : 'border-gray-100 dark:border-white/5 opacity-60'}`}>
                <div className={`w-full md:w-32 flex flex-col items-center justify-center p-4 ${res ? 'bg-primary text-[#1b180d]' : 'bg-gray-50 dark:bg-white/5 text-gray-400'}`}>
                  <span className="text-lg font-black">{time}</span>
                  <span className="text-[10px] font-black uppercase tracking-tighter">{res ? 'Reserved' : 'Available'}</span>
                </div>
                
                <div className="flex-1 p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {res ? (
                    <>
                      <div className="flex items-center gap-4">
                        <img src={cca?.image} className="size-12 rounded-xl object-cover border border-primary/20" />
                        <div>
                           <div className="flex items-center gap-2">
                              <span className="font-black text-lg">{res.ccaName}</span>
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border ${cca?.grade === 'ACE' ? 'bg-primary/10 border-primary text-primary' : 'bg-gray-100 border-gray-200'}`}>{cca?.grade}</span>
                           </div>
                           <p className="text-xs text-gray-500 font-bold truncate max-w-[150px] italic">"{res.shortMessage}"</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                           <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Customer</p>
                           <p className="font-bold">{res.customerName}</p>
                        </div>
                        <button 
                          onClick={() => setShowManagePopup(res)}
                          className="px-6 py-2.5 bg-background-dark text-white rounded-xl text-xs font-black hover:bg-primary hover:text-background-dark transition-all uppercase tracking-widest"
                        >
                          Manage
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-between text-gray-300 dark:text-gray-600 italic">
                       <span>No bookings for this slot</span>
                       <button className="material-symbols-outlined text-gray-300 hover:text-primary transition-colors">block</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* POPUP: Management Modal */}
      {showManagePopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-fade-in">
              <div className="bg-primary p-8 flex items-center justify-between text-[#1b180d]">
                 <div>
                    <h4 className="text-2xl font-black tracking-tight">Booking Details</h4>
                    <p className="text-xs font-bold opacity-70 uppercase tracking-widest">{showManagePopup.date} • {showManagePopup.time}</p>
                 </div>
                 <button onClick={() => setShowManagePopup(null)} className="size-10 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20"><span className="material-symbols-outlined">close</span></button>
              </div>
              
              <div className="p-8 space-y-6">
                 <div className="flex gap-4">
                    <img src={CCAS.find(c => c.id === showManagePopup.ccaId)?.image} className="size-20 rounded-2xl object-cover" />
                    <div>
                       <p className="text-[10px] font-black text-primary uppercase tracking-widest">Requested Staff</p>
                       <h5 className="text-xl font-black">{showManagePopup.ccaName}</h5>
                       <p className="text-sm text-gray-500 font-bold mt-1">Customer: {showManagePopup.customerName}</p>
                    </div>
                 </div>
                 
                 <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-primary/5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Customer Message</p>
                    <p className="text-sm italic leading-relaxed">"{showManagePopup.customerNote}"</p>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <button className="h-14 bg-red-500/10 text-red-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-500 hover:text-white transition-all">Cancel Booking</button>
                    <button className="h-14 bg-primary text-[#1b180d] rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">Confirm Booking</button>
                 </div>
                 
                 <button className="w-full h-12 border-2 border-primary/20 text-primary rounded-2xl font-black text-xs uppercase tracking-widest hover:border-primary">Request Time Change</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminReservations;
