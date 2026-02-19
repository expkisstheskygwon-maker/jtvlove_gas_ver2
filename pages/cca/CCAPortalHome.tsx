
import React from 'react';

const CCAPortalHome: React.FC = () => {
  return (
    <div className="space-y-12 animate-fade-in">
       {/* High-end Welcome Card */}
       <section className="relative h-64 md:h-80 rounded-[3rem] overflow-hidden group shadow-2xl">
          <img src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2000&auto=format&fit=crop" className="absolute inset-0 size-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-r from-background-dark via-background-dark/40 to-transparent"></div>
          <div className="absolute inset-0 p-10 flex flex-col justify-end text-white space-y-2">
             <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Welcome back</p>
             <h2 className="text-5xl md:text-6xl font-black tracking-tighter">Yumi, Have a <span className="text-primary italic">Luminous</span> Night.</h2>
             <p className="text-sm font-bold opacity-60">Today: 4 Reservations • Venue: Grand Palace JTV</p>
          </div>
       </section>

       {/* Quick Action & Stats Grid */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-primary/5 shadow-sm space-y-4">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Performance Score</p>
             <div className="flex items-end justify-between">
                <p className="text-5xl font-black text-primary">A+</p>
                <div className="text-right"><p className="text-sm font-bold">+12%</p><p className="text-[8px] font-black opacity-40">VS LAST WEEK</p></div>
             </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-primary/5 shadow-sm space-y-4">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Earnings Forecast</p>
             <p className="text-5xl font-black">₱85K</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-primary/5 shadow-sm flex flex-col justify-center gap-4">
             <button className="w-full py-4 bg-primary text-[#1b180d] rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/10">Request Settlement</button>
             <button className="w-full py-4 bg-zinc-100 dark:bg-white/5 rounded-2xl font-black text-xs uppercase tracking-widest">Venue Change Request</button>
          </div>
       </div>

       {/* Personal Message/Note */}
       <section className="bg-background-dark text-white rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-10">
          <div className="size-24 bg-primary rounded-full flex items-center justify-center shadow-2xl">
             <span className="material-symbols-outlined text-4xl text-background-dark">support_agent</span>
          </div>
          <div className="flex-1 space-y-4">
             <h4 className="text-2xl font-black tracking-tight">Support Message from Admin</h4>
             <p className="text-gray-400 leading-relaxed font-medium">"유미님, 이번 달 성과가 훌륭합니다! 다음 주 VIP 이벤트 세션 참여 가능 여부를 관리자 문의를 통해 남겨주세요."</p>
             <div className="flex gap-4">
                <button className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Reply to Admin</button>
             </div>
          </div>
       </section>
    </div>
  );
};

export default CCAPortalHome;
