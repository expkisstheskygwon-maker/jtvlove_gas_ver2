
import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { Venue, CCA } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

const SuperPartners: React.FC = () => {
   const [activeTab, setActiveTab] = useState<'venues' | 'ccas'>('venues');
   const [venues, setVenues] = useState<any[]>([]);
   const [ccas, setCcas] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   // Modals
   const [showHistoryModal, setShowHistoryModal] = useState(false);
   const [showDetailModal, setShowDetailModal] = useState(false);
   const [selectedItem, setSelectedItem] = useState<any>(null);
   const [historyData, setHistoryData] = useState<any>(null);

   // Detail Edit State
   const [editForm, setEditForm] = useState<any>({});

   useEffect(() => {
      loadData();
   }, [activeTab]);

   const loadData = async () => {
      setLoading(true);
      if (activeTab === 'venues') {
         const data = await apiService.getSuperVenues();
         setVenues(data);
      } else {
         const data = await apiService.getSuperCCAs();
         setCcas(data);
      }
      setLoading(false);
   };

   const handleOpenHistory = async (item: any) => {
      setSelectedItem(item);
      setHistoryData(null);
      setShowHistoryModal(true);
      if (activeTab === 'venues') {
         const hist = await apiService.getVenueHistory(item.id);
         setHistoryData(hist);
      } else {
         const hist = await apiService.getCCAHistory(item.id);
         setHistoryData(hist);
      }
   };

   const handleOpenDetail = (item: any) => {
      setSelectedItem(item);
      setEditForm({ ...item });
      setShowDetailModal(true);
   };

   const handleSaveDetail = async () => {
      if (activeTab === 'venues') {
         const success = await apiService.updateVenue(selectedItem.id, editForm);
         if (success) {
            alert('Venue updated successfully');
            setShowDetailModal(false);
            loadData();
         }
      } else {
         const success = await apiService.updateCCA({ id: selectedItem.id, ...editForm });
         if (success) {
            alert('CCA updated successfully');
            setShowDetailModal(false);
            loadData();
         }
      }
   };

   if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin size-8 border-4 border-red-600 border-t-transparent rounded-full" /></div>;

   return (
      <div className="space-y-10 animate-fade-in relative text-white">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex gap-4 p-1.5 bg-zinc-900 rounded-2xl border border-white/5 w-fit">
               <button onClick={() => setActiveTab('venues')} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'venues' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-white'}`}>Partners (Venues)</button>
               <button onClick={() => setActiveTab('ccas')} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'ccas' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-white'}`}>CCAs (Staff)</button>
            </div>
            <div className="flex gap-4">
               <div className="bg-zinc-900 px-6 py-3 rounded-xl border border-white/5 flex items-center gap-4">
                  <p className="text-[9px] font-black text-gray-500 uppercase">Total {activeTab === 'venues' ? 'Venues' : 'CCAs'}</p>
                  <span className="bg-red-600 px-3 py-1 rounded-full text-[10px] font-black">{activeTab === 'venues' ? venues.length : ccas.length}</span>
               </div>
            </div>
         </div>

         {/* Data Table */}
         <div className="bg-zinc-900 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-black/40">
                        <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">No.</th>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Region</th>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">{activeTab === 'venues' ? 'Venue Name' : 'Nickname'}</th>
                        {activeTab === 'ccas' && <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Venue</th>}
                        <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Today Res.</th>
                        {activeTab === 'venues' && <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Current CCAs</th>}
                        <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {(activeTab === 'venues' ? venues : ccas).map((item, index) => (
                        <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                           <td className="px-8 py-6 text-xs font-bold text-gray-500">{index + 1}</td>
                           <td className="px-8 py-6 text-xs font-black uppercase text-red-500">{item.region || 'MANILA'}</td>
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                 {item.image && <img src={item.image} className="size-10 rounded-lg object-cover border border-white/10" />}
                                 <div>
                                    <p className="font-black text-sm">{activeTab === 'venues' ? item.name : item.nickname || item.name}</p>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase">{item.id}</p>
                                 </div>
                              </div>
                           </td>
                           {activeTab === 'ccas' && <td className="px-8 py-6 text-xs font-bold text-gray-400">{item.venue_name || '-'}</td>}
                           <td className="px-8 py-6">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black ${item.today_reservations > 0 ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-500'}`}>
                                 {item.today_reservations || 0}
                              </span>
                           </td>
                           {activeTab === 'venues' && <td className="px-8 py-6 text-xs font-black text-gray-300">{item.cca_count || 0}</td>}
                           <td className="px-8 py-6 text-right">
                              <div className="flex items-center justify-end gap-3">
                                 <button onClick={() => handleOpenHistory(item)} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 transition-all flex items-center gap-2">
                                    <span className="material-symbols-outlined text-xs">history</span> History
                                 </button>
                                 <button onClick={() => handleOpenDetail(item)} className="px-4 py-2 bg-red-600/10 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center gap-2 border border-red-500/20">
                                    <span className="material-symbols-outlined text-xs">settings</span> Detail
                                 </button>
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         {/* HISTORY MODAL */}
         <AnimatePresence>
            {showHistoryModal && selectedItem && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowHistoryModal(false)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
                  <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-zinc-900 border border-white/10 w-full max-w-4xl h-[80vh] rounded-[3rem] overflow-hidden shadow-2xl z-10 flex flex-col" >
                     <div className="p-8 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="size-12 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-500">
                              <span className="material-symbols-outlined">history</span>
                           </div>
                           <h4 className="text-xl font-black uppercase italic tracking-widest">{activeTab === 'venues' ? 'Venue' : 'CCA'} History Tracker</h4>
                        </div>
                        <button onClick={() => setShowHistoryModal(false)} className="size-12 rounded-2xl bg-white/5 hover:bg-red-600 transition-colors flex items-center justify-center">
                           <span className="material-symbols-outlined">close</span>
                        </button>
                     </div>
                     <div className="flex-1 overflow-y-auto p-10 space-y-12">
                        {/* Summary Header */}
                        <div className="flex items-center gap-8 p-8 bg-black/30 rounded-3xl border border-white/5">
                           <img src={selectedItem.image} className="size-24 rounded-2xl object-cover border-2 border-red-600" />
                           <div>
                              <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-1">{activeTab === 'venues' ? selectedItem.name : selectedItem.nickname || selectedItem.name}</h3>
                              <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Unique ID: {selectedItem.id}</p>
                           </div>
                        </div>

                        {!historyData ? (
                           <div className="flex justify-center p-20"><div className="animate-spin size-8 border-4 border-red-600 border-t-transparent rounded-full" /></div>
                        ) : (
                           <div className="space-y-12">
                              {/* Employment / Associated CCAs List */}
                              <section>
                                 <h5 className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] mb-6">{activeTab === 'venues' ? 'Affiliated CCAs (Past & Present)' : 'Employment History'}</h5>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(activeTab === 'venues' ? historyData.ccas : historyData.venues).map((hist: any, i: number) => (
                                       <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                          <div className="flex items-center gap-4">
                                             {activeTab === 'venues' && <img src={hist.image} className="size-10 rounded-lg object-cover" />}
                                             <div>
                                                <p className="text-sm font-black tracking-tight">{activeTab === 'venues' ? hist.nickname || hist.cca_name : hist.venue_name}</p>
                                                <p className="text-[9px] font-bold text-gray-500">{hist.join_date} ~ {hist.leave_date || 'Present'}</p>
                                             </div>
                                          </div>
                                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${hist.leave_date ? 'bg-gray-500/10 text-gray-500' : 'bg-red-600/10 text-red-600'}`}>
                                             {hist.leave_date ? 'TERMINATED' : 'ACTIVE'}
                                          </span>
                                       </div>
                                    ))}
                                    {(activeTab === 'venues' ? historyData.ccas : historyData.venues).length === 0 && <p className="col-span-2 text-center text-gray-500 italic text-xs py-10 uppercase tracking-widest">No history recorded yet.</p>}
                                 </div>
                              </section>

                              {/* Reservation Graph (Simple representation) */}
                              <section>
                                 <h5 className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] mb-6 italic">Reservation Performance (Last 30 Days)</h5>
                                 <div className="bg-black/40 p-10 rounded-[2.5rem] border border-white/5 h-64 flex items-end gap-2 overflow-x-auto">
                                    {(activeTab === 'venues' ? historyData.stats : historyData.resStats).map((s: any, i: number) => (
                                       <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                                          <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 text-[8px] font-black px-2 py-1 rounded-lg pointer-events-none whitespace-nowrap">{s.reservation_date}: {s.count} Res</div>
                                          <div className="w-full bg-red-600/20 rounded-t-lg group-hover:bg-red-600 transition-colors" style={{ height: `${Math.min(s.count * 10, 160)}px` }} />
                                          <div className="h-1 w-full bg-zinc-800" />
                                       </div>
                                    ))}
                                    {(activeTab === 'venues' ? historyData.stats : historyData.resStats).length === 0 && <p className="w-full text-center text-gray-600 italic text-xs py-10 uppercase tracking-widest">Waiting for data cycles...</p>}
                                 </div>
                              </section>

                              {activeTab === 'ccas' && historyData.pointStats && (
                                 <section>
                                    <h5 className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] mb-6 italic">Points Acquisition Trend</h5>
                                    <div className="bg-black/40 p-10 rounded-[2.5rem] border border-white/5 h-64 flex items-end gap-2 overflow-x-auto">
                                       {historyData.pointStats.map((s: any, i: number) => (
                                          <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                                             <div className="w-full bg-yellow-500/20 rounded-t-lg group-hover:bg-yellow-500 transition-colors" style={{ height: `${Math.min(s.points / 10, 160)}px` }} />
                                             <div className="h-1 w-full bg-zinc-800" />
                                          </div>
                                       ))}
                                       {historyData.pointStats.length === 0 && <p className="w-full text-center text-gray-600 italic text-xs py-10 uppercase tracking-widest">No point activity detected.</p>}
                                    </div>
                                 </section>
                              )}
                           </div>
                        )}
                     </div>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>

         {/* DETAIL EDIT MODAL */}
         <AnimatePresence>
            {showDetailModal && selectedItem && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDetailModal(false)} className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
                  <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-[#1b180d] border border-red-500/30 w-full max-w-3xl rounded-[3rem] overflow-hidden shadow-2xl z-10 flex flex-col relative" >
                     <div className="p-8 border-b border-red-500/10 flex items-center justify-between bg-red-600/5">
                        <h4 className="text-2xl font-black text-white italic uppercase tracking-widest">Master Data Control: {activeTab === 'venues' ? 'Venue' : 'CCA'}</h4>
                        <button onClick={() => setShowDetailModal(false)} className="size-12 flex items-center justify-center rounded-2xl bg-white/5 text-white hover:bg-red-600 transition-all">
                           <span className="material-symbols-outlined">close</span>
                        </button>
                     </div>
                     <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           {activeTab === 'venues' ? (
                              <>
                                 <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Venue Name</label>
                                    <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-600" />
                                 </div>
                                 <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Region</label>
                                    <select value={editForm.region} onChange={e => setEditForm({ ...editForm, region: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-600">
                                       <option value="Manila" className="bg-[#1b180d]">Manila</option>
                                       <option value="Clark/Angeles" className="bg-[#1b180d]">Clark/Angeles</option>
                                       <option value="Cebu" className="bg-[#1b180d]">Cebu</option>
                                       <option value="Others" className="bg-[#1b180d]">Others</option>
                                    </select>
                                 </div>
                                 <div className="space-y-3 md:col-span-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Full Address</label>
                                    <input type="text" value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-600" />
                                 </div>
                                 <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Contact Number</label>
                                    <input type="text" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-600" />
                                 </div>
                                 <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Base Rating</label>
                                    <input type="number" step="0.1" value={editForm.rating} onChange={e => setEditForm({ ...editForm, rating: parseFloat(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-600" />
                                 </div>
                              </>
                           ) : (
                              <>
                                 <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Public Nickname</label>
                                    <input type="text" value={editForm.nickname} onChange={e => setEditForm({ ...editForm, nickname: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-600" />
                                 </div>
                                 <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Current Venue Association</label>
                                    <select value={editForm.venue_id} onChange={e => setEditForm({ ...editForm, venue_id: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-600">
                                       {venues.map((v: any) => <option key={v.id} value={v.id} className="bg-[#1b180d]">{v.name}</option>)}
                                    </select>
                                 </div>
                                 <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Birthday (DD. MMM. YYYY.)</label>
                                    <input type="text" value={editForm.birthday} onChange={e => setEditForm({ ...editForm, birthday: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-600" />
                                 </div>
                                 <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Staff Phone</label>
                                    <input type="text" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-600" />
                                 </div>
                                 <div className="space-y-3 md:col-span-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Management Description / Internal Notes</label>
                                    <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-600 resize-none" />
                                 </div>
                              </>
                           )}
                        </div>
                     </div>
                     <div className="p-10 border-t border-red-500/10 flex gap-6 bg-red-600/5">
                        <button onClick={() => setShowDetailModal(false)} className="flex-1 py-5 border border-white/10 text-gray-400 rounded-3xl font-black uppercase text-xs tracking-[0.2em] hover:bg-white/5 transition-all">Cancel</button>
                        <button onClick={handleSaveDetail} className="flex-1 py-5 bg-red-600 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-red-600/30 hover:scale-[1.02] active:scale-95 transition-all">Synchronize Master Data</button>
                     </div>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>
      </div>
   );
};

export default SuperPartners;
