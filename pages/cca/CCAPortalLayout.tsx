
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const CCAPortalLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
   const location = useLocation();
   const navigate = useNavigate();

   const handleSignOut = () => {
      if (confirm("Sign out of CCA Portal?")) {
         navigate('/');
      }
   };

   const navItems = [
      { path: '/cca-portal', icon: 'home_app_logo', label: 'Home' },
      { path: '/cca-portal/schedule', icon: 'calendar_today', label: 'Schedule' },
      { path: '/cca-portal/gallery', icon: 'photo_library', label: 'Gallery' },
      { path: '/cca-portal/settings', icon: 'person_outline', label: 'Settings' }
   ];

   return (
      <div className="min-h-screen bg-[#faf9f6] dark:bg-[#0f0e0b] text-[#1b180d] dark:text-white font-display">
         {/* Premium Gradient Background */}
         <div className="fixed inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-primary/10 pointer-events-none -z-10"></div>

         {/* Top Bar */}
         <header className="sticky top-0 z-[60] bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border-b border-primary/5 h-16 px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="size-10 bg-gradient-to-br from-primary to-yellow-600 rounded-full flex items-center justify-center text-white shadow-lg">
                  <span className="material-symbols-outlined text-xl">sparkles</span>
               </div>
               <h1 className="text-lg font-black tracking-tight uppercase">CCA Portal</h1>
            </div>
            <div className="flex items-center gap-3">
               <button className="material-symbols-outlined p-2 hover:bg-primary/10 rounded-full transition-colors">notifications</button>
               <Link to="/cca-portal/settings">
                  <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200/200" className="size-9 rounded-full border-2 border-primary/20 object-cover" />
               </Link>
            </div>
         </header>

         <div className="max-w-7xl mx-auto flex">
            {/* Sidebar - Desktop */}
            <aside className="w-72 hidden lg:flex flex-col gap-10 p-10 h-[calc(100vh-64px)] sticky top-16 border-r border-primary/5">
               <div className="space-y-2">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] pl-4">Management</p>
                  <nav className="flex flex-col gap-1">
                     {navItems.map(item => (
                        <Link
                           key={item.path}
                           to={item.path}
                           className={`flex items-center gap-4 p-4 rounded-2xl font-black text-sm transition-all ${location.pathname === item.path ? 'bg-primary text-[#1b180d] shadow-xl shadow-primary/20' : 'text-gray-400 hover:bg-primary/5 hover:text-primary'}`}
                        >
                           <span className="material-symbols-outlined">{item.icon}</span>
                           {item.label}
                        </Link>
                     ))}
                  </nav>
               </div>

               <div className="mt-auto space-y-6">
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-primary/10 shadow-sm">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">My Points</p>
                     <p className="text-3xl font-black text-primary">1,250</p>
                  </div>
                  <button
                     onClick={handleSignOut}
                     className="flex items-center gap-3 text-red-400 font-bold pl-4 text-sm hover:translate-x-1 transition-transform"
                  >
                     <span className="material-symbols-outlined">logout</span> Sign Out
                  </button>
               </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-6 md:p-10 pb-32">
               {children}
            </main>
         </div>

         {/* Mobile Tab Bar */}
         <nav className="fixed bottom-0 left-0 right-0 z-[60] lg:hidden bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl border-t border-primary/5 p-4 flex justify-around">
            {navItems.map(item => (
               <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center gap-1 transition-all ${location.pathname === item.path ? 'text-primary scale-110' : 'text-gray-400 opacity-60'}`}
               >
                  <span className="material-symbols-outlined fill-1">{item.icon}</span>
                  <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
               </Link>
            ))}
         </nav>
      </div>
   );
};

export default CCAPortalLayout;
