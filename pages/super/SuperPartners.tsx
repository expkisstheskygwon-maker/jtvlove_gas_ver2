
import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { Venue, CCA } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

const TIME_OPTIONS = Array.from({ length: 24 }).map((_, h) => {
   const ampm = h < 12 ? '?ㅼ쟾' : '?ㅽ썑';
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

   const formatBodySize = (val: string) => {
      if (!val) return '-';
      const heightMatch = String(val).match(/^([0-9.]+)/);
      if (heightMatch) {
         const ft = parseFloat(heightMatch[1]);
         const cm = Math.round(ft * 30.48);
         return `${heightMatch[1]}" (${cm}cm)${String(val).substring(heightMatch[0].length)}`;
      }
      return val;
   };

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

   // Menu Items Modal
   const [showMenuModal, setShowMenuModal] = useState(false);
   const [menuEditForm, setMenuEditForm] = useState<{ id?: number, name: string, price: string, category: string, image: string }>({ name: '', price: '', category: '', image: '' });
   const [selectedMenuIdx, setSelectedMenuIdx] = useState<number | null>(null);

   // Table/Room Modal
   const [showUnitModal, setShowUnitModal] = useState(false);
   const [unitType, setUnitType] = useState<'table' | 'room'>('table');
   const [unitEditForm, setUnitEditForm] = useState<{ id?: number, name: string, number: string, capacity: string, image: string }>({ name: '', number: '', capacity: '4', image: '' });
   const [selectedUnitIdx, setSelectedUnitIdx] = useState<number | null>(null);
 
   // Password Reset State
   const [newAdminPassword, setNewAdminPassword] = useState('');
   const [isResetting, setIsResetting] = useState(false);

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
      setSelectedItem(null);
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
            drinking: '',
            smoking: '',
            pets: '',
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
      // Region normalization for legacy data
      let normalizedRegion = item.region;
      if (item.region === 'MANILA') normalizedRegion = 'Manila';
      else if (item.region === 'CLARK' || item.region === 'CLARK/ANGELES') normalizedRegion = 'Clark/Angeles';
      else if (item.region === 'CEBU') normalizedRegion = 'Cebu';
      else if (item.region === 'ETC' || item.region === 'OTHERS') normalizedRegion = 'Others';

      const mappedItem = {
         ...item,
         region: normalizedRegion,
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
      setNewAdminPassword('');
      setShowDetailModal(true);
   };

   const handleResetAdminPassword = async () => {
      if (!newAdminPassword) {
         alert('鍮꾨?踰덊샇瑜??낅젰?댁＜?몄슂.');
         return;
      }
      if (!window.confirm(`?낆껜 愿由ъ옄??鍮꾨?踰덊샇瑜?"${newAdminPassword}"(??濡?媛뺤젣 蹂寃쏀븯?쒓쿋?듬땲源?`)) return;

      setIsResetting(true);
      try {
         const result = await apiService.resetVenueAdminPassword(editForm.id, newAdminPassword);
         if (result.success) {
            alert('鍮꾨?踰덊샇媛 ?깃났?곸쑝濡?蹂寃쎈릺?덉뒿?덈떎.');
            setNewAdminPassword('');
         } else {
            alert(`蹂寃??ㅽ뙣: ${result.error || '?????녿뒗 ?ㅻ쪟'}`);
         }
      } catch (err: any) {
         alert(`?ㅻ쪟 諛쒖깮: ${err.message}`);
      } finally {
         setIsResetting(false);
      }
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

            const venueId = isCreateMode ? undefined : (editForm.id || selectedItem?.id);
            if (!isCreateMode && !venueId) {
               alert("?섏젙 ???낆냼 ID媛 ?꾨씫?섏뿀?듬땲?? 李쎌쓣 ?リ퀬 ?ㅼ떆 ?쒕룄??二쇱꽭??");
               setIsSaving(false);
               return;
            }

            const result = isCreateMode
               ? await apiService.createVenue(updates)
               : await apiService.updateVenue(venueId as string, updates);

            if (result.success) {
               alert(`Venue ${isCreateMode ? 'registered' : 'updated'} successfully`);
               setShowDetailModal(false);
               loadData();
            } else {
               alert(`Failed to save venue details: ${result.error || 'Please check the connection.'}`);
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

            if (result.success) {
               alert(`CCA profile ${isCreateMode ? 'created' : 'synchronized'} successfully`);
               setShowDetailModal(false);
               loadData();
            } else {
               alert(`Failed to synchronize CCA master data: ${result.error || 'Please check the connection.'}`);
            }
         }
      } catch (err: any) {
         console.error("Save error", err);
         alert(`Operation failed: ${err.message}`);
      } finally {
         setIsSaving(false);
      }
   };

   const handleDelete = async (item: any) => {
      if (!window.confirm(`Are you sure you want to delete ${activeTab === 'venues' ? item.name : item.nickname || item.name}? All related history will be removed.`)) {
         return;
      }

      setLoading(true);
      try {
         const result = activeTab === 'venues'
            ? await apiService.deleteVenue(item.id)
            : await apiService.deleteCCA(item.id);

         if (result.success) {
            alert("Deleted successfully from the neural archives.");
            loadData();
         } else {
            alert(`Deletion failed: ${result.error || 'Please check the network bridge.'}`);
         }
      } catch (err: any) {
         console.error("Delete error", err);
         alert("A critical error occurred during the deletion sequence.");
      } finally {
         setLoading(false);
      }
   };

   const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         try {
            const url = await apiService.uploadImage(file);
            if (url) {
               setEditForm({ ...editForm, image: url });
            } else {
               alert("?대?吏 ?뺤텞 諛??낅줈?쒖뿉 ?ㅽ뙣?덉뒿?덈떎.");
            }
         } catch (err) {
            console.error("Image upload error", err);
            alert("?대?吏 泥섎━ 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.");
         }
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

   // Menu Handlers
   const handleAddMenu = () => {
      setSelectedMenuIdx(null);
      setMenuEditForm({
         name: '',
         price: '',
         category: editForm.tags?.[0] || '',
         image: ''
      });
      setShowMenuModal(true);
   };

   const handleEditMenu = (item: any, idx: number) => {
      setSelectedMenuIdx(idx);
      setMenuEditForm({ ...item });
      setShowMenuModal(true);
   };

   const handleSaveMenu = () => {
      if (!menuEditForm.name || !menuEditForm.price) {
         alert("Please enter both name and price.");
         return;
      }

      const newMenu = [...(editForm.menu || [])];
      const menuItem = {
         ...menuEditForm,
         id: menuEditForm.id || Date.now()
      };

      if (selectedMenuIdx !== null) {
         newMenu[selectedMenuIdx] = menuItem;
      } else {
         newMenu.push(menuItem);
      }

      setEditForm({ ...editForm, menu: newMenu });
      setShowMenuModal(false);
   };

   const handleFileUploadMenu = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
         try {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            const newMenuPaths: any[] = [];
            let currentTags = [...(editForm.tags || [])];

            data.forEach((row: any) => {
               // Assuming standard columns: Category, Name, Price, Promotion
               const category = row['Category'] || row['移댄뀒怨좊━'] || currentTags[0] || 'Uncategorized';
               const name = row['Name'] || row['硫붾돱紐?] || row['?대쫫'];
               const price = row['Price'] || row['媛寃?];
               const promotion = row['Promotion'] || row['?꾨줈紐⑥뀡'] || '';

               if (!name || price === undefined) return; // Skip invalid rows

               if (!currentTags.includes(category)) {
                  currentTags.push(category);
               }

               newMenuPaths.push({
                  id: Date.now() + Math.random(),
                  category,
                  name: String(name),
                  price: String(price),
                  promotion: String(promotion),
                  image: ''
               });
            });

            if (newMenuPaths.length > 0) {
               setEditForm((prev: any) => ({
                  ...prev,
                  tags: currentTags,
                  menu: [...(prev.menu || []), ...newMenuPaths]
               }));
               alert(`Successfully processed \${newMenuPaths.length} menu items.`);
            } else {
               alert("No valid menu items found in the file. Please check the template format.");
            }
         } catch (error) {
            console.error("Error parsing Excel/CSV file", error);
            alert("Failed to parse the file. Please make sure it's a valid Excel or CSV file.");
         }
      };
      reader.readAsBinaryString(file);
      e.target.value = ''; // Reset file input
   };

   const downloadMenuTemplate = () => {
      const ws = XLSX.utils.json_to_sheet([
         { Category: 'Main Dishes', Name: 'Sample Dish', Price: '1000', Promotion: '10% OFF' },
         { Category: 'Premium Drinks', Name: 'Hennessy XO', Price: '15000', Promotion: '' }
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "MenuTemplate");
      XLSX.writeFile(wb, "menu_template.xlsx");
   };

   // Unit (Table/Room) Handlers
   const handleAddUnit = (type: 'table' | 'room') => {
      setUnitType(type);
      setSelectedUnitIdx(null);
      setUnitEditForm({
         name: '',
         number: '',
         capacity: type === 'table' ? '4' : '10',
         image: ''
      });
      setShowUnitModal(true);
   };

   const handleEditUnit = (type: 'table' | 'room', item: any, idx: number) => {
      setUnitType(type);
      setSelectedUnitIdx(idx);
      setUnitEditForm({ ...item });
      setShowUnitModal(true);
   };

   const handleSaveUnit = () => {
      if (!unitEditForm.name || !unitEditForm.capacity) {
         alert("Please enter both name and capacity.");
         return;
      }

      const field = unitType === 'table' ? 'tables' : 'rooms';
      const currentList = [...(editForm[field] || [])];
      const unitItem = {
         ...unitEditForm,
         id: unitEditForm.id || Date.now()
      };

      if (selectedUnitIdx !== null) {
         currentList[selectedUnitIdx] = unitItem;
      } else {
         currentList.push(unitItem);
      }

      setEditForm({ ...editForm, [field]: currentList });
      setShowUnitModal(false);
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
                           {activeTab === 'ccas' && <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Info</th>}
                           <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Res.</th>
                           {activeTab === 'venues' && <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">CCAs</th>}
                           <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {(activeTab === 'venues' ? venues : ccas).map((item, index) => (
                           <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                              <td className="px-8 py-6 text-xs font-bold text-gray-500">{index + 1}</td>
                              <td className="px-8 py-6 text-xs font-black uppercase text-red-500">{item.region || (activeTab === 'ccas' ? 'UNASSIGNED' : 'MANILA')}</td>
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
                              {activeTab === 'ccas' && (
                                 <td className="px-8 py-6">
                                    <div className="flex flex-col gap-1">
                                       <span className="text-[10px] font-bold text-gray-400">{item.age || '-'}??/span>
                                       <span className="text-[10px] font-bold text-[#ffd700]">{formatBodySize(item.height)}</span>
                                    </div>
                                 </td>
                              )}
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
                                    <button onClick={() => handleDelete(item)} className="size-9 bg-zinc-800 text-gray-500 rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center border border-white/5">
                                       <span className="material-symbols-outlined text-sm">delete</span>
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
                                 <div className="space-y-12 animate-fade-in">
                                    {!isCreateMode && (
                                       <div className="bg-black/30 rounded-[2.5rem] p-8 border border-white/5 space-y-6">
                                          <div className="flex items-center justify-between">
                                             <h6 className="text-[10px] font-black text-red-500 uppercase tracking-widest border-l-2 border-red-500 pl-4">Admin Security Portal</h6>
                                             <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-gray-400">
                                                <span className="material-symbols-outlined text-sm">alternate_email</span>
                                                {editForm.admin_email || 'No admin connected'}
                                             </div>
                                          </div>
                                          <div className="flex flex-col md:flex-row gap-4">
                                             <div className="flex-1">
                                                <input 
                                                   type="text" 
                                                   value={newAdminPassword} 
                                                   onChange={e => setNewAdminPassword(e.target.value)} 
                                                   placeholder="Set New Emergency Password..." 
                                                   className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-sm" 
                                                />
                                             </div>
                                             <button 
                                                onClick={handleResetAdminPassword}
                                                disabled={isResetting}
                                                className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-red-600/20 disabled:opacity-50"
                                             >
                                                {isResetting ? 'Verifying...' : 'Force Reset Account'}
                                             </button>
                                          </div>
                                       </div>
                                    )}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                    <div className="lg:col-span-2 space-y-10">
                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                          <div className="space-y-4">
                                             <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">Venue Name</label>
                                             <input type="text" value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white font-black" placeholder="?낆껜紐낆쓣 ?낅젰?섏꽭??.." />
                                          </div>
                                          <div className="space-y-4">
                                             <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">Region</label>
                                             <select value={editForm.region || 'Manila'} onChange={e => setEditForm({ ...editForm, region: e.target.value })} className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-6 py-5 text-white font-black">
                                                <option value="Manila">Manila</option>
                                                <option value="Clark/Angeles">Clark/Angeles</option>
                                                <option value="Cebu">Cebu</option>
                                                <option value="Others">Others</option>
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
                                                <input type="file" className="hidden" accept="image/*" onChange={async e => {
                                                   const file = e.target.files?.[0];
                                                   if (file) {
                                                      const url = await apiService.uploadImage(file);
                                                      if (url) setEditForm({ ...editForm, image: url });
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
                                                <input type="file" className="hidden" accept="image/*" onChange={async e => {
                                                   const file = e.target.files?.[0];
                                                   if (file) {
                                                      const url = await apiService.uploadImage(file);
                                                      if (url) setEditForm({ ...editForm, banner_image: url });
                                                   }
                                                }} />
                                             </label>
                                          </div>
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
                                          <input type="file" multiple className="hidden" accept="image/*" onChange={async e => {
                                             const files = Array.from(e.target.files || []);
                                             for (const f of files) {
                                                const url = await apiService.uploadImage(f);
                                                if (url) {
                                                   setEditForm((prev: any) => ({
                                                      ...prev,
                                                      media: [...(prev.media || []), { id: Date.now() + Math.random(), type: 'image', url, isExposed: true }]
                                                   }));
                                                }
                                             }
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
                                 </div>
                              )}

                              {/* Tab Content: MENU */}
                              {venueActiveTab === 'menu' && (
                                 <div className="space-y-12 animate-fade-in">
                                    <div className="bg-black/40 rounded-[2.5rem] p-10 border border-white/10 space-y-8">
                                       <div className="flex items-center justify-between">
                                          <h6 className="text-xs font-black uppercase tracking-widest">Menu Categories</h6>
                                          <div className="flex gap-4">
                                             <button onClick={downloadMenuTemplate} className="text-gray-400 hover:text-white font-black text-[10px] uppercase underline flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[12px]">download</span> Template
                                             </button>
                                             <label className="text-red-500 hover:text-red-400 font-black text-[10px] uppercase underline cursor-pointer flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[12px]">upload_file</span> CSV/Excel Upload
                                                <input type="file" className="hidden" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleFileUploadMenu} />
                                             </label>
                                             <button onClick={() => {
                                                const cat = prompt("Enter new category name:");
                                                if (cat) setEditForm({ ...editForm, tags: [...(editForm.tags || []), cat] });
                                             }} className="text-red-500 font-black text-[10px] uppercase underline">+ Add Category</button>
                                          </div>
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
                                          <div key={idx} className="bg-black/40 p-6 rounded-[2rem] border border-white/5 flex gap-6 items-center group relative overflow-hidden">
                                             <div className="size-24 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 flex-shrink-0">
                                                {m.image ? (
                                                   <img src={m.image} className="size-full object-cover" />
                                                ) : (
                                                   <div className="size-full flex items-center justify-center text-gray-700">
                                                      <span className="material-symbols-outlined text-3xl">restaurant</span>
                                                   </div>
                                                )}
                                             </div>
                                             <div className="flex-1">
                                                <h5 className="font-black text-sm uppercase italic text-white">{m.name}</h5>
                                                <p className="text-red-500 font-black text-xs mt-1">PHP {m.price}</p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1 px-2 py-0.5 bg-white/5 rounded-full w-fit border border-white/5">{m.category}</p>
                                             </div>
                                             <div className="flex flex-col gap-2">
                                                <button onClick={() => handleEditMenu(m, idx)} className="opacity-0 group-hover:opacity-100 transition-opacity size-9 bg-white/5 hover:bg-zinc-100 hover:text-black rounded-xl flex items-center justify-center border border-white/10">
                                                   <span className="material-symbols-outlined text-sm">edit</span>
                                                </button>
                                                <button onClick={() => setEditForm({ ...editForm, menu: editForm.menu.filter((_: any, i: number) => i !== idx) })} className="opacity-0 group-hover:opacity-100 transition-opacity size-9 bg-white/5 hover:bg-red-600 hover:text-white rounded-xl flex items-center justify-center border border-white/10">
                                                   <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                             </div>
                                          </div>
                                       ))}
                                       <button onClick={handleAddMenu} className="rounded-[2.5rem] border-2 border-dashed border-white/10 hover:border-red-600/50 transition-all flex flex-col items-center justify-center p-10 gap-3 grayscale hover:grayscale-0 bg-black/20 group">
                                          <div className="size-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-red-600/10 transition-all">
                                             <span className="material-symbols-outlined text-3xl text-gray-500 group-hover:text-red-500">restaurant_menu</span>
                                          </div>
                                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white">Append New Neural Delicacy</span>
                                       </button>
                                       </div>
                                    </div>
                                 </div>
                              )}

                              {/* Tab Content: TABLES & ROOMS */}
                              {venueActiveTab === 'tables_rooms' && (
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-fade-in">
                                    <div className="space-y-8">
                                       <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                          <h6 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Deployment Tables</h6>
                                          <button onClick={() => handleAddUnit('table')} className="text-[10px] font-black underline uppercase tracking-widest text-gray-500 hover:text-white">+ Deploy Unit</button>
                                       </div>
                                       <div className="grid grid-cols-1 gap-4">
                                          {(editForm.tables || []).map((t: any, idx: number) => (
                                             <div key={idx} className="bg-black/40 p-6 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-red-500/30 transition-all">
                                                <div className="flex items-center gap-4">
                                                   <div className="size-12 rounded-xl bg-white/5 flex items-center justify-center">
                                                      <span className="material-symbols-outlined text-gray-500">table_bar</span>
                                                   </div>
                                                   <div>
                                                      <span className="text-xs font-black uppercase italic block">{t.name}</span>
                                                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1 block">Capacity: {t.capacity}</span>
                                                   </div>
                                                </div>
                                                <div className="flex gap-2">
                                                   <button onClick={() => handleEditUnit('table', t, idx)} className="size-9 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-zinc-100 hover:text-black border border-white/5"><span className="material-symbols-outlined text-sm">edit</span></button>
                                                   <button onClick={() => setEditForm({ ...editForm, tables: editForm.tables.filter((_: any, i: number) => i !== idx) })} className="size-9 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-red-600 border border-white/5"><span className="material-symbols-outlined text-sm">delete</span></button>
                                                </div>
                                             </div>
                                          ))}
                                          {(!editForm.tables || editForm.tables.length === 0) && (
                                             <div className="py-12 border border-dashed border-white/5 rounded-3xl text-center">
                                                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">No tables deployed</p>
                                             </div>
                                          )}
                                       </div>
                                    </div>
                                    <div className="space-y-8">
                                       <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                          <h6 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Private VIP Rooms</h6>
                                          <button onClick={() => handleAddUnit('room')} className="text-[10px] font-black underline uppercase tracking-widest text-gray-500 hover:text-white">+ Sync Node</button>
                                       </div>
                                       <div className="grid grid-cols-1 gap-4">
                                          {(editForm.rooms || []).map((r: any, idx: number) => (
                                             <div key={idx} className="bg-black/40 p-6 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-white/20 transition-all">
                                                <div className="flex items-center gap-4">
                                                   <div className="size-12 rounded-xl bg-white/5 flex items-center justify-center">
                                                      <span className="material-symbols-outlined text-gray-500">meeting_room</span>
                                                   </div>
                                                   <div>
                                                      <span className="text-xs font-black uppercase italic block">{r.name}</span>
                                                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1 block">Capacity: {r.capacity}</span>
                                                   </div>
                                                </div>
                                                <div className="flex gap-2">
                                                   <button onClick={() => handleEditUnit('room', r, idx)} className="size-9 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-zinc-100 hover:text-black border border-white/5"><span className="material-symbols-outlined text-sm">edit</span></button>
                                                   <button onClick={() => setEditForm({ ...editForm, rooms: editForm.rooms.filter((_: any, i: number) => i !== idx) })} className="size-9 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-red-600 border border-white/5"><span className="material-symbols-outlined text-sm">delete</span></button>
                                                </div>
                                             </div>
                                          ))}
                                          {(!editForm.rooms || editForm.rooms.length === 0) && (
                                             <div className="py-12 border border-dashed border-white/5 rounded-3xl text-center">
                                                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">No private units detected</p>
                                             </div>
                                          )}
                                       </div>
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
                                    <input type="text" placeholder="?? ENFP" value={editForm.mbti || ''} onChange={e => setEditForm({ ...editForm, mbti: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-600" />
                                 </div>

                                 <div className="space-y-3">
                                    <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">Quick Bio</label>
                                    <textarea value={editForm.oneLineStory || ''} onChange={e => setEditForm({ ...editForm, oneLineStory: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-600 h-32 resize-none" placeholder="?먭린?뚭컻瑜??낅젰??二쇱꽭??.." />
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
                                       <input type="text" value={editForm.birthday || ''} onChange={e => setEditForm({ ...editForm, birthday: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold" placeholder="?? 23. Jan. 2000." />
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
                                       <label className="text-[10px] font-black text-gray-500 uppercase ml-2 mb-4 block">Specialties (?뱀쭠/?밴린)</label>
                                       <div className="flex flex-wrap gap-2">
                                          {['DANCE', 'SINGING', 'COOKING', 'GAMING', 'SPORTS', 'MUSIC', 'ART', 'TRAVEL'].map(s => (
                                             <button key={s} onClick={() => toggleSpec(s)} className={`px-4 py-2.5 rounded-xl text-[9px] font-black tracking-widest transition-all ${editForm.specialties?.includes(s) ? 'bg-red-600 text-white shadow-lg' : 'bg-white/5 text-gray-500 border border-white/5'}`}>{s}</button>
                                          ))}
                                       </div>
                                    </div>
                                    <div>
                                       <label className="text-[10px] font-black text-gray-500 uppercase ml-2 mb-4 block">Available Languages (媛???몄뼱)</label>
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

         {/* MENU ITEM MODAL */}
         <AnimatePresence>
            {showMenuModal && (
               <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMenuModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-zinc-950 border border-white/10 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl z-10 flex flex-col" >
                     <div className="p-8 border-b border-white/5 flex items-center justify-between">
                        <h4 className="text-lg font-black uppercase italic tracking-widest text-white">{selectedMenuIdx !== null ? 'Edit' : 'Add'} Menu Item</h4>
                        <button onClick={() => setShowMenuModal(false)} className="size-10 rounded-xl bg-white/5 text-white flex items-center justify-center hover:bg-red-600 transition-all"><span className="material-symbols-outlined text-sm">close</span></button>
                     </div>
                     <div className="p-8 space-y-6">
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">Dish Image</label>
                           <div className="relative group aspect-video rounded-3xl border-2 border-dashed border-white/10 overflow-hidden bg-black/40 flex items-center justify-center">
                              {menuEditForm.image ? (
                                 <img src={menuEditForm.image} className="size-full object-cover" />
                              ) : (
                                 <span className="material-symbols-outlined text-4xl text-gray-700">restaurant</span>
                              )}
                              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                 <span className="text-[10px] font-black uppercase tracking-widest bg-white text-black px-6 py-3 rounded-2xl">Upload Photo</span>
                                 <input type="file" className="hidden" accept="image/*" onChange={async e => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                       const url = await apiService.uploadImage(file);
                                       if (url) setMenuEditForm({ ...menuEditForm, image: url });
                                    }
                                 }} />
                              </label>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Dish Name</label>
                              <input type="text" value={menuEditForm.name} onChange={e => setMenuEditForm({ ...menuEditForm, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold" placeholder="Enter dish name..." />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Price (PHP)</label>
                                 <input type="text" value={menuEditForm.price} onChange={e => setMenuEditForm({ ...menuEditForm, price: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold" placeholder="5000" />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Category</label>
                                 <select value={menuEditForm.category} onChange={e => setMenuEditForm({ ...menuEditForm, category: e.target.value })} className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold appearance-none">
                                    {(editForm.tags || []).map((cat: string) => (
                                       <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                 </select>
                              </div>
                           </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                           <button onClick={() => setShowMenuModal(false)} className="flex-1 py-4 border border-white/10 text-gray-400 rounded-2xl font-black uppercase text-[10px] hover:bg-white/5 transition-all">Cancel</button>
                           <button onClick={handleSaveMenu} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-red-600/20 hover:scale-[1.02] transition-all">Confirm Menu</button>
                        </div>
                     </div>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>
         {/* UNIT MODAL (Table/Room) */}
         <AnimatePresence>
            {showUnitModal && (
               <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowUnitModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-zinc-950 border border-white/10 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl z-10 flex flex-col" >
                     <div className="p-8 border-b border-white/5 flex items-center justify-between">
                        <h4 className="text-lg font-black uppercase italic tracking-widest text-white">{selectedUnitIdx !== null ? 'Configure' : 'Deploy'} {unitType === 'table' ? 'Unit' : 'Private Node'}</h4>
                        <button onClick={() => setShowUnitModal(false)} className="size-10 rounded-xl bg-white/5 text-white flex items-center justify-center hover:bg-red-600 transition-all"><span className="material-symbols-outlined text-sm">close</span></button>
                     </div>
                     <div className="p-8 space-y-6">
                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase ml-1">{unitType === 'table' ? 'Display Name' : 'Node Designation'}</label>
                              <input type="text" value={unitEditForm.name} onChange={e => setUnitEditForm({ ...unitEditForm, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold" placeholder={unitType === 'table' ? "e.g., Lounge 01" : "e.g., VIP Platinum"} />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Capacity</label>
                                 <input type="number" value={unitEditForm.capacity} onChange={e => setUnitEditForm({ ...unitEditForm, capacity: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold" placeholder="4" />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-gray-500 uppercase ml-1">ID (Optional)</label>
                                 <input type="text" value={unitEditForm.number} onChange={e => setUnitEditForm({ ...unitEditForm, number: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold" placeholder="Unit ID" />
                              </div>
                           </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                           <button onClick={() => setShowUnitModal(false)} className="flex-1 py-4 border border-white/10 text-gray-400 rounded-2xl font-black uppercase text-[10px] hover:bg-white/5 transition-all">Cancel</button>
                           <button onClick={handleSaveUnit} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-red-600/20 hover:scale-[1.02] transition-all">Establish Protocol</button>
                        </div>
                     </div>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>
      </div>
   );
};

export default SuperPartners;

