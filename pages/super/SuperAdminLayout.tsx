
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const SuperAdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  
  const navItems = [
    { path: '/super-admin', icon: 'terminal', label: 'Main Command' },
    { path: '/super-admin/site-settings', icon: 'settings_input_component', label: 'Site Config' },
    { path: '/super-admin/partners', icon: 'partner_exchange', label: 'Partners & CCA' },
    { path: '/super-admin/hero', icon: 'view_carousel', label: 'Hero Manager' },
    { path: '/super-admin/community', icon: 'forum', label: 'Board Center' },
    { path: '/super-admin/users', icon: 'manage_accounts', label: 'User Control' }
  ];

  return (
    <div className="min-h-screen bg-black text-white font-display">
      {/* Security Scanning Effect Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-5 -z-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      
      {/* Top Console Bar */}
      <header className="sticky top-0 z-[100] bg-zinc-950/80 backdrop-blur-2xl border-b border-red-500/20 h-16 px-8 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="size-8 bg-red-600 rounded flex items-center justify-center text-white shadow-[0_0_20px_rgba(220,38,38,0.5)]">
               <span className="material-symbols-outlined text-lg font-black">security</span>
            </div>
            <div>
               <h1 className="text-xs font-black tracking-[0.3em] uppercase text-red-500">Site Master Console</h1>
               <p className="text-[9px] font-bold text-gray-500 tracking-tighter">PH JTV ASSOCIATION SYSTEM V2.4</p>
            </div>
         </div>
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-bold text-green-500">
               <span className="size-2 bg-green-500 rounded-full animate-pulse"></span>
               SYSTEM ONLINE
            </div>
            <div className="h-6 w-px bg-zinc-800"></div>
            <button className="text-xs font-black text-gray-400 hover:text-white transition-colors uppercase tracking-widest">Logout</button>
         </div>
      </header>

      <div className="flex">
         {/* Command Sidebar */}
         <aside className="w-72 hidden lg:flex flex-col gap-10 p-8 h-[calc(100vh-64px)] sticky top-16 bg-zinc-950 border-r border-white/5">
            <nav className="flex flex-col gap-2">
               {navItems.map(item => (
                  <Link 
                     key={item.path} 
                     to={item.path} 
                     className={`flex items-center gap-4 p-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${location.pathname === item.path ? 'bg-red-600 text-white shadow-[0_0_30px_rgba(220,38,38,0.3)]' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}
                  >
                     <span className="material-symbols-outlined text-xl">{item.icon}</span>
                     {item.label}
                  </Link>
               ))}
            </nav>
            
            <div className="mt-auto space-y-4">
               <div className="bg-zinc-900 p-6 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black text-gray-500 uppercase mb-2">DB Connectivity</p>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                     <div className="h-full w-[94%] bg-green-500"></div>
                  </div>
                  <p className="text-[9px] font-bold mt-2 text-right">94% Capacity</p>
               </div>
               <Link to="/" className="flex items-center justify-center gap-2 w-full py-4 border border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-white/5 transition-all">
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  Return to Site
               </Link>
            </div>
         </aside>

         {/* Command Execution Area */}
         <main className="flex-1 p-8 md:p-12 overflow-y-auto">
            {children}
         </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
