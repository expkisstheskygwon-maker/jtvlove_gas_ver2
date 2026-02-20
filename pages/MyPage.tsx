import React from 'react';
import { Link } from 'react-router-dom';

const MyPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto w-full p-4 lg:p-8 pb-24 lg:pb-12">
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Profile & Stats */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Profile Card */}
          <section className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 lg:p-8">
            <div className="flex flex-col items-center text-center gap-4 mb-8">
              <div className="relative">
                <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden border-4 border-primary shadow-xl">
                  <img 
                    alt="김민준 프로필" 
                    className="w-full h-full object-cover" 
                    src="https://picsum.photos/seed/user123/300/300"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute bottom-1 right-1 bg-primary text-[#1b180d] text-xs font-bold px-3 py-1 rounded-full border-2 border-white dark:border-zinc-900 shadow-md">VIP</div>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">김민준</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">커뮤니티 활동 245일째</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-tight">Progress to VVIP</span>
                <span className="text-lg font-bold text-primary">80%</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-3 overflow-hidden shadow-inner">
                <div className="bg-primary h-full rounded-full transition-all duration-700" style={{ width: '80%' }}></div>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center italic">VVIP 혜택까지 얼마 남지 않았어요!</p>
            </div>
          </section>

          {/* Stat Cards */}
          <section className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center text-center shadow-sm">
              <span className="material-symbols-outlined text-primary mb-2">calendar_today</span>
              <span className="text-[10px] text-zinc-400 font-bold uppercase mb-1">Bookings</span>
              <span className="text-xl font-extrabold">24</span>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center text-center shadow-sm">
              <span className="material-symbols-outlined text-primary mb-2">edit_note</span>
              <span className="text-[10px] text-zinc-400 font-bold uppercase mb-1">Posts</span>
              <span className="text-xl font-extrabold">156</span>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center text-center shadow-sm">
              <span className="material-symbols-outlined text-primary mb-2">verified_user</span>
              <span className="text-[10px] text-zinc-400 font-bold uppercase mb-1">Trust</span>
              <span className="text-xl font-extrabold text-primary">98</span>
            </div>
          </section>
        </div>

        {/* Right Column: Settings & History */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Account Settings */}
          <section>
            <h3 className="text-xs font-black text-zinc-400 dark:text-zinc-500 px-1 mb-4 uppercase tracking-[0.2em]">Account Settings</h3>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between p-5 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <span className="material-symbols-outlined">mail</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-400 uppercase mb-0.5">Email Address</p>
                    <p className="text-sm font-semibold">minjun.kim@example.com</p>
                  </div>
                </div>
                <button className="text-xs font-bold text-primary px-4 py-2 bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors">Change</button>
              </div>
              <div className="flex items-center justify-between p-5 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <span className="material-symbols-outlined">phone_iphone</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-400 uppercase mb-0.5">Phone Number</p>
                    <p className="text-sm font-semibold">010-1234-5678</p>
                  </div>
                </div>
                <button className="text-xs font-bold text-primary px-4 py-2 bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors">Change</button>
              </div>
            </div>
          </section>

          {/* Activity & Menu */}
          <section>
            <h3 className="text-xs font-black text-zinc-400 dark:text-zinc-500 px-1 mb-4 uppercase tracking-[0.2em]">General</h3>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden shadow-sm">
              <Link to="#" className="flex items-center justify-between p-5 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 group transition-all">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-zinc-400 group-hover:text-primary transition-colors">history</span>
                  <span className="text-sm font-semibold">Activity History</span>
                </div>
                <span className="material-symbols-outlined text-zinc-300 group-hover:translate-x-1 transition-transform">chevron_right</span>
              </Link>
              <Link to="#" className="flex items-center justify-between p-5 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 group transition-all">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-zinc-400 group-hover:text-primary transition-colors">notifications</span>
                  <span className="text-sm font-semibold">Notifications</span>
                </div>
                <span className="material-symbols-outlined text-zinc-300 group-hover:translate-x-1 transition-transform">chevron_right</span>
              </Link>
              <Link to="#" className="flex items-center justify-between p-5 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 group transition-all">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-zinc-400 group-hover:text-primary transition-colors">help</span>
                  <span className="text-sm font-semibold">Customer Center</span>
                </div>
                <span className="material-symbols-outlined text-zinc-300 group-hover:translate-x-1 transition-transform">chevron_right</span>
              </Link>
            </div>
          </section>

          <div className="flex justify-center lg:justify-start">
            <button className="mt-4 py-4 px-8 text-sm font-bold text-zinc-400 hover:text-red-500 transition-colors flex items-center gap-2 group">
              <span className="material-symbols-outlined text-lg">logout</span>
              <span className="underline underline-offset-4 decoration-zinc-200 dark:border-zinc-800">Logout Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 pt-12 border-t border-zinc-200 dark:border-zinc-800">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-xs fill-1">stars</span>
              </div>
              <h4 className="font-extrabold text-sm uppercase tracking-tight">Philippine <span className="text-primary">JTV</span></h4>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-xs">
              The premier association for entertainment and networking experiences in the Philippines.
            </p>
            <div className="flex gap-3">
              {[ 'share', 'public', 'smart_display' ].map(icon => (
                <button key={icon} className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-primary hover:border-primary transition-colors">
                  <span className="material-symbols-outlined text-sm">{icon}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6">Quick Links</h5>
            <ul className="space-y-3">
              {['About Association', 'Notice', 'Privacy Policy'].map(item => (
                <li key={item}><Link to="#" className="text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-primary transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6">Support</h5>
            <ul className="space-y-3">
              {['Contact Us', 'Reservation Support', 'Affiliate Inquiry'].map(item => (
                <li key={item}><Link to="#" className="text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-primary transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6">Newsletter</h5>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Enter email" 
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg text-xs px-4 h-10 focus:ring-1 focus:ring-primary"
              />
              <button className="bg-primary text-[#1b180d] w-10 h-10 rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </div>
          </div>
        </div>
        <div className="py-8 border-t border-zinc-100 dark:border-zinc-900 text-center">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            © 2024 PH-JTV. All rights reserved. Designed for elite entertainment experiences.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MyPage;
