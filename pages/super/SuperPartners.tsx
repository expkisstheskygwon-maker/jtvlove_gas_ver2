
import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { Venue, CCA } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

const TIME_OPTIONS = Array.from({ length: 24 }).map((_, h) => {
   const ampm = h < 12 ? '오전' : '오후';
   let displayHour = h % 12;
   if (displayHour === 0) displayHour = 12;
   const value = `${h.toString().padStart(2, '0')}:00`;
   const label = `${ampm} ${displayHour.toString().padStart(2, '0')}:00`;
   return { value, label };
});

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
   const [venueActiveTab, setVenueActiveTab] = useState<'basic' | 'media' | 'menu' | 'tables_rooms'>('basic');

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
         setEditForm({
            name: '',
            region: 'MANILA',
            address: '',
            phone: '',
            rating: 0,
            description: '',
            introduction: '',
            sns: { telegram: '', facebook: '', kakao: '', band: '', instagram: '', discord: '' },
            operating_hours: { open: '19:00', close: '02:00' },
            showUpTime: { first: '19:30', last: '21:00' },
            image: '',
            banner_image: '',
            media: [],
            tags: ['Main Dishes', 'Set Menu', 'Premium Drinks', 'Side Dishes'],
            menu: [],
            tables: [],
            rooms: []
         });
         setVenueActiveTab('basic');
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

         // Venue fields
         sns: typeof item.sns === 'string' ? JSON.parse(item.sns) : (item.sns || { telegram: '', facebook: '', kakao: '', band: '', instagram: '', discord: '' }),
         operating_hours: typeof item.operating_hours === 'string' ? JSON.parse(item.operating_hours) : (item.operating_hours || { open: '19:00', close: '02:00' }),
         showUpTime: typeof item.showUpTime === 'string' ? JSON.parse(item.showUpTime) : (item.showUpTime || { first: '19:30', last: '21:00' }),
         media: typeof item.media === 'string' ? JSON.parse(item.media) : (item.media || []),
         tags: typeof item.tags === 'string' ? JSON.parse(item.tags) : (item.tags || ['Main Dishes', 'Set Menu', 'Premium Drinks', 'Side Dishes']),
         menu: typeof item.menu === 'string' ? JSON.parse(item.menu) : (item.menu || []),
         tables: typeof item.tables === 'string' ? JSON.parse(item.tables) : (item.tables || []),
         rooms: typeof item.rooms === 'string' ? JSON.parse(item.rooms) : (item.rooms || []),
         banner_image: item.banner_image || '',
         introduction: item.introduction || item.description || ''
      };

      setEditForm(mappedItem);
      setVenueActiveTab('basic');
      setShowDetailModal(true);
   };


   const handleSaveDetail = async () => {
      setIsSaving(true);
      try {
         if (activeTab === 'venues') {
            // Map to DB columns explicitly to avoid legacy key conflicts
            const updates = {
               name: editForm.name,
               region: editForm.region,
               phone: editForm.phone,
               address: editForm.address,
               introduction: editForm.introduction,
               image: editForm.image,
               banner_image: editForm.banner_image,
               sns: editForm.sns,
               operating_hours: editForm.operating_hours,
               showUpTime: editForm.showUpTime,
               media: editForm.media,
               tags: editForm.tags,
               menu: editForm.menu,
               tables: editForm.tables,
               rooms: editForm.rooms,
               rating: editForm.rating || 0,
               description: editForm.introduction || editForm.description || ''
            };

            const result = isCreateMode
               ? await apiService.createVenue(updates)
               : await apiService.updateVenue(selectedItem?.id, updates);

            if ((typeof result === 'boolean' && result) || (typeof result === 'object' && result.success)) {
               alert(`Venue ${isCreateMode ? 'registered' : 'updated'} successfully`);
               setShowDetailModal(false);
               loadData();
            } else {
               alert("Failed to save venue details. Please check the connection.");
            }
         } else {
            // CCA Save Logic
            const ccaData = {
               ...editForm,
               venue_id: editForm.venueId,
               real_name_first: editForm.realNameFirst,
               real_name_middle: editForm.realNameMiddle,
               real_name_last: editForm.realNameLast,
               one_line_story: editForm.oneLineStory,
               marital_status: editForm.maritalStatus,
               children_status: editForm.childrenStatus
            };
            // Remove UI-only camelCase fields before sending to backend
            delete ccaData.venueId;
            delete ccaData.realNameFirst;
            delete ccaData.realNameMiddle;
            delete ccaData.realNameLast;
            delete ccaData.oneLineStory;
            delete ccaData.maritalStatus;
            delete ccaData.childrenStatus;

            const result = isCreateMode
               ? await apiService.createCCA(ccaData)
               : await apiService.updateCCA(ccaData);

            if (result) {
               alert(`CCA profile ${isCreateMode ? 'created' : 'synchronized'} successfully`);
               setShowDetailModal(false);
               loadData();
            } else {
               alert("Failed to synchronize CCA master data.");
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
                           <div className="space-y-12">
                              {/* Venue Sub-tabs */}
                              <div className="flex flex-wrap gap-4 p-1.5 bg-black/40 rounded-3xl border border-white/5 w-fit mx-auto lg:mx-0">
                                 {(['basic', 'media', 'menu', 'tables_rooms'] as const).map(t => (
                                    <button
                                       key={t}
                                       onClick={() => setVenueActiveTab(t)}
                                       className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${venueActiveTab === t ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-gray-500 hover:text-white'}`}
                                    >
                                       {t.replace('_', ' & ')}
                                    </button>
                                 ))}
                              </div>

                              {/* Tab Content: BASIC */}
                              {venueActiveTab === 'basic' && (
                                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-fade-in">
                                    <div className="lg:col-span-2 space-y-10">
                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                          <div className="space-y-4">
                                             <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">Venue Name</label>
                                             <input type="text" value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white font-black" placeholder="업체명을 입력하세요..." />
                                          </div>
                                          <div className="space-y-4">
                                             <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">Region</label>
                                             <select value={editForm.region || 'MANILA'} onChange={e => setEditForm({ ...editForm, region: e.target.value })} className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-6 py-5 text-white font-black">
                                                <option value="MANILA">MANILA</option>
                                                <option value="CLARK">CLARK/ANGELES</option>
                                                <option value="CEBU">CEBU</option>
                                                <option value="ETC">OTHERS</option>
                                             </select>
                                          </div>
                                          <div className="space-y-4">
                                             <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">Main Phone</label>
                                             <input type="text" value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white font-black" />
                                          </div>
                                          <div className="grid grid-cols-2 gap-4">
                                             <div className="space-y-4">
                                                <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">Open</label>
                                                <select value={editForm.operating_hours?.open || '19:00'} onChange={e => setEditForm({ ...editForm, operating_hours: { ...editForm.operating_hours, open: e.target.value } })} className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-6 py-5 text-white font-black appearance-none focus:ring-2 focus:ring-red-500/20">
                                                   {TIME_OPTIONS.map(opt => <option key={opt.value} value={opt.value} className="bg-black text-white">{opt.label}</option>)}
                                                </select>
                                             </div>
                                             <div className="space-y-4">
                                                <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">Close</label>
                                                <select value={editForm.operating_hours?.close || '02:00'} onChange={e => setEditForm({ ...editForm, operating_hours: { ...editForm.operating_hours, close: e.target.value } })} className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-6 py-5 text-white font-black appearance-none focus:ring-2 focus:ring-red-500/20">
                                                   {TIME_OPTIONS.map(opt => <option key={opt.value} value={opt.value} className="bg-black text-white">{opt.label}</option>)}
                                                </select>
                                             </div>
                                          </div>
                                       </div>
                                       <div className="space-y-4">
                                          <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">Full Address</label>
                                          <textarea value={editForm.address || ''} onChange={e => setEditForm({ ...editForm, address: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white font-bold h-24" />
                                       </div>
                                       <div className="space-y-4">
                                          <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">Shop Introduction</label>
                                          <textarea value={editForm.introduction || ''} onChange={e => setEditForm({ ...editForm, introduction: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white font-bold h-32" maxLength={300} />
                                       </div>

                                       <div className="space-y-6">
                                          <h6 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] border-b border-white/5 pb-2">SNS & Social Archives</h6>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                             {['Telegram', 'Facebook', 'Kakao', 'Band', 'Instagram', 'Discord'].map(sns => (
                                                <div key={sns} className="space-y-2">
                                                   <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2">{sns}</label>
                                                   <input type="text" value={editForm.sns?.[sns.toLowerCase()] || ''} onChange={e => setEditForm({ ...editForm, sns: { ...editForm.sns, [sns.toLowerCase()]: e.target.value } })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold text-xs" placeholder={`${sns} Link/ID`} />
                                                </div>
                                             ))}
                                          </div>
                                       </div>
                                    </div>

                                    <div className="space-y-10">
                                       <div className="space-y-4">
                                          <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">Venue Logo (Square)</label>
                                          <div className="relative group aspect-square rounded-[3rem] border-2 border-dashed border-white/10 overflow-hidden bg-black/40 flex items-center justify-center">
                                             {editForm.image ? (
                                                <img src={editForm.image} className="size-full object-cover" />
                                             ) : (
                                                <span className="material-symbols-outlined text-4xl text-gray-700">store</span>
                                             )}
                                             <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                                <span className="text-[10px] font-black uppercase tracking-widest bg-white text-black px-6 py-3 rounded-2xl">Upload Logo</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={e => {
                                                   const file = e.target.files?.[0];
                                                   if (file) {
                                                      const reader = new FileReader();
                                                      reader.onloadend = () => setEditForm({ ...editForm, image: reader.result as string });
                                                      reader.readAsDataURL(file);
                                                   }
                                                }} />
                                             </label>
                                          </div>
                                       </div>

                                       <div className="space-y-4">
                                          <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">Hero Banner (Wide)</label>
                                          <div className="relative group aspect-[2/1] rounded-[3rem] border-2 border-dashed border-white/10 overflow-hidden bg-black/40 flex items-center justify-center">
                                             {editForm.banner_image ? (
                                                <img src={editForm.banner_image} className="size-full object-cover" />
                                             ) : (
                                                <span className="material-symbols-outlined text-4xl text-gray-700">featured_video</span>
                                             )}
                                             <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                                <span className="text-[10px] font-black uppercase tracking-widest bg-white text-black px-6 py-3 rounded-2xl">Upload Banner</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={e => {
                                                   const file = e.target.files?.[0];
                                                   if (file) {
                                                      const reader = new FileReader();
                                                      reader.onloadend = () => setEditForm({ ...editForm, banner_image: reader.result as string });
                                                      reader.readAsDataURL(file);
                                                   }
                                                }} />
                                             </label>
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              )}

                              {/* Tab Content: MEDIA */}
                              {venueActiveTab === 'media' && (
                                 <div className="space-y-10 animate-fade-in">
                                    <div className="flex items-center justify-between">
                                       <h6 className="text-xs font-black uppercase tracking-widest">Gallery & Neural Archives</h6>
                                       <label className="bg-white text-black px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-red-600 hover:text-white transition-all">
                                          + Upload Neural Media
                                          <input type="file" multiple className="hidden" accept="image/*" onChange={e => {
                                             const files = Array.from(e.target.files || []);
                                             files.forEach(f => {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                   setEditForm((prev: any) => ({
                                                      ...prev,
                                                      media: [...(prev.media || []), { id: Date.now() + Math.random(), type: 'image', url: reader.result as string, isExposed: true }]
                                                   }));
                                                };
                                                reader.readAsDataURL(f);
                                             });
                                          }} />
                                       </label>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                       {(editForm.media || []).map((m: any, idx: number) => (
                                          <div key={idx} className="group relative aspect-square rounded-[2rem] overflow-hidden border border-white/10">
                                             <img src={m.url} className="size-full object-cover" />
                                             <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                <button onClick={() => setEditForm({ ...editForm, media: editForm.media.filter((_: any, i: number) => i !== idx) })} className="size-10 bg-red-600 rounded-full flex items-center justify-center"><span className="material-symbols-outlined text-sm">delete</span></button>
                                             </div>
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              )}

                              {/* Tab Content: MENU */}
                              {venueActiveTab === 'menu' && (
                                 <div className="space-y-12 animate-fade-in">
                                    <div className="bg-black/40 rounded-[2.5rem] p-10 border border-white/10 space-y-8">
                                       <div className="flex items-center justify-between">
                                          <h6 className="text-xs font-black uppercase tracking-widest">Menu Categories</h6>
                                          <button onClick={() => {
                                             const cat = prompt("Enter new category name:");
                                             if (cat) setEditForm({ ...editForm, tags: [...(editForm.tags || []), cat] });
                                          }} className="text-red-500 font-black text-[10px] uppercase underline">+ Add Category</button>
                                       </div>
                                       <div className="flex flex-wrap gap-4">
                                          {(editForm.tags || []).map((tag: string) => (
                                             <div key={tag} className="group bg-white/5 border border-white/10 px-6 py-4 rounded-2xl flex items-center gap-4 hover:border-red-500/50 transition-all">
                                                <span className="text-xs font-black tracking-tight">{tag}</span>
                                                <button onClick={() => setEditForm({ ...editForm, tags: editForm.tags.filter((t: string) => t !== tag) })} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500"><span className="material-symbols-outlined text-sm">close</span></button>
                                             </div>
                                          ))}
                                       </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                       {(editForm.menu || []).map((m: any, idx: number) => (
                                          <div key={idx} className="bg-black/40 p-6 rounded-[2rem] border border-white/5 flex gap-6 items-center group">
                                             <img src={m.image} className="size-24 rounded-2xl object-cover" />
                                             <div className="flex-1">
                                                <h5 className="font-black text-sm uppercase italic">{m.name}</h5>
                                                <p className="text-red-500 font-black text-xs mt-1">PHP {m.price}</p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">{m.category}</p>
                                             </div>
                                             <button onClick={() => setEditForm({ ...editForm, menu: editForm.menu.filter((_: any, i: number) => i !== idx) })} className="opacity-0 group-hover:opacity-100 transition-opacity size-10 bg-white/5 hover:bg-red-600 rounded-full flex items-center justify-center"><span className="material-symbols-outlined text-sm">delete</span></button>
                                          </div>
                                       ))}
                                       <button onClick={() => {
                                          const name = prompt("Dish Name?");
                                          const price = prompt("Price (PHP)?");
                                          const category = prompt("Category?", editForm.tags?.[0] || "");
                                          if (name && price) {
                                             setEditForm({ ...editForm, menu: [...(editForm.menu || []), { id: Date.now(), name, price, category, image: '' }] });
                                          }
                                       }} className="rounded-[2.5rem] border-2 border-dashed border-white/10 hover:border-red-600/50 transition-all flex flex-col items-center justify-center p-10 gap-3 grayscale hover:grayscale-0">
                                          <span className="material-symbols-outlined text-3xl">restaurant_menu</span>
                                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Append New Neural Delicacy</span>
                                       </button>
                                    </div>
                                 </div>
                              )}

                              {/* Tab Content: TABLES & ROOMS */}
                              {venueActiveTab === 'tables_rooms' && (
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-fade-in">
                                    <div className="space-y-8">
                                       <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                          <h6 className="text-xs font-black uppercase tracking-widest text-red-500">Deployment Tables</h6>
                                          <button onClick={() => {
                                             const name = prompt("Table Name?");
                                             if (name) setEditForm({ ...editForm, tables: [...(editForm.tables || []), { id: Date.now(), name, number: '0', capacity: '4', image: '' }] });
                                          }} className="text-[10px] font-black underline">+ Deploy Unit</button>
                                       </div>
                                       <div className="space-y-4">
                                          {(editForm.tables || []).map((t: any, idx: number) => (
                                             <div key={idx} className="bg-black/40 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                                                <span className="text-xs font-black uppercase italic">{t.name} (Cap: {t.capacity})</span>
                                                <button onClick={() => setEditForm({ ...editForm, tables: editForm.tables.filter((_: any, i: number) => i !== idx) })} className="text-gray-500 hover:text-red-500"><span className="material-symbols-outlined text-sm">delete</span></button>
                                             </div>
                                          ))}
                                       </div>
                                    </div>
                                    <div className="space-y-8">
                                       <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                          <h6 className="text-xs font-black uppercase tracking-widest text-primary">Private VIP Rooms</h6>
                                          <button onClick={() => {
                                             const name = prompt("Room Name?");
                                             if (name) setEditForm({ ...editForm, rooms: [...(editForm.rooms || []), { id: Date.now(), name, number: '0', capacity: '10', image: '' }] });
                                          }} className="text-[10px] font-black underline">+ Sync Node</button>
                                       </div>
                                       <div className="space-y-4">
                                          {(editForm.rooms || []).map((r: any, idx: number) => (
                                             <div key={idx} className="bg-black/40 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                                                <span className="text-xs font-black uppercase italic">{r.name} (Cap: {r.capacity})</span>
                                                <button onClick={() => setEditForm({ ...editForm, rooms: editForm.rooms.filter((_: any, i: number) => i !== idx) })} className="text-gray-500 hover:text-red-500"><span className="material-symbols-outlined text-sm">delete</span></button>
                                             </div>
                                          ))}
                                       </div>
                                    </div>
                                 </div>
                              )}
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
