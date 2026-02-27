
import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';

const SuperUsers: React.FC = () => {
   const [users, setUsers] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState('');

   useEffect(() => {
      const fetchUsers = async () => {
         try {
            // In a real expanded API, this would be apiService.getSuperUsers()
            // For now, we mock some based on the new schema
            const mockUsers = [
               { id: 'u1', nickname: '김민준', email: 'minjun.kim@example.com', real_name: '김민준', level: 12, total_xp: 1540, points: 2500, role: 'user', created_at: '2025-10-01' },
               { id: 'u2', nickname: '필리핀대장', email: 'boss@example.com', real_name: '이철수', level: 5, total_xp: 460, points: 50000, role: 'user', created_at: '2026-01-15' },
               { id: 'u3', nickname: 'JTV매니아', email: 'mania@test.com', real_name: '박지민', level: 25, total_xp: 5800, points: 1200, role: 'user', created_at: '2025-05-20' }
            ];
            setUsers(mockUsers);
         } catch (err) {
            console.error(err);
         } finally {
            setLoading(false);
         }
      };
      fetchUsers();
   }, []);

   const filteredUsers = users.filter(u =>
      u.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.real_name.toLowerCase().includes(searchTerm.toLowerCase())
   );

   const handlePointAdjust = (userId: string) => {
      const amount = prompt("조정할 포인트 양을 입력하세요 (예: 1000 또는 -500):");
      if (amount && !isNaN(Number(amount))) {
         alert(`${userId} 유저에게 ${amount} 포인트가 조정되었습니다. (실제 API 연동 필요)`);
      }
   };

   if (loading) return <div className="p-20 text-center animate-pulse font-black text-red-500 uppercase tracking-widest">Loading User Database...</div>;

   return (
      <div className="space-y-12 animate-fade-in">
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
               <h2 className="text-3xl font-black tracking-tight mb-2 uppercase italic text-white/90">User Control Hub</h2>
               <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Global Membership & XP Governance</p>
            </div>
            <div className="flex gap-4">
               <div className="relative">
                  <input
                     type="text"
                     placeholder="Search by Email, Nickname or Name..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-80 bg-zinc-900 border-zinc-800 rounded-2xl px-5 py-4 text-xs font-bold focus:ring-red-500 text-white"
                  />
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">search</span>
               </div>
            </div>
         </div>

         {/* User Grid Cards */}
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredUsers.map(user => (
               <div key={user.id} className="bg-zinc-900 rounded-[2.5rem] border border-white/5 space-y-6 relative group overflow-hidden shadow-2xl">
                  {/* Status Glow */}
                  <div className="absolute top-0 right-0 p-8">
                     <span className="size-3 rounded-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]"></span>
                  </div>

                  <div className="p-8 pb-0">
                     <div className="flex items-center gap-6 mb-6">
                        <div className="size-20 rounded-[2rem] bg-zinc-800 p-1 ring-1 ring-white/10 overflow-hidden">
                           <img src={`https://picsum.photos/seed/${user.id}/200/200`} className="w-full h-full object-cover rounded-[1.8rem]" alt={user.nickname} />
                        </div>
                        <div>
                           <div className="flex items-center gap-2">
                              <h4 className="text-xl font-black text-white">{user.nickname}</h4>
                              <span className="text-[8px] bg-primary/20 text-primary px-2 py-0.5 rounded font-black uppercase">LV.{user.level}</span>
                           </div>
                           <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mt-1">{user.email}</p>
                           <p className="text-xs text-zinc-400 mt-2 font-bold">본명: {user.real_name}</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-3 gap-2 bg-black/40 rounded-3xl p-5 border border-white/5">
                        <div className="text-center">
                           <p className="text-[8px] font-black text-gray-500 uppercase mb-1">XP</p>
                           <p className="font-black text-xs text-primary">{user.total_xp.toLocaleString()}</p>
                        </div>
                        <div className="text-center border-x border-white/5">
                           <p className="text-[8px] font-black text-gray-500 uppercase mb-1">Points</p>
                           <p className="font-black text-xs text-white">{user.points.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                           <p className="text-[8px] font-black text-gray-500 uppercase mb-1">Joined</p>
                           <p className="font-black text-[9px] text-zinc-400">{user.created_at}</p>
                        </div>
                     </div>
                  </div>

                  <div className="px-8 pb-8 flex gap-2">
                     <button
                        onClick={() => handlePointAdjust(user.id)}
                        className="flex-1 py-4 bg-zinc-800 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-black transition-all border border-white/5"
                     >
                        Adjust Points
                     </button>
                     <button className="flex-1 py-4 bg-red-600/10 text-red-500 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all border border-red-500/20">Manage Access</button>
                  </div>

                  {/* Overlay Panel (Admin only quick actions) */}
                  <div className="absolute inset-0 bg-red-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500 p-10 flex flex-col justify-center gap-4">
                     <h5 className="font-black uppercase tracking-[0.3em] text-center mb-4">Core Privilege Control</h5>
                     <button className="w-full py-4 bg-black/40 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-black/60">Ban User Activity</button>
                     <button className="w-full py-4 bg-black/40 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-black/60">Change Role to ADMIN</button>
                     <button className="w-full py-4 bg-white text-black rounded-2xl text-[9px] font-black uppercase tracking-widest">Reset Password</button>
                     <p className="text-[8px] text-black/60 text-center font-bold uppercase mt-4">Critical Action Required</p>
                  </div>
               </div>
            ))}

            {filteredUsers.length === 0 && (
               <div className="col-span-full py-20 bg-zinc-900/50 rounded-[3rem] border border-dashed border-zinc-800 text-center">
                  <span className="material-symbols-outlined text-4xl text-zinc-700 mb-4">person_off</span>
                  <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">No matching users found in quadrant</p>
               </div>
            )}
         </div>
      </div>
   );
};

export default SuperUsers;
