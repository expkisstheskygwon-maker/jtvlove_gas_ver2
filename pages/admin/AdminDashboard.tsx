import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Reservation, CCA } from '../../types';

const AdminDashboard: React.FC = () => {
   const { user } = useAuth();
   const navigate = useNavigate();
   const [reservations, setReservations] = useState<Reservation[]>([]);
   const [ccas, setCcas] = useState<CCA[]>([]);
   const [ccaRequests, setCcaRequests] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
      if (!user || (user.role !== 'venue_admin' && user.role !== 'super_admin') || !user.venueId) {
         navigate('/admin/login');
         return;
      }
      fetchDashboardData();
   }, [user]);

   const fetchDashboardData = async () => {
      if (!user?.venueId) return;
      setIsLoading(true);
      try {
         const [resData, staffData, reqData] = await Promise.all([
            apiService.getVenueReservations(user.venueId),
            apiService.getCCAs(user.venueId),
            apiService.getCCARequests({ venueId: user.venueId })
         ]);

         const formattedReservations = (resData || []).map((r: any) => ({
            ...r,
            customerName: r.customer_name || r.customerName,
            time: r.reservation_time || r.time,
            date: r.reservation_date || r.date
         }));

         setReservations(formattedReservations);
         setCcas(staffData || []);
         setCcaRequests(reqData || []);
      } catch (error) {
         console.error('Failed to fetch dashboard data:', error);
      } finally {
         setIsLoading(false);
      }
   };

   const stats = [
      { name: "Staff Count", value: ccas.length, icon: "how_to_reg", color: "text-green-500", bg: "bg-green-500/10" },
      { name: "Active Staff", value: ccas.filter(c => c.status === 'active').length, icon: "person_play", color: "text-orange-500", bg: "bg-orange-500/10" },
      { name: "Points Total", value: "₱" + (ccas.reduce((acc, curr) => acc + (curr.points || 0), 0) / 1000).toFixed(1) + "k", icon: "payments", color: "text-primary", bg: "bg-primary/10" }
   ];

   if (isLoading) {
      return (
         <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
         </div>
      );
   }

   return (
      <div className="space-y-10 animate-fade-in">
         {/* Stat Cards */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map(stat => (
               <div key={stat.name} className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] shadow-sm border border-primary/5 flex items-center justify-between group hover:border-primary transition-all">
                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.name}</p>
                     <p className="text-3xl font-black tracking-tighter">{stat.value}</p>
                  </div>
                  <div className={`size-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                     <span className="material-symbols-outlined text-3xl font-bold">{stat.icon}</span>
                  </div>
               </div>
            ))}
         </div>

         <div className="grid grid-cols-1 gap-8">
            {/* Quick Staff Status */}
            <div className="bg-background-dark text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 size-48 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
               <h3 className="text-xl font-black mb-8 relative z-10">Live Staff Status</h3>
               <div className="space-y-6 relative z-10">
                  {ccas.length > 0 ? (
                     ccas.slice(0, 8).map(cca => (
                        <div key={cca.id} className="flex items-center justify-between border-b border-white/5 pb-4">
                           <div className="flex items-center gap-3">
                              <div className="relative">
                                 <img src={cca.image || 'https://via.placeholder.com/40'} className="size-10 rounded-full object-cover" />
                                 <div className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background-dark ${cca.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                              </div>
                              <div>
                                 <p className="font-bold text-sm">{cca.nickname || cca.name}</p>
                                 <p className="text-[10px] text-primary font-black uppercase tracking-tighter">{cca.grade}</p>
                              </div>
                           </div>
                           <span className="text-[10px] font-black uppercase opacity-40">{cca.status}</span>
                        </div>
                     ))
                  ) : (
                     <p className="text-center text-gray-400 py-10">No staff members found.</p>
                  )}
               </div>
            </div>
         </div>

         {/* CCA Nomination Requests */}
         {ccaRequests.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-primary/10 shadow-sm">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                     <div className="size-10 bg-pink-500/10 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-pink-500">favorite</span>
                     </div>
                     <div>
                        <h3 className="text-xl font-black">Nomination Requests</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{ccaRequests.filter(r => r.status === 'pending').length} pending</p>
                     </div>
                  </div>
               </div>
               <div className="space-y-4">
                  {ccaRequests.filter(r => r.status === 'pending').slice(0, 5).map((req: any) => (
                     <div key={req.id} className="flex items-center justify-between p-6 bg-background-light dark:bg-white/5 rounded-2xl border border-primary/5">
                        <div className="flex items-center gap-4">
                           <div className="size-10 bg-pink-500/20 text-pink-500 rounded-full flex items-center justify-center">
                              <span className="material-symbols-outlined">person</span>
                           </div>
                           <div>
                              <p className="font-bold text-sm">{req.customer_name} → <span className="text-primary">{req.cca_name}</span></p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">{req.preferred_date} {req.preferred_time} · {req.group_size}명</p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <button
                              onClick={async () => {
                                 const ok = await apiService.updateCCARequestStatus(req.id, 'confirmed');
                                 if (ok) setCcaRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'confirmed' } : r));
                              }}
                              className="px-4 py-2 bg-green-500/10 text-green-600 rounded-xl text-[10px] font-black uppercase hover:bg-green-500/20 transition-colors"
                           >수락</button>
                           <button
                              onClick={async () => {
                                 const ok = await apiService.updateCCARequestStatus(req.id, 'rejected');
                                 if (ok) setCcaRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'rejected' } : r));
                              }}
                              className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-black uppercase hover:bg-red-500/20 transition-colors"
                           >거절</button>
                        </div>
                     </div>
                  ))}
                  {ccaRequests.filter(r => r.status === 'pending').length === 0 && (
                     <p className="text-center text-gray-500 py-6">No pending nomination requests.</p>
                  )}
               </div>
            </div>
         )}
      </div>
   );
};

export default AdminDashboard;

