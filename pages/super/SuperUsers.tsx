
import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';

const SuperUsers: React.FC = () => {
   const [users, setUsers] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [searchTerm, setSearchTerm] = useState('');
   const [selectedUser, setSelectedUser] = useState<any | null>(null);
   const [isUpdating, setIsUpdating] = useState(false);

   useEffect(() => {
      fetchUsers();
   }, []);

   const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
         const data = await apiService.getAdminUsers();
         if (Array.isArray(data)) {
            setUsers(data);
         } else if ((data as any).error) {
            setError((data as any).error);
         }
      } catch (err: any) {
         setError(err.message || "Failed to load database");
         console.error(err);
      } finally {
         setLoading(false);
      }
   };

   const filteredUsers = users.filter(u =>
      (u.nickname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.real_name || '').toLowerCase().includes(searchTerm.toLowerCase())
   );

   const handleQuickAction = async (userId: string, updates: any) => {
      if (!window.confirm("이 유저의 정보를 변경하시겠습니까?")) return;
      setIsUpdating(true);
      try {
         const success = await apiService.updateAdminUser(userId, updates);
         if (success) {
            await fetchUsers();
            alert("변경되었습니다.");
         }
      } catch (err) {
         alert("실패했습니다.");
      } finally {
         setIsUpdating(false);
      }
   };

   const handlePointAdjust = async (userId: string, currentPoints: number) => {
      const amount = prompt("조정할 포인트 양을 입력하세요 (예: 1000 또는 -500):", "0");
      if (amount && !isNaN(Number(amount))) {
         const newPoints = currentPoints + Number(amount);
         await handleQuickAction(userId, { points: newPoints });
      }
   };

   const handlePasswordReset = async (userId: string) => {
      const tempPass = prompt("임시 비밀번호를 입력하세요 (기본: 1234):", "1234");
      if (tempPass) {
         setIsUpdating(true);
         try {
            const result = await apiService.adminResetPassword(userId, tempPass);
            if (result.success) {
               alert(`비밀번호가 '${result.tempPassword}'로 초기화되었습니다.`);
            }
         } catch (err) {
            alert("실패했습니다.");
         } finally {
            setIsUpdating(false);
         }
      }
   };

   if (loading) return <div className="p-20 text-center animate-pulse font-black text-red-500 uppercase tracking-widest">Loading User Database...</div>;

   if (error) return (
      <div className="p-20 text-center space-y-4">
         <span className="material-symbols-outlined text-5xl text-red-500">error</span>
         <p className="text-xl font-black text-white uppercase italic">Critical Database Error</p>
         <p className="text-sm text-zinc-500 font-bold uppercase tracking-widest">{error}</p>
         <button onClick={fetchUsers} className="bg-primary text-black px-6 py-3 rounded-xl font-black uppercase text-[10px]">Retry Synchronize</button>
      </div>
   );

   return (
      <div className="space-y-12 animate-fade-in pb-20">
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
               <button onClick={fetchUsers} className="bg-zinc-800 hover:bg-zinc-700 p-4 rounded-2xl text-white transition-all">
                  <span className="material-symbols-outlined">refresh</span>
               </button>
            </div>
         </div>

         {/* User Grid Cards */}
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredUsers.map(user => (
               <div key={user.id} className="bg-zinc-900 rounded-[2.5rem] border border-white/5 space-y-6 relative group overflow-hidden shadow-2xl">
                  {/* Status Glow */}
                  <div className="absolute top-0 right-0 p-8">
                     <span className={`size-3 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.6)] ${user.status === 'banned' ? 'bg-red-500' : 'bg-green-500'}`}></span>
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
                              {user.role === 'super_admin' && <span className="text-[8px] bg-red-600 text-white px-2 py-0.5 rounded font-black uppercase tracking-tighter">MASTER</span>}
                           </div>
                           <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mt-1">{user.email}</p>
                           <p className="text-xs text-zinc-400 mt-2 font-bold">본명: {user.real_name}</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-3 gap-2 bg-black/40 rounded-3xl p-5 border border-white/5">
                        <div className="text-center">
                           <p className="text-[8px] font-black text-gray-500 uppercase mb-1">XP</p>
                           <p className="font-black text-xs text-primary">{(user.total_xp || 0).toLocaleString()}</p>
                        </div>
                        <div className="text-center border-x border-white/5">
                           <p className="text-[8px] font-black text-gray-500 uppercase mb-1">Points</p>
                           <p className="font-black text-xs text-white">{(user.points || 0).toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                           <p className="text-[8px] font-black text-gray-500 uppercase mb-1">Joined</p>
                           <p className="font-black text-[9px] text-zinc-400">{new Date(user.created_at).toLocaleDateString()}</p>
                        </div>
                     </div>
                  </div>

                  <div className="px-8 pb-8 flex gap-2">
                     <button
                        onClick={() => handlePointAdjust(user.id, user.points || 0)}
                        className="flex-1 py-4 bg-zinc-800 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-black transition-all border border-white/5"
                     >
                        Adjust Points
                     </button>
                     <button
                        onClick={() => setSelectedUser(user)}
                        className="flex-1 py-4 bg-red-600/10 text-red-500 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all border border-red-500/20"
                     >
                        Manage Access
                     </button>
                  </div>

                  {/* Overlay Panel (Admin only quick actions) */}
                  <div className="absolute inset-0 bg-red-700 translate-y-full group-hover:translate-y-0 transition-transform duration-500 p-10 flex flex-col justify-center gap-4">
                     <h5 className="font-black uppercase tracking-[0.3em] text-center mb-4 text-white">Core Privilege Control</h5>
                     <button
                        onClick={() => handleQuickAction(user.id, { status: user.status === 'banned' ? 'active' : 'banned' })}
                        className="w-full py-4 bg-black/40 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-black/60 text-white"
                     >
                        {user.status === 'banned' ? 'Restore Activity' : 'Ban User Activity'}
                     </button>
                     <button
                        onClick={() => handleQuickAction(user.id, { role: user.role === 'super_admin' ? 'user' : 'super_admin' })}
                        className="w-full py-4 bg-black/40 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-black/60 text-white"
                     >
                        {user.role === 'super_admin' ? 'Revoke Admin' : 'Change Role to ADMIN'}
                     </button>
                     <button
                        onClick={() => handlePasswordReset(user.id)}
                        className="w-full py-4 bg-white text-black rounded-2xl text-[9px] font-black uppercase tracking-widest"
                     >
                        Reset Password
                     </button>
                     <p className="text-[8px] text-white/50 text-center font-bold uppercase mt-4">Critical Action Required</p>
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

         {/* Detailed Edit Modal */}
         {selectedUser && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => setSelectedUser(null)}>
               <div className="bg-zinc-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl space-y-8" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between">
                     <h3 className="text-2xl font-black text-white italic">EDIT PROFILE: {selectedUser.nickname}</h3>
                     <button onClick={() => setSelectedUser(null)} className="size-10 rounded-full bg-zinc-800 flex items-center justify-center text-white hover:bg-red-600 transition-all">
                        <span className="material-symbols-outlined">close</span>
                     </button>
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nickname</label>
                        <input
                           type="text"
                           defaultValue={selectedUser.nickname}
                           onBlur={(e) => handleQuickAction(selectedUser.id, { nickname: e.target.value })}
                           className="w-full bg-black border border-white/5 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-red-500"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Real Name</label>
                        <input
                           type="text"
                           defaultValue={selectedUser.real_name}
                           onBlur={(e) => handleQuickAction(selectedUser.id, { real_name: e.target.value })}
                           className="w-full bg-black border border-white/5 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-red-500"
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Level</label>
                           <input
                              type="number"
                              defaultValue={selectedUser.level}
                              onBlur={(e) => handleQuickAction(selectedUser.id, { level: parseInt(e.target.value) })}
                              className="w-full bg-black border border-white/5 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-red-500"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total XP</label>
                           <input
                              type="number"
                              defaultValue={selectedUser.total_xp}
                              onBlur={(e) => handleQuickAction(selectedUser.id, { total_xp: parseInt(e.target.value) })}
                              className="w-full bg-black border border-white/5 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-red-500"
                           />
                        </div>
                     </div>
                  </div>

                  <div className="pt-4 space-y-3">
                     <button
                        onClick={() => handleQuickAction(selectedUser.id, { status: selectedUser.status === 'banned' ? 'active' : 'banned' })}
                        className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedUser.status === 'banned' ? 'bg-green-600 text-white' : 'bg-red-600 text-white hover:bg-red-700'}`}
                     >
                        {selectedUser.status === 'banned' ? 'RESTORE USER ACCESS' : 'SUSPEND USER PERMANENTLY'}
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default SuperUsers;
