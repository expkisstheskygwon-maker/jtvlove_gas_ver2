
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
      (u.nickname || u.nickname_bkp || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      } catch (err: any) {
         console.error("Update Action Failed:", err);
         alert(`실패했습니다: ${err.message || "알 수 없는 오류"}`);
      } finally {
         setIsUpdating(false);
      }
   };

   const handleDeleteUser = async (userId: string, nickname: string) => {
      const confirmText = prompt(`유저 "${nickname}"을(를) 삭제하려면 "DELETE"를 입력하세요.\n\n⚠️ 삭제된 유저는 로그인이 불가합니다.\n(데이터는 보존됩니다)`);
      if (confirmText !== 'DELETE') {
         if (confirmText !== null) alert('삭제가 취소되었습니다. "DELETE"를 정확히 입력해야 합니다.');
         return;
      }
      setIsUpdating(true);
      try {
         const success = await apiService.updateAdminUser(userId, { status: 'deleted' });
         if (success) {
            await fetchUsers();
            alert(`${nickname} 유저가 삭제되었습니다.`);
         }
      } catch (err: any) {
         alert(`실패했습니다: ${err.message || "알 수 없는 오류"}`);
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

   const getStatusColor = (status: string) => {
      switch (status) {
         case 'banned': return 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]';
         case 'deleted': return 'bg-zinc-500 shadow-[0_0_15px_rgba(113,113,122,0.6)]';
         default: return 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]';
      }
   };

   const getStatusBadge = (status: string) => {
      switch (status) {
         case 'banned': return <span className="text-[7px] bg-red-600 text-white px-2 py-0.5 rounded font-black uppercase tracking-tighter ml-2">BANNED</span>;
         case 'deleted': return <span className="text-[7px] bg-zinc-600 text-white px-2 py-0.5 rounded font-black uppercase tracking-tighter ml-2">DELETED</span>;
         default: return null;
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
               <div key={user.id} className={`bg-zinc-900 rounded-[2.5rem] border space-y-6 relative group overflow-hidden shadow-2xl ${user.status === 'deleted' ? 'border-zinc-700 opacity-60' : user.status === 'banned' ? 'border-red-900/50' : 'border-white/5'}`}>
                  {/* Status Glow */}
                  <div className="absolute top-0 right-0 p-8 flex items-center gap-2">
                     {getStatusBadge(user.status || 'active')}
                     <span className={`size-3 rounded-full ${getStatusColor(user.status || 'active')}`}></span>
                  </div>

                  <div className="p-8 pb-10">
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

                     {/* Premium Footer Decoration */}
                     <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center opacity-30">
                        <p className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">
                           {user.status === 'banned' ? 'Status: Activity Banned' : user.status === 'deleted' ? 'Status: Account Deleted' : 'Security Status: Identified'}
                        </p>
                        <span className="material-symbols-outlined text-[10px] text-zinc-500">
                           {user.status === 'banned' ? 'block' : user.status === 'deleted' ? 'person_off' : 'verified_user'}
                        </span>
                     </div>
                  </div>

                  {/* Overlay Panel (Admin only quick actions) */}
                  <div className="absolute inset-0 bg-red-700 translate-y-full group-hover:translate-y-0 transition-transform duration-500 p-8 flex flex-col justify-center gap-2">
                     <h5 className="font-black uppercase tracking-[0.3em] text-center mb-2 text-white text-[10px]">Core Privilege Control</h5>

                     <div className="grid grid-cols-2 gap-2">
                        <button
                           onClick={() => handlePointAdjust(user.id, user.points || 0)}
                           className="py-3 bg-black/40 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-black/60 text-white border border-white/10"
                        >
                           Adjust Points
                        </button>
                        <button
                           onClick={() => setSelectedUser(user)}
                           className="py-3 bg-black/40 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-black/60 text-white border border-white/10"
                        >
                           Manage Access
                        </button>
                     </div>

                     <button
                        onClick={() => handleQuickAction(user.id, { status: user.status === 'banned' ? 'active' : 'banned' })}
                        className={`w-full py-3 rounded-xl text-[8px] font-black uppercase tracking-widest border border-white/10 ${user.status === 'banned' ? 'bg-green-600/60 hover:bg-green-600/80' : 'bg-black/40 hover:bg-black/60'} text-white`}
                     >
                        {user.status === 'banned' ? '✓ Restore Activity' : 'Ban User Activity'}
                     </button>

                     <button
                        onClick={() => handleQuickAction(user.id, { role: user.role === 'super_admin' ? 'user' : 'super_admin' })}
                        className="w-full py-3 bg-black/40 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-black/60 text-white border border-white/10"
                     >
                        {user.role === 'super_admin' ? 'Revoke Admin' : 'Change Role to ADMIN'}
                     </button>

                     <button
                        onClick={() => handlePasswordReset(user.id)}
                        className="w-full py-3 bg-white text-black rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-gray-100"
                     >
                        Reset Password
                     </button>

                     {user.status === 'deleted' ? (
                        <button
                           onClick={() => handleQuickAction(user.id, { status: 'active' })}
                           className="w-full py-3 bg-green-600 text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-green-700 border border-green-400/30"
                        >
                           ↑ Restore Deleted User
                        </button>
                     ) : (
                        <button
                           onClick={() => handleDeleteUser(user.id, user.nickname)}
                           className="w-full py-3 bg-zinc-800 text-red-400 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-red-900 hover:text-white border border-red-900/30"
                        >
                           ✕ Delete User
                        </button>
                     )}

                     <p className="text-[7px] text-white/50 text-center font-bold uppercase mt-1">Critical Action Required</p>
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
                     {selectedUser.status === 'deleted' ? (
                        <button
                           onClick={() => handleQuickAction(selectedUser.id, { status: 'active' })}
                           className="w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-green-600 text-white hover:bg-green-700 transition-all"
                        >
                           RESTORE DELETED USER
                        </button>
                     ) : (
                        <button
                           onClick={() => handleDeleteUser(selectedUser.id, selectedUser.nickname)}
                           className="w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-zinc-800 text-red-400 hover:bg-red-900 hover:text-white transition-all border border-red-900/30"
                        >
                           ✕ DELETE USER ACCOUNT
                        </button>
                     )}
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default SuperUsers;
