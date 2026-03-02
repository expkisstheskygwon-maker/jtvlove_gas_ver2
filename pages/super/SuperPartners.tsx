
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
   const [isCreateMode, setIsCreateMode] = useState(false);
   const [isSaving, setIsSaving] = useState(false);

   useEffect(() => {
      loadData();
   }, [activeTab]);

   const loadData = async () => {
      setLoading(true);
      try {
         if (activeTab === 'venues') {
            const data = await apiService.getSuperVenues();
            setVenues(Array.isArray(data) ? data : []);
         } else {
            const data = await apiService.getSuperCCAs();
            setCcas(Array.isArray(data) ? data : []);
         }
      } catch (err) {
         console.error("Load data error", err);
      } finally {
         setLoading(false);
      }
   };

   const handleAddNew = () => {
      setIsCreateMode(true);
      if (activeTab === 'venues') {
         setEditForm({ name: '', region: 'Manila', address: '', phone: '', rating: 0, description: '' });
      } else {
         const firstVenueId = venues && venues.length > 0 ? venues[0].id : '';
         setEditForm({
            nickname: '',
            venueId: firstVenueId,
            realNameFirst: '',
            realNameMiddle: '',
            realNameLast: '',
            birthday: '01. Jan. 2000.',
            phone: '',
            address: '',
            mbti: '',
            oneLineStory: '',
            specialties: [],
            languages: ['ENGLISH'],
            drinking: 'Occasional',
            smoking: 'Non-smoker',
            pets: 'None',
            maritalStatus: 'SINGLE',
            childrenStatus: 'NONE',
            status: 'active',
            grade: 'PRO',
            image: ''
         });
      }
      setShowDetailModal(true);
   };

   const handleOpenHistory = async (item: any) => {
      setSelectedItem(item);
      setHistoryData(null);
      setShowHistoryModal(true);
      try {
         if (activeTab === 'venues') {
            const hist = await apiService.getVenueHistory(item.id);
            setHistoryData(hist);
         } else {
            const hist = await apiService.getCCAHistory(item.id);
            setHistoryData(hist);
         }
      } catch (err) {
         console.error("History fetch error", err);
      }
   };

   const handleOpenDetail = (item: any) => {
      setIsCreateMode(false);
      setSelectedItem(item);

      // Map backend snake_case to frontend camelCase for the form if needed
      // Though getSuperCCAs already brings c.*
      const mappedItem = {
         ...item,
         venueId: item.venue_id,
         realNameFirst: item.real_name_first,
         realNameMiddle: item.real_name_middle,
         realNameLast: item.real_name_last,
         oneLineStory: item.one_line_story,
         maritalStatus: item.marital_status,
         childrenStatus: item.children_status,
         specialties: typeof item.specialties === 'string' ? JSON.parse(item.specialties) : (item.specialties || []),
         languages: typeof item.languages === 'string' ? JSON.parse(item.languages) : (item.languages || []),
      };

      setEditForm(mappedItem);
      setShowDetailModal(true);
   };

   const handleSaveDetail = async () => {
      setIsSaving(true);
      try {
         if (activeTab === 'venues') {
            const result = isCreateMode
               ? await apiService.createVenue(editForm)
               : await apiService.updateVenue(selectedItem?.id, editForm);

            if ((typeof result === 'boolean' && result) || (typeof result === 'object' && result.success)) {
               alert(`Venue ${isCreateMode ? 'registered' : 'updated'} successfully`);
               setShowDetailModal(false);
               loadData();
            }
         } else {
            const success = await apiService.updateCCA(isCreateMode ? editForm : { id: selectedItem?.id, ...editForm });
            if (success) {
               alert(`CCA ${isCreateMode ? 'registered' : 'updated'} successfully`);
               setShowDetailModal(false);
               loadData();
            } else {
               alert("Operation failed on server side.");
            }
         }
      } catch (err: any) {
         console.error("Save error", err);
         alert(`Operation failed: ${err.message}`);
      } finally {
         setIsSaving(false);
      }
   };

   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         const reader = new FileReader();
         reader.onloadend = () => {
            setEditForm({ ...editForm, image: reader.result as string });
         };
         reader.readAsDataURL(file);
      }
   };

   const toggleSpec = (spec: string) => {
      const current = editForm.specialties || [];
      if (current.includes(spec)) {
         setEditForm({ ...editForm, specialties: current.filter((s: string) => s !== spec) });
      } else {
         setEditForm({ ...editForm, specialties: [...current, spec] });
      }
   };

   const toggleLang = (lang: string) => {
      const current = editForm.languages || [];
      if (current.includes(lang)) {
         setEditForm({ ...editForm, languages: current.filter((l: string) => l !== lang) });
      } else {
         setEditForm({ ...editForm, languages: [...current, lang] });
      }
   };

   return (
      <div className="space-y-10 animate-fade-in relative text-white">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex flex-wrap items-center gap-6">
               <div className="flex gap-4 p-1.5 bg-zinc-900 rounded-2xl border border-white/5 w-fit">
                  <button onClick={() => setActiveTab('venues')} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'venues' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-white'}`}>Partners</button>
                  <button onClick={() => setActiveTab('ccas')} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'ccas' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-white'}`}>CCAs</button>
               </div>
               <button onClick={handleAddNew} className="bg-white text-black px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">add</span> Register New
               </button>
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
            {loading ? (
               <div className="flex items-center justify-center py-20">
                  <div className="animate-spin size-8 border-4 border-red-600 border-t-transparent rounded-full" />
               </div>
            ) : (
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="bg-black/40">
                           <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">No.</th>
                           <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Region</th>
                           <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Name</th>
                           {activeTab === 'ccas' && <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Venue</th>}
                           <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Res.</th>
                           {activeTab === 'venues' && <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">CCAs</th>}
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
                        {(activeTab === 'venues' ? venues : ccas).length === 0 && (
                           <tr>
                              <td colSpan={7} className="px-8 py-20 text-center text-gray-500 italic uppercase text-[10px] font-black tracking-widest">No entries found in the neural archives</td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            )}
         </div>

         {/* HISTORY MODAL */}
         <AnimatePresence>
            {showHistoryModal && selectedItem && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowHistoryModal(false)} className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
                  <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-zinc-950 border border-white/10 w-full max-w-4xl h-[80vh] rounded-[3rem] overflow-hidden shadow-2xl z-10 flex flex-col" >
                     <div className="p-8 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="size-12 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-500">
                              <span className="material-symbols-outlined">history</span>
                           </div>
                           <h4 className="text-xl font-black uppercase italic tracking-widest">History Tracker</h4>
                        </div>
                        <button onClick={() => setShowHistoryModal(false)} className="size-12 rounded-2xl bg-white/5 hover:bg-red-600 transition-colors flex items-center justify-center"><span className="material-symbols-outlined">close</span></button>
                     </div>
                     <div className="flex-1 overflow-y-auto p-10 space-y-12">
                        {/* Summary */}
                        <div className="flex items-center gap-8 p-8 bg-black/30 rounded-3xl border border-white/5">
                           {selectedItem.image && <img src={selectedItem.image} className="size-24 rounded-2xl object-cover border-2 border-red-600" />}
                           <div>
                              <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-1">{activeTab === 'venues' ? selectedItem.name : selectedItem.nickname || selectedItem.name}</h3>
                              <p className="text-xs font-black text-gray-500 uppercase tracking-widest">ID: {selectedItem.id}</p>
                           </div>
                        </div>

                        {!historyData ? (
                           <div className="flex justify-center p-20"><div className="animate-spin size-8 border-4 border-red-600 border-t-transparent rounded-full" /></div>
                        ) : (
                           <div className="space-y-12">
                              <section>
                                 <h5 className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] mb-6">{activeTab === 'venues' ? 'Affiliated CCAs' : 'Employment History'}</h5>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(activeTab === 'venues' ? (historyData.ccas || []) : (historyData.venues || [])).map((hist: any, i: number) => (
                                       <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                          <div className="flex items-center gap-4">
                                             {activeTab === 'venues' && hist.image && <img src={hist.image} className="size-10 rounded-lg object-cover" />}
                                             <div>
                                                <p className="text-sm font-black tracking-tight">{activeTab === 'venues' ? hist.nickname || hist.cca_name : hist.venue_name}</p>
                                                <p className="text-[9px] font-bold text-gray-500">{hist.join_date} ~ {hist.leave_date || 'Present'}</p>
                                             </div>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              </section>
                           </div>
                        )}
                     </div>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>

         {/* DETAIL MODAL */}
         <AnimatePresence>
            {showDetailModal && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDetailModal(false)} className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
                  <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-[#1b180d] border border-red-500/30 w-full max-w-5xl h-[90vh] rounded-[3rem] overflow-hidden shadow-2xl z-10 flex flex-col relative" >
                     <div className="p-8 border-b border-red-500/10 flex items-center justify-between bg-red-600/5 flex-shrink-0">
                        <h4 className="text-2xl font-black text-white italic uppercase tracking-widest">{isCreateMode ? 'Register' : 'Edit'} Master Data</h4>
                        <button onClick={() => setShowDetailModal(false)} className="size-12 flex items-center justify-center rounded-2xl bg-white/5 text-white hover:bg-red-600 transition-all"><span className="material-symbols-outlined">close</span></button>
                     </div>
                     <div className="flex-1 overflow-y-auto p-10">
                        {activeTab === 'venues' ? (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-3">
                                 <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Venue Name</label>
                                 <input type="text" value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-600" />
                              </div>
                              <div className="space-y-3">
                                 <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Region</label>
                                 <select value={editForm.region || 'Manila'} onChange={e => setEditForm({ ...editForm, region: e.target.value })} className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-600">
                                    <option value="Manila">Manila</option>
                                    <option value="Clark/Angeles">Clark/Angeles</option>
                                    <option value="Cebu">Cebu</option>
                                    <option value="Others">Others</option>
                                 </select>
                              </div>
                              <div className="space-y-3">
                                 <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Contact</label>
                                 <input type="text" value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-600" />
                              </div>
                              <div className="space-y-3">
                                 <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Full Address</label>
                                 <input type="text" value={editForm.address || ''} onChange={e => setEditForm({ ...editForm, address: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-600" />
                              </div>
                           </div>
                        ) : (
                           <div className="flex flex-col lg:flex-row gap-12">
                              {/* Left Sidebar Widgets */}
                              <div className="lg:w-72 space-y-8 flex-shrink-0">
                                 <div className="bg-black/20 rounded-3xl p-6 border border-white/5 space-y-4 text-center">
                                    <div className="relative group mx-auto size-40">
                                       <div className="absolute inset-0 bg-red-600/20 rounded-full blur-2xl group-hover:bg-red-600/40 transition-all"></div>
                                       {editForm.image ? (
                                          <img src={editForm.image} className="relative size-full rounded-full object-cover border-4 border-red-600/50 shadow-2xl" />
                                       ) : (
                                          <div className="relative size-full rounded-full bg-zinc-800 flex items-center justify-center border-4 border-dashed border-white/10">
                                             <span className="material-symbols-outlined text-4xl text-gray-500">person</span>
                                          </div>
                                       )}
                                       <label className="absolute bottom-1 right-1 size-10 bg-white text-black rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 hover:text-white transition-all shadow-xl">
                                          <span className="material-symbols-outlined text-sm font-black">photo_camera</span>
                                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                       </label>
                                    </div>
                                    <div>
                                       <h5 className="font-black text-lg uppercase italic tracking-tighter">{editForm.nickname || 'Unknown CCA'}</h5>
                                       <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{editForm.grade || 'GRADUATE'}</p>
                                    </div>
                                 </div>

                                 <div className="space-y-3">
                                    <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">MBTI Profile</label>
                                    <input type="text" placeholder="ESTP" value={editForm.mbti || ''} onChange={e => setEditForm({ ...editForm, mbti: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-600" />
                                 </div>

                                 <div className="space-y-3">
                                    <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">Quick Bio</label>
                                    <textarea value={editForm.oneLineStory || ''} onChange={e => setEditForm({ ...editForm, oneLineStory: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-600 h-32 resize-none" placeholder="Nice to meet you hay..." />
                                 </div>

                                 <div className="space-y-4">
                                    <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">Daily Habits</label>
                                    <div className="space-y-4">
                                       <select value={editForm.drinking || ''} onChange={e => setEditForm({ ...editForm, drinking: e.target.value })} className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-3 text-xs font-bold text-gray-300">
                                          <option value="">Drinking (Select)</option>
                                          <option value="Soju Machine">Soju Machine</option>
                                          <option value="Occasional">Occasional</option>
                                          <option value="Never">Never</option>
                                       </select>
                                       <select value={editForm.smoking || ''} onChange={e => setEditForm({ ...editForm, smoking: e.target.value })} className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-3 text-xs font-bold text-gray-300">
                                          <option value="">Smoking (Select)</option>
                                          <option value="Vaping">Vaping</option>
                                          <option value="Smoker">Smoker</option>
                                          <option value="Non-smoker">Non-smoker</option>
                                       </select>
                                       <select value={editForm.pets || ''} onChange={e => setEditForm({ ...editForm, pets: e.target.value })} className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-3 text-xs font-bold text-gray-300">
                                          <option value="">Pets (Select)</option>
                                          <option value="Bird">Bird</option>
                                          <option value="Dog">Dog</option>
                                          <option value="Cat">Cat</option>
                                          <option value="None">None</option>
                                       </select>
                                    </div>
                                 </div>
                              </div>

                              {/* Main Form Content */}
                              <div className="flex-1 space-y-12">
                                 {/* Section: Confidential Info */}
                                 <section className="space-y-6">
                                    <h6 className="text-xs font-black uppercase text-gray-500 border-b border-white/5 pb-2">Real Name (Confidential)</h6>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                       <input type="text" placeholder="First Name" value={editForm.realNameFirst || ''} onChange={e => setEditForm({ ...editForm, realNameFirst: e.target.value })} className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold" />
                                       <input type="text" placeholder="Middle Name" value={editForm.realNameMiddle || ''} onChange={e => setEditForm({ ...editForm, realNameMiddle: e.target.value })} className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold" />
                                       <input type="text" placeholder="Last Name" value={editForm.realNameLast || ''} onChange={e => setEditForm({ ...editForm, realNameLast: e.target.value })} className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold" />
                                    </div>
                                 </section>

                                 {/* Section: Profile Info */}
                                 <section className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                    <div className="space-y-3">
                                       <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Public Nickname</label>
                                       <input type="text" value={editForm.nickname || ''} onChange={e => setEditForm({ ...editForm, nickname: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold" />
                                    </div>
                                    <div className="space-y-3">
                                       <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Venue Affiliation</label>
                                       <select value={editForm.venueId || editForm.venue_id || ''} onChange={e => setEditForm({ ...editForm, venueId: e.target.value, venue_id: e.target.value })} className="w-full bg-zinc-900 border border-white/20 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-600 shadow-lg">
                                          <option value="" className="bg-zinc-900 text-white">Select Venue</option>
                                          {venues.map((v: any) => <option key={v.id} value={v.id} className="bg-zinc-900 text-white">{v.name}</option>)}
                                       </select>
                                    </div>
                                    <div className="space-y-3">
                                       <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Phone Number</label>
                                       <input type="text" value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold" />
                                    </div>
                                    <div className="space-y-3">
                                       <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Birthday (DD. MMM. YYYY.)</label>
                                       <input type="text" value={editForm.birthday || ''} onChange={e => setEditForm({ ...editForm, birthday: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold" placeholder="23. Jan. 2000." />
                                    </div>
                                    <div className="space-y-3 md:col-span-2">
                                       <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Residential Address</label>
                                       <input type="text" value={editForm.address || ''} onChange={e => setEditForm({ ...editForm, address: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold" />
                                    </div>
                                 </section>

                                 {/* Section: Status Checkboxes / Toggle Groups */}
                                 <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div>
                                       <label className="text-[10px] font-black text-gray-500 uppercase ml-2 mb-4 block">Marital Status</label>
                                       <div className="flex flex-wrap gap-3">
                                          {['SINGLE', 'MARRIED', 'SEPARATED'].map(status => (
                                             <button key={status} onClick={() => setEditForm({ ...editForm, maritalStatus: status })} className={`px-5 py-3 rounded-2xl text-[10px] font-black transition-all ${editForm.maritalStatus === status ? 'bg-primary text-black' : 'bg-white/5 text-gray-500'}`}>{status}</button>
                                          ))}
                                       </div>
                                    </div>
                                    <div>
                                       <label className="text-[10px] font-black text-gray-500 uppercase ml-2 mb-4 block">Children</label>
                                       <div className="flex flex-wrap gap-3">
                                          {['NONE', '1', '2', '3+'].map(c => (
                                             <button key={c} onClick={() => setEditForm({ ...editForm, childrenStatus: c })} className={`px-5 py-3 rounded-2xl text-[10px] font-black transition-all ${editForm.childrenStatus === c ? 'bg-primary text-black' : 'bg-white/5 text-gray-500'}`}>{c}</button>
                                          ))}
                                       </div>
                                    </div>
                                 </section>

                                 {/* Section: Specialties & Languages */}
                                 <section className="space-y-8">
                                    <div>
                                       <label className="text-[10px] font-black text-gray-500 uppercase ml-2 mb-4 block">Specialties (특징/특기)</label>
                                       <div className="flex flex-wrap gap-2">
                                          {['DANCE', 'SINGING', 'COOKING', 'GAMING', 'SPORTS', 'MUSIC', 'ART', 'TRAVEL'].map(s => (
                                             <button key={s} onClick={() => toggleSpec(s)} className={`px-4 py-2.5 rounded-xl text-[9px] font-black tracking-widest transition-all ${editForm.specialties?.includes(s) ? 'bg-red-600 text-white shadow-lg' : 'bg-white/5 text-gray-500 border border-white/5'}`}>{s}</button>
                                          ))}
                                       </div>
                                    </div>
                                    <div>
                                       <label className="text-[10px] font-black text-gray-500 uppercase ml-2 mb-4 block">Available Languages (가능 언어)</label>
                                       <div className="flex flex-wrap gap-2">
                                          {['ENGLISH', 'KOREAN', 'JAPANESE', 'CHINESE', 'TAGALOG'].map(l => (
                                             <button key={l} onClick={() => toggleLang(l)} className={`px-4 py-2.5 rounded-xl text-[9px] font-black tracking-widest transition-all ${editForm.languages?.includes(l) ? 'bg-zinc-100 text-black shadow-lg' : 'bg-white/5 text-gray-500 border border-white/5'}`}>{l}</button>
                                          ))}
                                       </div>
                                    </div>
                                 </section>
                              </div>
                           </div>
                        )}
                     </div>
                     <div className="p-10 border-t border-red-500/10 flex gap-6 bg-red-600/5 flex-shrink-0">
                        <button disabled={isSaving} onClick={() => setShowDetailModal(false)} className="flex-1 py-5 border border-white/10 text-gray-400 rounded-3xl font-black uppercase text-xs tracking-[0.2em] hover:bg-white/5 transition-all disabled:opacity-50">Cancel</button>
                        <button disabled={isSaving} onClick={handleSaveDetail} className="flex-1 py-5 bg-red-600 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-red-600/30 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                           {isSaving ? (
                              <>
                                 <div className="animate-spin size-4 border-2 border-white border-t-transparent rounded-full" />
                                 Synchronizing...
                              </>
                           ) : (
                              'Synchronize'
                           )}
                        </button>
                     </div>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>
      </div>
   );
};

export default SuperPartners;
