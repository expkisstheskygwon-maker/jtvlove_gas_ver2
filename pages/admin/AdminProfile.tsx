import React, { useState, useRef, useEffect } from 'react';
import { VENUES } from '../../constants';
import { apiService } from '../../services/apiService';

interface MediaItem {
   id: string;
   type: 'image' | 'video';
   url: string;
   isExposed: boolean;
   selected: boolean;
}

interface MenuItem {
   id: string;
   category: string;
   name: string;
   price: string;
   promotion: string;
   image: string;
   isEvent: boolean;
   eventPrice?: string;
   eventDescription?: string;
}

interface TableRoomItem {
   id: string;
   image: string;
   name: string;
   number: string;
   capacity: string;
   extraPrice: string;
   remarks: string;
}

const AdminProfile: React.FC = () => {
   const [isLoading, setIsLoading] = useState(true);
   const [activeTab, setActiveTab] = useState('basic');
   const [isSaving, setIsSaving] = useState(false);
   const venueId = 'v1';

   // --- State for Basic Settings ---
   const [basicInfo, setBasicInfo] = useState({
      name: '',
      region: 'MANILA',
      phone: '',
      openTime: '',
      closeTime: '',
      address: '',
      introduction: '',
      sns: {
         telegram: '',
         facebook: '',
         kakao: '',
         band: '',
         instagram: '',
         discord: ''
      },
      logo: '',
      banner: ''
   });

   const [initialBasicInfo, setInitialBasicInfo] = useState<any>(null);
   const [initialMediaItems, setInitialMediaItems] = useState<any>(null);
   const [initialCategories, setInitialCategories] = useState<any>(null);
   const [initialMenuItems, setInitialMenuItems] = useState<any>(null);
   const [initialTables, setInitialTables] = useState<any>(null);
   const [initialRooms, setInitialRooms] = useState<any>(null);

   // --- State for Media Settings ---
   const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
   const [videoUrl, setVideoUrl] = useState('');

   // --- State for Menu Settings ---
   const [categories, setCategories] = useState(['Main Dishes', 'Set Menu', 'Premium Drinks', 'Side Dishes']);
   const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
   const [newMenuItem, setNewMenuItem] = useState<Partial<MenuItem>>({
      category: 'Premium Drinks',
      isEvent: false
   });

   // --- State for Tables & Rooms ---
   const [tables, setTables] = useState<TableRoomItem[]>([]);
   const [rooms, setRooms] = useState<TableRoomItem[]>([]);
   const [newTable, setNewTable] = useState<Partial<TableRoomItem>>({ image: '' });
   const [newRoom, setNewRoom] = useState<Partial<TableRoomItem>>({ image: '' });
   const [showMediaPicker, setShowMediaPicker] = useState<{ active: boolean; type: 'table' | 'room' }>({ active: false, type: 'table' });

   useEffect(() => {
      fetchVenueData();
   }, []);

   const fetchVenueData = async () => {
      setIsLoading(true);
      const data = await apiService.getVenueById(venueId);
      if (data) {
         const basic = {
            name: data.name || '',
            region: data.region || 'MANILA',
            phone: data.phone || '',
            openTime: data.operating_hours?.open || '',
            closeTime: data.operating_hours?.close || '',
            address: data.address || '',
            introduction: data.introduction || '',
            sns: {
               telegram: data.sns?.telegram || '',
               facebook: data.sns?.facebook || '',
               kakao: data.sns?.kakao || '',
               band: data.sns?.band || '',
               instagram: data.sns?.instagram || '',
               discord: data.sns?.discord || ''
            },
            logo: data.image || '',
            banner: data.banner_image || ''
         };
         setBasicInfo(basic);
         setInitialBasicInfo(JSON.parse(JSON.stringify(basic)));

         setMediaItems(data.media || []);
         setInitialMediaItems(JSON.parse(JSON.stringify(data.media || [])));

         const cats = data.tags || ['Main Dishes', 'Set Menu', 'Premium Drinks', 'Side Dishes'];
         setCategories(cats);
         setInitialCategories(JSON.parse(JSON.stringify(cats)));

         setMenuItems(data.menu || []);
         setInitialMenuItems(JSON.parse(JSON.stringify(data.menu || [])));

         setTables(data.tables || []);
         setInitialTables(JSON.parse(JSON.stringify(data.tables || [])));

         setRooms(data.rooms || []);
         setInitialRooms(JSON.parse(JSON.stringify(data.rooms || [])));
      }
      setIsLoading(false);
   };

   const handleSave = async () => {
      setIsSaving(true);
      try {
         const updates = {
            name: basicInfo.name,
            phone: basicInfo.phone,
            address: basicInfo.address,
            introduction: basicInfo.introduction,
            image: basicInfo.logo,
            banner_image: basicInfo.banner,
            sns: basicInfo.sns,
            operating_hours: { open: basicInfo.openTime, close: basicInfo.closeTime },
            media: mediaItems.map(({ selected, ...rest }) => rest),
            tags: categories,
            menu: menuItems,
            region: basicInfo.region,
            tables: tables,
            rooms: rooms
         };

         const success = await apiService.updateVenue(venueId, updates);
         if (success) {
            // Update initial states to match current state
            setInitialBasicInfo(JSON.parse(JSON.stringify(basicInfo)));
            setInitialMediaItems(JSON.parse(JSON.stringify(mediaItems)));
            setInitialCategories(JSON.parse(JSON.stringify(categories)));
            setInitialMenuItems(JSON.parse(JSON.stringify(menuItems)));
            setInitialTables(JSON.parse(JSON.stringify(tables)));
            setInitialRooms(JSON.parse(JSON.stringify(rooms)));
            alert('Settings saved successfully!');
         } else {
            alert('Failed to save settings.');
         }
      } catch (err) {
         console.error('Save error:', err);
         alert('Error saving settings.');
      } finally {
         setIsSaving(false);
      }
   };


   // --- Helpers ---
   const handleImageToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
         const reader = new FileReader();
         reader.onload = () => resolve(reader.result as string);
         reader.onerror = error => reject(error);
         reader.readAsDataURL(file);
      });
   };

   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner' | 'media' | 'menu' | 'table' | 'room') => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
         const base64 = await handleImageToBase64(file);
         if (type === 'logo') setBasicInfo({ ...basicInfo, logo: base64 });
         if (type === 'banner') setBasicInfo({ ...basicInfo, banner: base64 });
         if (type === 'media') {
            const newItem: MediaItem = {
               id: Date.now().toString(),
               type: 'image',
               url: base64,
               isExposed: true,
               selected: false
            };
            setMediaItems([...mediaItems, newItem]);
         }
         if (type === 'menu') {
            setNewMenuItem({ ...newMenuItem, image: base64 });
         }
         if (type === 'table') {
            setNewTable({ ...newTable, image: base64 });
         }
         if (type === 'room') {
            setNewRoom({ ...newRoom, image: base64 });
         }
      } catch (err) {
         console.error('File upload failed', err);
      }
      e.target.value = ''; // Reset input
   };

   const addVideo = () => {
      if (!videoUrl) return;
      const newItem: MediaItem = {
         id: Date.now().toString(),
         type: 'video',
         url: videoUrl,
         isExposed: true,
         selected: false
      };
      setMediaItems([...mediaItems, newItem]);
      setVideoUrl('');
   };

   const toggleMediaExpose = (id: string) => {
      setMediaItems(mediaItems.map(m => m.id === id ? { ...m, isExposed: !m.isExposed } : m));
   };

   const toggleMediaSelect = (id: string) => {
      setMediaItems(mediaItems.map(m => m.id === id ? { ...m, selected: !m.selected } : m));
   };

   const selectAllMedia = () => {
      const allSelected = mediaItems.every(m => m.selected);
      setMediaItems(mediaItems.map(m => ({ ...m, selected: !allSelected })));
   };

   const deleteSelectedMedia = () => {
      setMediaItems(mediaItems.filter(m => !m.selected));
   };

   const addMenuItem = () => {
      if (!newMenuItem.name || !newMenuItem.price) return;
      const item: MenuItem = {
         id: Date.now().toString(),
         category: newMenuItem.category || categories[0],
         name: newMenuItem.name || '',
         price: newMenuItem.price || '',
         promotion: newMenuItem.promotion || '',
         image: newMenuItem.image || '',
         isEvent: newMenuItem.isEvent || false,
         eventPrice: newMenuItem.eventPrice,
         eventDescription: newMenuItem.eventDescription
      };
      setMenuItems([...menuItems, item]);
      setNewMenuItem({ category: categories[0], isEvent: false });
   };

   const addTable = () => {
      if (!newTable.name || !newTable.number) return;
      const item: TableRoomItem = {
         id: Date.now().toString(),
         image: newTable.image || '',
         name: newTable.name || '',
         number: newTable.number || '',
         capacity: newTable.capacity || '',
         extraPrice: newTable.extraPrice || '',
         remarks: newTable.remarks || ''
      };
      setTables([...tables, item]);
      setNewTable({ name: '', number: '', capacity: '', extraPrice: '', remarks: '', image: '' });
   };

   const addRoom = () => {
      if (!newRoom.name || !newRoom.number) return;
      const item: TableRoomItem = {
         id: Date.now().toString(),
         image: newRoom.image || '',
         name: newRoom.name || '',
         number: newRoom.number || '',
         capacity: newRoom.capacity || '',
         extraPrice: newRoom.extraPrice || '',
         remarks: newRoom.remarks || ''
      };
      setRooms([...rooms, item]);
      setNewRoom({ name: '', number: '', capacity: '', extraPrice: '', remarks: '', image: '' });
   };

   const deleteTable = (id: string) => setTables(tables.filter(t => t.id !== id));
   const deleteRoom = (id: string) => setRooms(rooms.filter(r => r.id !== id));

   const handleMediaSelectForTableRoom = (url: string) => {
      if (showMediaPicker.type === 'table') {
         setNewTable({ ...newTable, image: url });
      } else {
         setNewRoom({ ...newRoom, image: url });
      }
      setShowMediaPicker({ active: false, type: 'table' });
   };

   // Check if any state has changed from initial
   const hasChanges = !!initialBasicInfo && (
      JSON.stringify(basicInfo) !== JSON.stringify(initialBasicInfo) ||
      JSON.stringify(mediaItems.map(({ selected, ...rest }: any) => rest)) !== JSON.stringify(initialMediaItems?.map(({ selected, ...rest }: any) => rest)) ||
      JSON.stringify(categories) !== JSON.stringify(initialCategories) ||
      JSON.stringify(menuItems) !== JSON.stringify(initialMenuItems) ||
      JSON.stringify(tables) !== JSON.stringify(initialTables) ||
      JSON.stringify(rooms) !== JSON.stringify(initialRooms)
   );


   if (isLoading) {
      return (
         <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
         </div>
      );
   }

   return (
      <div className="max-w-6xl space-y-8 pb-20">
         {/* Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
               <h1 className="text-3xl font-black tracking-tight text-[#1b180d] dark:text-white uppercase italic">Venue Settings</h1>
               <p className="text-sm font-bold text-gray-500 mt-1">Manage your store's information, media, and menu</p>
            </div>
            <button
               onClick={handleSave}
               disabled={!hasChanges || isSaving}
               className={`w-full md:w-auto px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all ${hasChanges && !isSaving
                  ? 'bg-primary text-[#1b180d] shadow-primary/20 hover:scale-[1.05]'
                  : 'bg-gray-300 dark:bg-zinc-700 text-gray-500 cursor-not-allowed'
                  }`}
            >
               {isSaving ? 'Saving...' : 'Save All Changes'}
            </button>
         </div>

         {/* Tab Switcher */}
         <div className="flex flex-wrap md:flex-nowrap gap-2 md:gap-4 p-1 bg-white dark:bg-zinc-900 rounded-2xl border border-primary/10 w-full md:w-fit">
            {['basic', 'media', 'menu', 'tables_rooms'].map(t => (
               <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`flex-1 md:flex-none py-3 px-4 md:px-8 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all whitespace-nowrap ${activeTab === t ? 'bg-primary text-[#1b180d]' : 'text-gray-400 hover:text-primary/50'}`}
               >
                  {t.replace('_', ' & ')} Settings
               </button>
            ))}
         </div>

         {/* --- Tab Content: BASIC --- */}
         {activeTab === 'basic' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
               <div className="lg:col-span-2 space-y-8">
                  {/* General Info */}
                  <section className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-primary/10 shadow-sm space-y-6">
                     <h3 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">info</span> General Info
                     </h3>

                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Venue Region</label>
                        <div className="flex flex-wrap gap-3">
                           {[
                              { id: 'MANILA', label: 'MANILA', icon: 'location_city' },
                              { id: 'CLARK', label: 'CLARK/ANGELES', icon: 'flight_takeoff' },
                              { id: 'CEBU', label: 'CEBU', icon: 'beach_access' },
                              { id: 'ETC', label: 'ETC', icon: 'more_horiz' }
                           ].map(reg => (
                              <button
                                 key={reg.id}
                                 type="button"
                                 onClick={() => setBasicInfo({ ...basicInfo, region: reg.id })}
                                 className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-xs border transition-all ${basicInfo.region === reg.id
                                    ? 'bg-primary border-primary text-[#1b180d]'
                                    : 'bg-gray-50 dark:bg-zinc-950 border-transparent text-gray-400 hover:border-primary/30'
                                    }`}
                              >
                                 <span className="material-symbols-outlined text-sm">{reg.icon}</span>
                                 {reg.label}
                              </button>
                           ))}
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Venue Name</label>
                           <input
                              type="text"
                              value={basicInfo.name}
                              onChange={e => setBasicInfo({ ...basicInfo, name: e.target.value })}
                              className="bg-gray-50 dark:bg-zinc-950 border-none rounded-xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-primary/20"
                           />
                        </div>
                        <div className="flex flex-col gap-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Main Phone</label>
                           <input
                              type="text"
                              value={basicInfo.phone}
                              onChange={e => setBasicInfo({ ...basicInfo, phone: e.target.value })}
                              className="bg-gray-50 dark:bg-zinc-950 border-none rounded-xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-primary/20"
                           />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Open Time</label>
                           <input
                              type="time"
                              value={basicInfo.openTime}
                              onChange={e => setBasicInfo({ ...basicInfo, openTime: e.target.value })}
                              className="bg-gray-50 dark:bg-zinc-950 border-none rounded-xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-primary/20"
                           />
                        </div>
                        <div className="flex flex-col gap-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Close Time</label>
                           <input
                              type="time"
                              value={basicInfo.closeTime}
                              onChange={e => setBasicInfo({ ...basicInfo, closeTime: e.target.value })}
                              className="bg-gray-50 dark:bg-zinc-950 border-none rounded-xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-primary/20"
                           />
                        </div>
                     </div>
                     <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Address</label>
                        <textarea
                           rows={2}
                           value={basicInfo.address}
                           onChange={e => setBasicInfo({ ...basicInfo, address: e.target.value })}
                           className="bg-gray-50 dark:bg-zinc-950 border-none rounded-xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-primary/20"
                        />
                     </div>
                     <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Shop Introduction (Max 300 chars)</label>
                        <textarea
                           rows={4}
                           maxLength={300}
                           value={basicInfo.introduction}
                           onChange={e => setBasicInfo({ ...basicInfo, introduction: e.target.value })}
                           placeholder="Tell us about your venue..."
                           className="bg-gray-50 dark:bg-zinc-950 border-none rounded-xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-primary/20"
                        />
                        <div className="text-right text-[10px] font-bold text-gray-400">{basicInfo.introduction.length} / 300</div>
                     </div>
                  </section>

                  {/* SNS Links */}
                  <section className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-primary/10 shadow-sm space-y-6">
                     <h3 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">link</span> Social & SNS Links
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(['Telegram', 'Facebook', 'Kakaotalk', 'BAND', 'Instagram', 'Discord'] as const).map(sns => (
                           <div key={sns} className="flex flex-col gap-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{sns}</label>
                              <input
                                 type="text"
                                 placeholder={`${sns} ID or Link`}
                                 value={basicInfo.sns[sns.toLowerCase() as keyof typeof basicInfo.sns]}
                                 onChange={e => setBasicInfo({
                                    ...basicInfo,
                                    sns: { ...basicInfo.sns, [sns.toLowerCase()]: e.target.value }
                                 })}
                                 className="bg-gray-50 dark:bg-zinc-950 border-none rounded-xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-primary/20"
                              />
                           </div>
                        ))}
                     </div>
                  </section>
               </div>

               <div className="space-y-8">
                  {/* Logo & Banner Section */}
                  <section className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-primary/10 shadow-sm space-y-6">
                     <h3 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">brush</span> Visual Assets
                     </h3>

                     <div className="space-y-4 text-center">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block text-left">Logo Image</label>
                        <div className="relative group mx-auto w-32 h-32 rounded-2xl border-2 border-dashed border-primary/20 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-zinc-950">
                           {basicInfo.logo ? (
                              <img src={basicInfo.logo} className="w-full h-full object-cover" alt="Logo" />
                           ) : (
                              <span className="material-symbols-outlined text-gray-300 text-3xl">add_photo_alternate</span>
                           )}
                           <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                              <span className="text-[10px] font-black text-white uppercase tracking-tighter">Change Logo</span>
                              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileUpload(e, 'logo')} accept="image/*" />
                           </div>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Promotion Banner (Horizontal)</label>
                        <div className="relative group h-32 rounded-2xl border-2 border-dashed border-primary/20 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-zinc-950">
                           {basicInfo.banner ? (
                              <img src={basicInfo.banner} className="w-full h-full object-cover" alt="Banner" />
                           ) : (
                              <div className="text-center space-y-1">
                                 <span className="material-symbols-outlined text-gray-300 text-3xl">add_photo_alternate</span>
                                 <p className="text-[10px] font-bold text-gray-400 uppercase">Upload Banner</p>
                              </div>
                           )}
                           <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                              <span className="text-[10px] font-black text-white uppercase tracking-tighter">Change Banner</span>
                              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileUpload(e, 'banner')} accept="image/*" />
                           </div>
                        </div>
                     </div>
                  </section>
               </div>
            </div>
         )}

         {/* --- Tab Content: MEDIA --- */}
         {activeTab === 'media' && (
            <div className="space-y-8 animate-fade-in">
               {/* Controls */}
               <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-primary/10 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex gap-4">
                     <button
                        onClick={selectAllMedia}
                        className="px-6 py-3 rounded-xl border border-primary/20 font-black text-[10px] uppercase tracking-widest hover:bg-primary/5 transition-all"
                     >
                        {mediaItems.every(m => m.selected) ? 'Unselect All' : 'Select All'}
                     </button>
                     <button
                        onClick={deleteSelectedMedia}
                        disabled={!mediaItems.some(m => m.selected)}
                        className="px-6 py-3 rounded-xl bg-red-500/10 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        Delete Selected
                     </button>
                  </div>
                  <div className="flex flex-1 max-w-md gap-2">
                     <input
                        type="text"
                        placeholder="External Video Link (YouTube/Vimeo)"
                        value={videoUrl}
                        onChange={e => setVideoUrl(e.target.value)}
                        className="flex-1 bg-gray-50 dark:bg-zinc-950 border-none rounded-xl px-4 py-3 font-bold text-xs"
                     />
                     <button onClick={addVideo} className="bg-[#1b180d] text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest">Add Video</button>
                  </div>
                  <div className="relative">
                     <button className="bg-primary text-[#1b180d] px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">upload</span> Upload Images
                        <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => {
                           const files = Array.from(e.target.files || []);
                           files.forEach(async f => {
                              const base64 = await handleImageToBase64(f);
                              setMediaItems(prev => [...prev, {
                                 id: Date.now().toString() + Math.random(),
                                 type: 'image',
                                 url: base64,
                                 isExposed: true,
                                 selected: false
                              }]);
                           });
                           e.target.value = '';
                        }} accept="image/*" />
                     </button>
                  </div>
               </div>

               {/* Media Grid */}
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {mediaItems.map(item => (
                     <div key={item.id} className={`group relative aspect-square rounded-3xl overflow-hidden border-4 transition-all ${item.selected ? 'border-primary shadow-lg scale-95' : 'border-transparent'}`}>
                        {item.type === 'image' ? (
                           <img src={item.url} className="w-full h-full object-cover" alt="Gallery" />
                        ) : (
                           <div className="w-full h-full bg-zinc-800 flex flex-col items-center justify-center gap-2 p-4 text-center">
                              <span className="material-symbols-outlined text-primary text-4xl">play_circle</span>
                              <span className="text-[10px] font-bold text-white truncate max-w-full italic">{item.url}</span>
                           </div>
                        )}

                        {/* Overlay Controls */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                           <button onClick={() => toggleMediaExpose(item.id)} className={`px-4 py-2 rounded-full font-black text-[9px] uppercase tracking-widest transition-all ${item.isExposed ? 'bg-green-500 text-white' : 'bg-white/20 text-white hover:bg-white/40'}`}>
                              {item.isExposed ? 'Exposed' : 'Hidden'}
                           </button>
                           <button onClick={() => toggleMediaSelect(item.id)} className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center">
                              <span className="material-symbols-outlined text-sm">{item.selected ? 'check_box' : 'check_box_outline_blank'}</span>
                           </button>
                        </div>

                        {!item.isExposed && (
                           <div className="absolute top-2 right-2 bg-red-500 rounded-lg p-1">
                              <span className="material-symbols-outlined text-xs text-white">visibility_off</span>
                           </div>
                        )}
                     </div>
                  ))}
                  {mediaItems.length === 0 && (
                     <div className="col-span-full py-20 text-center space-y-4 opacity-50">
                        <span className="material-symbols-outlined text-5xl">collections</span>
                        <p className="font-bold text-sm">No media found. Upload your store photos!</p>
                     </div>
                  )}
               </div>
            </div>
         )}

         {/* --- Tab Content: MENU --- */}
         {activeTab === 'menu' && (
            <div className="space-y-8 animate-fade-in">
               {/* Category Management */}
               <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-primary/10 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                     <h3 className="text-sm font-black text-primary uppercase tracking-widest">Category Management</h3>
                     <button className="text-[10px] font-black underline" onClick={() => {
                        const name = prompt('New Category Name?');
                        if (name) setCategories([...categories, name]);
                     }}>+ NEW CATEGORY</button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                     {categories.map(cat => (
                        <div key={cat} className="group bg-gray-50 dark:bg-zinc-950 px-5 py-3 rounded-xl font-bold text-xs flex items-center gap-3 border border-transparent hover:border-primary/20 transition-all">
                           {cat}
                           <button onClick={() => setCategories(categories.filter(c => c !== cat))} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500">
                              <span className="material-symbols-outlined text-xs">close</span>
                           </button>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Add Item Form */}
                  <div className="lg:col-span-1 bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-primary/10 shadow-sm space-y-6 h-fit sticky top-8">
                     <h3 className="text-sm font-black text-primary uppercase tracking-widest">Add New Product</h3>

                     <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</label>
                           <select
                              value={newMenuItem.category}
                              onChange={e => setNewMenuItem({ ...newMenuItem, category: e.target.value })}
                              className="bg-gray-50 dark:bg-zinc-950 border-none rounded-xl px-4 py-3 font-bold text-sm"
                           >
                              {categories.map(c => <option key={c} value={c}>{c}</option>)}
                           </select>
                        </div>

                        <div className="flex flex-col gap-2 text-center">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Menu Image</label>
                           <div className="relative group mx-auto w-full aspect-video rounded-2xl border-2 border-dashed border-primary/20 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-zinc-950">
                              {newMenuItem.image ? (
                                 <img src={newMenuItem.image} className="w-full h-full object-cover" alt="Preview" />
                              ) : (
                                 <span className="material-symbols-outlined text-gray-300 text-3xl">add_photo_alternate</span>
                              )}
                              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileUpload(e, 'menu')} accept="image/*" />
                           </div>
                        </div>

                        <div className="flex flex-col gap-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Name</label>
                           <input
                              type="text"
                              value={newMenuItem.name || ''}
                              onChange={e => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                              placeholder="e.g. Hennessy XO"
                              className="bg-gray-50 dark:bg-zinc-950 border-none rounded-xl px-4 py-3 font-bold text-sm"
                           />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Price</label>
                              <input
                                 type="text"
                                 value={newMenuItem.price || ''}
                                 onChange={e => setNewMenuItem({ ...newMenuItem, price: e.target.value })}
                                 placeholder="PHP"
                                 className="bg-gray-50 dark:bg-zinc-950 border-none rounded-xl px-4 py-3 font-bold text-sm"
                              />
                           </div>
                           <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Promotion</label>
                              <input
                                 type="text"
                                 value={newMenuItem.promotion || ''}
                                 onChange={e => setNewMenuItem({ ...newMenuItem, promotion: e.target.value })}
                                 placeholder="e.g. 10% OFF"
                                 className="bg-gray-50 dark:bg-zinc-950 border-none rounded-xl px-4 py-3 font-bold text-sm"
                              />
                           </div>
                        </div>

                        {/* Event Highlight Section */}
                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-4">
                           <div className="flex items-center justify-between">
                              <label className="text-[10px] font-black text-[#1b180d] uppercase tracking-widest">Event Menu Highlight</label>
                              <input
                                 type="checkbox"
                                 checked={newMenuItem.isEvent}
                                 onChange={e => setNewMenuItem({ ...newMenuItem, isEvent: e.target.checked })}
                                 className="w-4 h-4 accent-primary"
                              />
                           </div>
                           {newMenuItem.isEvent && (
                              <div className="space-y-3 animate-slide-up">
                                 <input
                                    type="text"
                                    placeholder="Event Special Price"
                                    value={newMenuItem.eventPrice || ''}
                                    onChange={e => setNewMenuItem({ ...newMenuItem, eventPrice: e.target.value })}
                                    className="w-full bg-white dark:bg-zinc-900 border-none rounded-xl px-4 py-3 font-bold text-sm"
                                 />
                                 <textarea
                                    placeholder="Event Description (Displayed in details)"
                                    value={newMenuItem.eventDescription || ''}
                                    onChange={e => setNewMenuItem({ ...newMenuItem, eventDescription: e.target.value })}
                                    className="w-full bg-white dark:bg-zinc-900 border-none rounded-xl px-4 py-3 font-bold text-sm"
                                    rows={2}
                                 />
                              </div>
                           )}
                        </div>

                        <button
                           onClick={addMenuItem}
                           className="w-full py-4 bg-[#1b180d] text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#2e2a1a] transition-all"
                        >
                           Add to Menu List
                        </button>
                     </div>
                  </div>

                  {/* List and Category Preview */}
                  <div className="lg:col-span-2 space-y-8">
                     {categories.map(cat => (
                        <div key={cat} className="space-y-4">
                           <div className="flex items-center gap-4">
                              <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-primary/20"></div>
                              <h4 className="font-black text-[10px] uppercase tracking-[0.3em] text-gray-500">{cat}</h4>
                              <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-primary/20"></div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {menuItems.filter(item => item.category === cat).map(item => (
                                 <div key={item.id} className={`group relative bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-primary/5 flex gap-4 transition-all hover:border-primary/20 ${item.isEvent ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-zinc-950' : ''}`}>
                                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                                       {item.image ? (
                                          <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                                       ) : (
                                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                                             <span className="material-symbols-outlined italic">image</span>
                                          </div>
                                       )}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center">
                                       <div className="flex justify-between items-start">
                                          <h5 className="font-black text-sm uppercase">{item.name}</h5>
                                          <button onClick={() => setMenuItems(menuItems.filter(i => i.id !== item.id))} className="text-gray-300 hover:text-red-500 transition-colors">
                                             <span className="material-symbols-outlined text-sm">delete</span>
                                          </button>
                                       </div>
                                       <div className="flex items-center gap-2 mt-1">
                                          <span className="text-primary font-black text-sm">PHP {item.price}</span>
                                          {item.promotion && <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase italic">{item.promotion}</span>}
                                       </div>
                                       {item.isEvent && (
                                          <div className="mt-2 text-[10px] font-bold text-primary italic">
                                             ★ EVENT: {item.eventPrice} PHP - {item.eventDescription}
                                          </div>
                                       )}
                                    </div>
                                 </div>
                              ))}
                           </div>
                           {menuItems.filter(item => item.category === cat).length === 0 && (
                              <p className="text-center py-6 text-[10px] font-bold text-gray-400 italic">No items in this category.</p>
                           )}
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         )}

         {/* --- Tab Content: TABLES & ROOMS --- */}
         {activeTab === 'tables_rooms' && (
            <div className="space-y-8 animate-fade-in">
               {/* Tables Section */}
               <section className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-primary/10 shadow-sm space-y-6">
                  <div className="flex justify-between items-center">
                     <h3 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">table_bar</span> Tables Registration
                     </h3>
                  </div>

                  {/* Add Table Form */}
                  <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 items-end bg-gray-50 dark:bg-zinc-950 p-6 rounded-2xl border border-primary/5">
                     <div className="flex flex-col gap-2 relative group">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Photo</label>
                        <div
                           className="w-full h-24 rounded-xl bg-white dark:bg-zinc-900 border border-primary/10 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 transition-all"
                           onClick={() => setShowMediaPicker({ active: true, type: 'table' })}
                        >
                           {newTable.image ? (
                              <img src={newTable.image} className="w-full h-full object-cover" alt="Table" />
                           ) : (
                              <span className="material-symbols-outlined text-gray-300">add_a_photo</span>
                           )}
                        </div>
                        <input type="file" className="hidden" id="table-direct-upload" onChange={(e) => handleFileUpload(e, 'table')} />
                        <button
                           type="button"
                           onClick={(e) => { e.stopPropagation(); document.getElementById('table-direct-upload')?.click(); }}
                           className="absolute top-8 right-2 p-1 bg-primary text-[#1b180d] rounded-full scale-0 group-hover:scale-100 transition-all shadow-lg"
                        >
                           <span className="material-symbols-outlined text-xs">upload</span>
                        </button>
                     </div>
                     <div className="md:col-span-2 flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</label>
                        <input type="text" value={newTable.name || ''} onChange={e => setNewTable({ ...newTable, name: e.target.value })} className="bg-white dark:bg-zinc-900 border-none rounded-xl px-4 py-3 font-bold text-sm" placeholder="e.g. VIP Table A" />
                     </div>
                     <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Number</label>
                        <input type="text" value={newTable.number || ''} onChange={e => setNewTable({ ...newTable, number: e.target.value })} className="bg-white dark:bg-zinc-900 border-none rounded-xl px-4 py-3 font-bold text-sm" placeholder="e.g. 101" />
                     </div>
                     <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Capacity</label>
                        <input type="text" value={newTable.capacity || ''} onChange={e => setNewTable({ ...newTable, capacity: e.target.value })} className="bg-white dark:bg-zinc-900 border-none rounded-xl px-4 py-3 font-bold text-sm" placeholder="e.g. 4 persons" />
                     </div>
                     <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Extra PHP</label>
                        <input type="text" value={newTable.extraPrice || ''} onChange={e => setNewTable({ ...newTable, extraPrice: e.target.value })} className="bg-white dark:bg-zinc-900 border-none rounded-xl px-4 py-3 font-bold text-sm" placeholder="e.g. 500" />
                     </div>
                     <div className="flex flex-col gap-2 md:col-span-4 lg:col-span-6">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Remarks</label>
                        <input type="text" value={newTable.remarks || ''} onChange={e => setNewTable({ ...newTable, remarks: e.target.value })} className="bg-white dark:bg-zinc-900 border-none rounded-xl px-4 py-3 font-bold text-sm w-full" placeholder="Additional notes..." />
                     </div>
                     <button onClick={addTable} className="h-[46px] w-full bg-primary text-[#1b180d] rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.05] transition-all">Add Table</button>
                  </div>

                  {/* Tables List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {tables.map(table => (
                        <div key={table.id} className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-primary/5 flex gap-4 group hover:border-primary/20 transition-all">
                           <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                              <img src={table.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400'} className="w-full h-full object-cover" alt={table.name} />
                           </div>
                           <div className="flex-1 relative">
                              <h4 className="font-black text-sm uppercase">{table.name} <span className="text-primary ml-1">#{table.number}</span></h4>
                              <p className="text-[10px] font-bold text-gray-400 mt-1 italic">{table.capacity} | PHP {table.extraPrice}</p>
                              {table.remarks && <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">{table.remarks}</p>}
                              <button onClick={() => deleteTable(table.id)} className="absolute top-0 right-0 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                 <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               </section>

               {/* Rooms Section */}
               <section className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-primary/10 shadow-sm space-y-6">
                  <h3 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
                     <span className="material-symbols-outlined text-base">door_front</span> Rooms Registration
                  </h3>

                  {/* Add Room Form */}
                  <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 items-end bg-gray-50 dark:bg-zinc-950 p-6 rounded-2xl border border-primary/5">
                     <div className="flex flex-col gap-2 relative group">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Photo</label>
                        <div
                           className="w-full h-24 rounded-xl bg-white dark:bg-zinc-900 border border-primary/10 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 transition-all"
                           onClick={() => setShowMediaPicker({ active: true, type: 'room' })}
                        >
                           {newRoom.image ? (
                              <img src={newRoom.image} className="w-full h-full object-cover" alt="Room" />
                           ) : (
                              <span className="material-symbols-outlined text-gray-300">add_a_photo</span>
                           )}
                        </div>
                        <input type="file" className="hidden" id="room-direct-upload" onChange={(e) => handleFileUpload(e, 'room')} />
                        <button
                           type="button"
                           onClick={(e) => { e.stopPropagation(); document.getElementById('room-direct-upload')?.click(); }}
                           className="absolute top-8 right-2 p-1 bg-primary text-[#1b180d] rounded-full scale-0 group-hover:scale-100 transition-all shadow-lg"
                        >
                           <span className="material-symbols-outlined text-xs">upload</span>
                        </button>
                     </div>
                     <div className="md:col-span-2 flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Room Name</label>
                        <input type="text" value={newRoom.name || ''} onChange={e => setNewRoom({ ...newRoom, name: e.target.value })} className="bg-white dark:bg-zinc-900 border-none rounded-xl px-4 py-3 font-bold text-sm" placeholder="e.g. Moonlight Suite" />
                     </div>
                     <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Room No.</label>
                        <input type="text" value={newRoom.number || ''} onChange={e => setNewRoom({ ...newRoom, number: e.target.value })} className="bg-white dark:bg-zinc-900 border-none rounded-xl px-4 py-3 font-bold text-sm" placeholder="e.g. RM 501" />
                     </div>
                     <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Capacity</label>
                        <input type="text" value={newRoom.capacity || ''} onChange={e => setNewRoom({ ...newRoom, capacity: e.target.value })} className="bg-white dark:bg-zinc-900 border-none rounded-xl px-4 py-3 font-bold text-sm" placeholder="e.g. 10 persons" />
                     </div>
                     <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Extra PHP</label>
                        <input type="text" value={newRoom.extraPrice || ''} onChange={e => setNewRoom({ ...newRoom, extraPrice: e.target.value })} className="bg-white dark:bg-zinc-900 border-none rounded-xl px-4 py-3 font-bold text-sm" placeholder="e.g. 2,000" />
                     </div>
                     <div className="flex flex-col gap-2 md:col-span-4 lg:col-span-6">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Remarks</label>
                        <input type="text" value={newRoom.remarks || ''} onChange={e => setNewRoom({ ...newRoom, remarks: e.target.value })} className="bg-white dark:bg-zinc-900 border-none rounded-xl px-4 py-3 font-bold text-sm w-full" placeholder="Additional notes..." />
                     </div>
                     <button onClick={addRoom} className="h-[46px] w-full bg-primary text-[#1b180d] rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.05] transition-all">Add Room</button>
                  </div>

                  {/* Rooms List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {rooms.map(room => (
                        <div key={room.id} className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-primary/5 flex gap-4 group hover:border-primary/20 transition-all">
                           <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                              <img src={room.image || 'https://images.unsplash.com/photo-1445013541991-d1474dd7c11d?w=400'} className="w-full h-full object-cover" alt={room.name} />
                           </div>
                           <div className="flex-1 relative">
                              <h4 className="font-black text-sm uppercase">{room.name} <span className="text-primary ml-1">#{room.number}</span></h4>
                              <p className="text-[10px] font-bold text-gray-400 mt-1 italic">{room.capacity} | PHP {room.extraPrice}</p>
                              {room.remarks && <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">{room.remarks}</p>}
                              <button onClick={() => deleteRoom(room.id)} className="absolute top-0 right-0 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                 <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               </section>
            </div>
         )}

         {/* Media Picker Modal */}
         {showMediaPicker.active && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
               <div className="bg-[#1b180d] border border-primary/20 w-full max-w-4xl max-h-[80vh] rounded-[40px] overflow-hidden flex flex-col">
                  <div className="p-8 border-b border-primary/10 flex justify-between items-center">
                     <div>
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Select From Media</h2>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">Pick a photo from your gallery for the {showMediaPicker.type}</p>
                     </div>
                     <button onClick={() => setShowMediaPicker({ ...showMediaPicker, active: false })} className="w-12 h-12 rounded-2xl bg-white/5 text-white hover:bg-primary hover:text-[#1b180d] transition-all flex items-center justify-center">
                        <span className="material-symbols-outlined">close</span>
                     </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8">
                     <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {mediaItems.filter(m => m.type === 'image').map(item => (
                           <button
                              key={item.id}
                              onClick={() => handleMediaSelectForTableRoom(item.url)}
                              className="aspect-square rounded-2xl overflow-hidden border-2 border-transparent hover:border-primary transition-all relative group"
                           >
                              <img src={item.url} className="w-full h-full object-cover" alt="Gallery" />
                              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                 <span className="material-symbols-outlined text-[#1b180d] font-black">check_circle</span>
                              </div>
                           </button>
                        ))}
                     </div>
                     {mediaItems.filter(m => m.type === 'image').length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                           <span className="material-symbols-outlined text-6xl mb-4">image_not_supported</span>
                           <p className="font-black uppercase text-xs tracking-widest">No images found in Media Settings</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default AdminProfile;
