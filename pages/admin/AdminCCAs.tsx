
import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { CCA, PointCategory, PointLog } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

const AdminCCAs: React.FC = () => {
   const [activeTab, setActiveTab] = useState('current');
   const [ccas, setCcas] = useState<CCA[]>([]);
   const [loading, setLoading] = useState(true);
   const [selectedCCA, setSelectedCCA] = useState<CCA | null>(null);
   const [pointCategories, setPointCategories] = useState<PointCategory[]>([]);
   const [pointLogs, setPointLogs] = useState<PointLog[]>([]);
   const [showDetailModal, setShowDetailModal] = useState(false);
   const [showRegisterModal, setShowRegisterModal] = useState(false);
   const [detailTab, setDetailTab] = useState<'profile' | 'score'>('profile');

   // New Registration Form State
   const [regForm, setRegForm] = useState({
      nickname: '',
      firstName: '',
      middleName: '',
      lastName: '',
      birthDay: '01',
      birthMonth: 'Jan',
      birthYear: '2000',
      address: '',
      phone: '',
      password: '',
      maritalStatus: 'single',
      childrenStatus: 'none',
      specialNotes: ''
   });

   // New Score Form State
   const [newScore, setNewScore] = useState({
      categoryId: '',
      quantity: 1,
      description: '',
      date: new Date().toISOString().slice(0, 16)
   });

   useEffect(() => {
      fetchCCAs();
      fetchCategories();
   }, []);

   const fetchCCAs = async () => {
      setLoading(true);
      const data = await apiService.getCCAs();
      setCcas(data);
      setLoading(false);
   };

   const fetchCategories = async () => {
      const data = await apiService.getCCAPointCategories('v1');
      setPointCategories(data);
   };

   const fetchPointLogs = async (ccaId: string) => {
      const data = await apiService.getCCAPointLogs(ccaId);
      setPointLogs(data);
   };

   const handleViewDetail = async (cca: CCA) => {
      setSelectedCCA(cca);
      await fetchPointLogs(cca.id);
      setShowDetailModal(true);
      setDetailTab('profile');
   };

   const handleRegisterStaff = async (confirmImmediately: boolean = false) => {
      const { nickname, firstName, middleName, lastName, birthDay, birthMonth, birthYear, address, phone, password, maritalStatus, childrenStatus, specialNotes } = regForm;

      if (!nickname || !firstName || !lastName || !address || !phone || !password) {
         alert('Please fill in all required fields.');
         return;
      }

      const formattedBirthday = `${birthDay}. ${birthMonth}. ${birthYear}.`;

      const success = await apiService.updateCCA({
         nickname,
         realNameFirst: firstName,
         realNameMiddle: middleName,
         realNameLast: lastName,
         birthday: formattedBirthday,
         address,
         phone,
         password,
         maritalStatus,
         childrenStatus,
         specialNotes,
         status: confirmImmediately ? 'active' : 'applicant',
         venueId: 'v1'
      });

      if (success) {
         alert(confirmImmediately ? 'Staff registered and hired successfully!' : 'Staff registered as applicant.');
         setShowRegisterModal(false);
         setRegForm({
            nickname: '', firstName: '', middleName: '', lastName: '',
            birthDay: '01', birthMonth: 'Jan', birthYear: '2000',
            address: '', phone: '', password: '',
            maritalStatus: 'single', childrenStatus: 'none', specialNotes: ''
         });
         fetchCCAs();
      } else {
         alert('Registration failed.');
      }
   };

   const handleHireApplicant = async (ccaId: string) => {
      const success = await apiService.updateCCA({ id: ccaId, status: 'active' });
      if (success) {
         alert('Staff hired successfully!');
         fetchCCAs();
      }
   };

   const handleDeclineApplicant = async (ccaId: string) => {
      if (confirm('Are you sure you want to decline this applicant?')) {
         // For now we just mark as dismissed or delete, but status 'declined' is also fine
         await apiService.updateCCA({ id: ccaId, status: 'inactive' });
         fetchCCAs();
      }
   };

   const handleDeleteLog = async (log: PointLog) => {
      if (!selectedCCA) return;
      const category = pointCategories.find(c => c.id === log.category_id);
      const success = await apiService.deleteCCAPointLog({
         id: log.id,
         ccaId: selectedCCA.id,
         total: log.total,
         type: (category?.type as any) || 'point'
      });
      if (success) {
         fetchPointLogs(selectedCCA.id);
         fetchCCAs();
      }
   };

   const handleAddScore = async () => {
      if (!selectedCCA || !newScore.categoryId) return;
      const category = pointCategories.find(c => c.id === newScore.categoryId);
      if (!category) return;

      const success = await apiService.addCCAPointLog({
         ccaId: selectedCCA.id,
         categoryId: category.id,
         name: category.name,
         amount: category.amount,
         type: category.type,
         quantity: newScore.quantity,
         description: newScore.description,
         logDate: newScore.date
      });

      if (success) {
         await fetchPointLogs(selectedCCA.id);
         setNewScore({
            categoryId: '',
            quantity: 1,
            description: '',
            date: new Date().toISOString().slice(0, 16)
         });
         fetchCCAs(); // Refresh points in main list
      } else {
         alert('Failed to add score');
      }
   };

   const calculateSalary = () => {
      const totalPoints = pointLogs
         .filter(l => {
            const cat = pointCategories.find(c => c.id === l.category_id);
            return cat?.type === 'point' || (!cat && l.total > 0);
         })
         .reduce((sum, l) => sum + l.total, 0);

      const totalPenalties = pointLogs
         .filter(l => {
            const cat = pointCategories.find(c => c.id === l.category_id);
            return cat?.type === 'penalty' || (!cat && l.total < 0);
         })
         .reduce((sum, l) => sum + Math.abs(l.total), 0);

      return totalPoints - totalPenalties;
   };

   if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

   return (
      <div className="space-y-10 animate-fade-in relative">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex gap-4 p-1.5 bg-white dark:bg-zinc-900 rounded-2xl border border-primary/10 w-fit">
               <button onClick={() => setActiveTab('current')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'current' ? 'bg-primary text-[#1b180d]' : 'text-gray-400 hover:text-primary'}`}>Current Staff</button>
               <button onClick={() => setActiveTab('applicants')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'applicants' ? 'bg-primary text-[#1b180d]' : 'text-gray-400 hover:text-primary'}`}>
                  Applicants <span className="ml-1 bg-red-500 text-white text-[8px] px-1.5 rounded-full">{ccas.filter(c => c.status === 'applicant').length}</span>
               </button>
            </div>
            <button onClick={() => setShowRegisterModal(true)} className="h-14 bg-primary text-[#1b180d] px-8 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">Manually Register Staff</button>
         </div>

         {activeTab === 'current' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
               {ccas.filter(c => c.status === 'active').map(cca => (
                  <div key={cca.id} className="bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden border border-primary/5 shadow-sm group hover:border-primary transition-all">
                     <div className="h-32 bg-[#1b180d] relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1b180d] to-transparent opacity-60"></div>
                        <img src={cca.image} className="absolute -bottom-6 left-6 size-24 rounded-2xl object-cover border-4 border-white dark:border-zinc-900 shadow-xl" />
                     </div>
                     <div className="p-8 pt-10">
                        <div className="flex items-center justify-between mb-4">
                           <div>
                              <h4 className="text-xl font-black">{cca.nickname || cca.name}</h4>
                              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Grade: {cca.grade}</span>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Points</p>
                              <p className="font-black text-primary">{cca.points?.toLocaleString() || 0} P</p>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                           <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-primary/5 text-center">
                              <p className="text-[8px] font-black text-gray-400 uppercase">Phone</p>
                              <p className="font-bold text-[10px] truncate">{cca.phone || '-'}</p>
                           </div>
                           <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-primary/5 text-center">
                              <p className="text-[8px] font-black text-gray-400 uppercase">Status</p>
                              <p className={`font-black uppercase text-[10px] ${cca.status === 'active' ? 'text-green-500' : 'text-gray-400'}`}>{cca.status}</p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => handleViewDetail(cca)} className="flex-1 py-4 bg-[#1b180d] dark:bg-white/5 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-[#1b180d] transition-all">Manage Info & Score</button>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         )}

         {/* Applicants View */}
         {activeTab === 'applicants' && (
            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 border border-primary/10 shadow-sm animate-fade-in">
               <h3 className="text-xl font-black mb-8 tracking-tight italic uppercase">Recruitment Requests</h3>
               <div className="space-y-6">
                  {ccas.filter(c => c.status === 'applicant').map(cca => (
                     <div key={cca.id} className="flex flex-col md:flex-row md:items-center justify-between p-8 bg-background-light dark:bg-white/5 rounded-3xl border border-primary/5 gap-6">
                        <div className="flex items-center gap-6">
                           <img src={cca.image || 'https://via.placeholder.com/200'} className="size-20 rounded-2xl object-cover" />
                           <div>
                              <h4 className="text-2xl font-black">{cca.nickname || cca.name}</h4>
                              <p className="text-sm font-bold text-gray-400">Apply Date: {cca.birthday} (Age verified)</p>
                              <div className="flex gap-3 mt-2">
                                 <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-tighter">Phone: {cca.phone}</span>
                                 <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-tighter">Status: {cca.maritalStatus} / {cca.childrenStatus}</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex gap-3">
                           <button onClick={() => handleDeclineApplicant(cca.id)} className="px-8 py-3 border border-red-500/20 text-red-500 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-red-500 hover:text-white transition-all">Decline</button>
                           <button onClick={() => handleHireApplicant(cca.id)} className="px-8 py-3 bg-primary text-[#1b180d] rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all">Acceptance of Employment</button>
                        </div>
                     </div>
                  ))}
                  {ccas.filter(c => c.status === 'applicant').length === 0 && <p className="text-gray-500 italic text-sm text-center py-10 uppercase tracking-widest">No candidates found.</p>}
               </div>
            </div>
         )}

         {/* DETAIL MODAL */}
         <AnimatePresence>
            {showDetailModal && selectedCCA && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDetailModal(false)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
                  <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-[#1b180d] border border-primary/20 w-full max-w-6xl h-[90vh] rounded-[3rem] overflow-hidden shadow-2xl z-10 flex flex-col relative" >
                     <div className="p-8 border-b border-primary/10 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                           <img src={selectedCCA.image} className="size-16 rounded-2xl object-cover border-2 border-primary" />
                           <div>
                              <h4 className="text-3xl font-black text-white italic uppercase">{selectedCCA.nickname || selectedCCA.name}</h4>
                              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-1">{selectedCCA.grade || 'Staff'}</p>
                           </div>
                        </div>
                        <button onClick={() => setShowDetailModal(false)} className="size-14 flex items-center justify-center rounded-[1.5rem] bg-white/5 text-white hover:bg-primary hover:text-[#1b180d] transition-all">
                           <span className="material-symbols-outlined">close</span>
                        </button>
                     </div>

                     <div className="flex bg-white/5 p-2 gap-2 border-b border-primary/10">
                        <button onClick={() => setDetailTab('profile')} className={`flex-1 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${detailTab === 'profile' ? 'bg-primary text-[#1b180d]' : 'text-gray-400 hover:text-white'}`}>Staff Profile</button>
                        <button onClick={() => setDetailTab('score')} className={`flex-1 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${detailTab === 'score' ? 'bg-primary text-[#1b180d]' : 'text-gray-400 hover:text-white'}`}>Score & Salary Management</button>
                     </div>

                     <div className="flex-1 overflow-y-auto p-10">
                        {detailTab === 'profile' ? (
                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                              <div className="space-y-8">
                                 <div>
                                    <h5 className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Basic Information (Read Only)</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                       <div className="space-y-1">
                                          <p className="text-[9px] font-black text-gray-500 uppercase">Real Name</p>
                                          <p className="text-white font-bold">{selectedCCA.realNameFirst} {selectedCCA.realNameMiddle} {selectedCCA.realNameLast}</p>
                                       </div>
                                       <div className="space-y-1">
                                          <p className="text-[9px] font-black text-gray-500 uppercase">Birthday</p>
                                          <p className="text-white font-bold">{selectedCCA.birthday || '-'}</p>
                                       </div>
                                       <div className="space-y-1">
                                          <p className="text-[9px] font-black text-gray-500 uppercase">Phone</p>
                                          <p className="text-white font-bold">{selectedCCA.phone || '-'}</p>
                                       </div>
                                       <div className="space-y-1">
                                          <p className="text-[9px] font-black text-gray-500 uppercase">Address</p>
                                          <p className="text-white font-bold">{selectedCCA.address || '-'}</p>
                                       </div>
                                    </div>
                                 </div>
                                 <div>
                                    <h5 className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Experience History</h5>
                                    <div className="space-y-3">
                                       {(selectedCCA.experienceHistory || []).map((exp: any, i: number) => (
                                          <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                             <div className="flex justify-between items-center">
                                                <p className="font-bold text-white">{exp.venueName}</p>
                                                <span className="text-[10px] text-gray-500">{exp.joinDate} ~ {exp.leaveDate}</span>
                                             </div>
                                          </div>
                                       ))}
                                       {(!selectedCCA.experienceHistory || selectedCCA.experienceHistory.length === 0) && <p className="text-gray-500 italic text-xs">No experience history recorded.</p>}
                                    </div>
                                 </div>
                              </div>
                              <div className="space-y-8">
                                 <div>
                                    <h5 className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Introduction & Notes</h5>
                                    <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 min-h-[120px]">
                                       <p className="text-gray-300 text-sm leading-relaxed">{selectedCCA.description || 'No introduction provided.'}</p>
                                    </div>
                                    <div className="mt-6 bg-primary/5 p-6 rounded-[2rem] border-l-4 border-primary">
                                       <p className="text-[9px] font-black text-primary uppercase mb-2">Internal Admin Note</p>
                                       <p className="text-white text-sm italic">"{selectedCCA.specialNotes || 'No internal notes found.'}"</p>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        ) : (
                           <div className="space-y-10 animate-fade-in">
                              {/* Salary Summary */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                 <div className="bg-white/5 p-8 rounded-[2rem] border border-green-500/20 text-center">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Accumulated Points</p>
                                    <p className="text-3xl font-black text-green-500">+{pointLogs.filter(l => pointCategories.find(c => c.id === l.category_id)?.type === 'point').reduce((sum, l) => sum + l.total, 0).toLocaleString()} <small className="text-xs">Peso</small></p>
                                 </div>
                                 <div className="bg-white/5 p-8 rounded-[2rem] border border-red-500/20 text-center">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Penalty Deductions</p>
                                    <p className="text-3xl font-black text-red-500">-{pointLogs.filter(l => pointCategories.find(c => c.id === l.category_id)?.type === 'penalty').reduce((sum, l) => sum + l.total, 0).toLocaleString()} <small className="text-xs">Peso</small></p>
                                 </div>
                                 <div className="bg-primary p-8 rounded-[2rem] shadow-xl shadow-primary/20 text-center">
                                    <p className="text-[10px] font-black text-black/60 uppercase tracking-widest mb-2">Final Settlement Salary</p>
                                    <p className="text-4xl font-black text-[#1b180d]">{calculateSalary().toLocaleString()} <small className="text-xs">PHP</small></p>
                                 </div>
                              </div>

                              {/* Category Settings Section */}
                              <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 mb-8 overflow-hidden">
                                 <div className="flex items-center justify-between mb-6">
                                    <h5 className="text-[10px] font-black text-primary uppercase tracking-widest">Global Point Category Settings</h5>
                                    <button onClick={() => {
                                       const name = prompt('Category Name?');
                                       const amount = prompt('Amount (Pesos)?');
                                       const type = confirm('Is this a Bonus Point? (Cancel for Penalty)') ? 'point' : 'penalty';
                                       if (name && amount) {
                                          apiService.saveCCAPointCategory({ venueId: 'v1', name, amount: parseFloat(amount), type }).then(() => fetchCategories());
                                       }
                                    }} className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-[#1b180d] transition-all">+ Add Category</button>
                                 </div>
                                 <div className="flex flex-wrap gap-4">
                                    {pointCategories.map(cat => (
                                       <div key={cat.id} className={`px-4 py-3 rounded-2xl border flex items-center gap-3 ${cat.type === 'point' ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                                          <span className="text-white text-xs font-bold">{cat.name} ({cat.amount} P)</span>
                                          <button onClick={() => {
                                             if (confirm('Delete this category?')) {
                                                apiService.deleteCCAPointCategory(cat.id).then(() => fetchCategories());
                                             }
                                          }} className="text-gray-500 hover:text-red-500 transition-all">
                                             <span className="material-symbols-outlined text-[14px]">cancel</span>
                                          </button>
                                       </div>
                                    ))}
                                 </div>
                              </div>

                              {/* Add Score Form */}
                              <div className="bg-white/5 p-8 rounded-[2.5rem] border border-primary/20">
                                 <h5 className="text-[10px] font-black text-primary uppercase tracking-widest mb-6">Record New Point or Penalty</h5>
                                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="md:col-span-2 space-y-3">
                                       <label className="text-[9px] font-black text-gray-500 uppercase ml-2">Category</label>
                                       <select
                                          value={newScore.categoryId}
                                          onChange={e => setNewScore({ ...newScore, categoryId: e.target.value })}
                                          className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-primary"
                                       >
                                          <option value="">Select Item...</option>
                                          <optgroup label="POINTS (+)" className="text-green-500 bg-[#1b180d]">
                                             {pointCategories.filter(c => c.type === 'point').map(c => <option key={c.id} value={c.id}>{c.name} ({c.amount} PHP)</option>)}
                                          </optgroup>
                                          <optgroup label="PENALTIES (-)" className="text-red-500 bg-[#1b180d]">
                                             {pointCategories.filter(c => c.type === 'penalty').map(c => <option key={c.id} value={c.id}>{c.name} ({c.amount} PHP)</option>)}
                                          </optgroup>
                                       </select>
                                    </div>
                                    <div className="space-y-3">
                                       <label className="text-[9px] font-black text-gray-500 uppercase ml-2">Quantity</label>
                                       <input
                                          type="number"
                                          value={newScore.quantity}
                                          min="1"
                                          onChange={e => setNewScore({ ...newScore, quantity: parseInt(e.target.value) || 1 })}
                                          className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-primary"
                                       />
                                    </div>
                                    <div className="space-y-3">
                                       <label className="text-[9px] font-black text-gray-500 uppercase ml-2">Date / Time</label>
                                       <input
                                          type="datetime-local"
                                          value={newScore.date}
                                          onChange={e => setNewScore({ ...newScore, date: e.target.value })}
                                          className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-primary"
                                       />
                                    </div>
                                 </div>
                                 <div className="mt-6 flex gap-4">
                                    <input
                                       type="text"
                                       placeholder="Special Remarks / Reason..."
                                       value={newScore.description}
                                       onChange={e => setNewScore({ ...newScore, description: e.target.value })}
                                       className="flex-1 bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-primary"
                                    />
                                    <button
                                       onClick={handleAddScore}
                                       className="px-10 bg-primary text-[#1b180d] rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:scale-105 transition-all"
                                    >Submit Record</button>
                                 </div>
                              </div>

                              {/* Logs Side by Side */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                 {/* POINTS LIST */}
                                 <div className="space-y-4">
                                    <h6 className="text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center gap-2">
                                       <span className="material-symbols-outlined text-sm">trending_up</span> Points History
                                    </h6>
                                    <div className="space-y-3">
                                       {pointLogs.filter(l => pointCategories.find(c => c.id === l.category_id)?.type === 'point').map(log => (
                                          <div key={log.id} className="bg-white/5 border-l-2 border-green-500 p-4 rounded-xl flex justify-between items-center group">
                                             <div>
                                                <p className="text-white font-bold text-sm">{log.name} <span className="text-[10px] text-gray-600 font-normal">x{log.quantity}</span></p>
                                                <p className="text-[9px] text-gray-500">{new Date(log.log_date).toLocaleString()}</p>
                                                {log.description && <p className="text-[10px] text-gray-400 mt-1 italic">"{log.description}"</p>}
                                             </div>
                                             <div className="text-right flex items-center gap-4">
                                                <p className="font-black text-green-500">+{log.total.toLocaleString()}</p>
                                                <button onClick={() => handleDeleteLog(log)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:scale-125 transition-all">
                                                   <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                             </div>
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                                 {/* PENALTY LIST */}
                                 <div className="space-y-4">
                                    <h6 className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                                       <span className="material-symbols-outlined text-sm">trending_down</span> Penalty History
                                    </h6>
                                    <div className="space-y-3">
                                       {pointLogs.filter(l => pointCategories.find(c => c.id === l.category_id)?.type === 'penalty').map(log => (
                                          <div key={log.id} className="bg-white/5 border-l-2 border-red-500 p-4 rounded-xl flex justify-between items-center group">
                                             <div>
                                                <p className="text-white font-bold text-sm">{log.name} <span className="text-[10px] text-gray-600 font-normal">x{log.quantity}</span></p>
                                                <p className="text-[9px] text-gray-500">{new Date(log.log_date).toLocaleString()}</p>
                                                {log.description && <p className="text-[10px] text-gray-400 mt-1 italic">"{log.description}"</p>}
                                             </div>
                                             <div className="text-right flex items-center gap-4">
                                                <p className="font-black text-red-500">-{log.total.toLocaleString()}</p>
                                                <button onClick={() => handleDeleteLog(log)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:scale-125 transition-all">
                                                   <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                             </div>
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>
         {/* REGISTER MODAL */}
         <AnimatePresence>
            {showRegisterModal && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRegisterModal(false)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
                  <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-[#1b180d] border border-primary/30 w-full max-w-4xl h-[90vh] rounded-[3rem] overflow-hidden shadow-2xl z-10 flex flex-col relative" >
                     <div className="p-8 border-b border-primary/10 flex items-center justify-between bg-primary/5">
                        <h4 className="text-2xl font-black text-white italic uppercase tracking-widest">Register Staff Profile</h4>
                        <button onClick={() => setShowRegisterModal(false)} className="size-12 flex items-center justify-center rounded-2xl bg-white/5 text-white hover:bg-primary hover:text-[#1b180d] transition-all">
                           <span className="material-symbols-outlined">close</span>
                        </button>
                     </div>
                     <div className="flex-1 overflow-y-auto p-10 space-y-10">
                        {/* Section 1: Names & Identity */}
                        <div className="space-y-6">
                           <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Identity & Recognition</h5>
                           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                              <div className="md:col-span-2 space-y-2">
                                 <label className="text-[9px] font-black text-gray-500 uppercase ml-2">Nickname (Display Name)*</label>
                                 <input type="text" placeholder="e.g. Yumi" value={regForm.nickname} onChange={e => setRegForm({ ...regForm, nickname: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-primary" />
                              </div>
                              <div className="md:col-span-2 space-y-2">
                                 <label className="text-[9px] font-black text-gray-500 uppercase ml-2">Password*</label>
                                 <input type="password" placeholder="New login password" value={regForm.password} onChange={e => setRegForm({ ...regForm, password: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-primary" />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[9px] font-black text-gray-500 uppercase ml-2">First Name*</label>
                                 <input type="text" value={regForm.firstName} onChange={e => setRegForm({ ...regForm, firstName: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-white font-bold outline-none" />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[9px] font-black text-gray-500 uppercase ml-2">Middle Name</label>
                                 <input type="text" value={regForm.middleName} onChange={e => setRegForm({ ...regForm, middleName: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-white font-bold outline-none" />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[9px] font-black text-gray-500 uppercase ml-2">Last Name*</label>
                                 <input type="text" value={regForm.lastName} onChange={e => setRegForm({ ...regForm, lastName: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-white font-bold outline-none" />
                              </div>
                           </div>
                        </div>

                        {/* Section 2: Birth & Contact */}
                        <div className="space-y-6">
                           <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Personal Details & Birth</h5>
                           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                              <div className="md:col-span-3 space-y-2">
                                 <label className="text-[9px] font-black text-gray-500 uppercase ml-2">Date of Birth (Day. Month. Year.)*</label>
                                 <div className="grid grid-cols-3 gap-3">
                                    <select value={regForm.birthDay} onChange={e => setRegForm({ ...regForm, birthDay: e.target.value })} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-bold outline-none">
                                       {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(d => <option key={d} value={d} className="bg-[#1b180d]">{d}</option>)}
                                    </select>
                                    <select value={regForm.birthMonth} onChange={e => setRegForm({ ...regForm, birthMonth: e.target.value })} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-bold outline-none">
                                       {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => <option key={m} value={m} className="bg-[#1b180d]">{m}</option>)}
                                    </select>
                                    <select value={regForm.birthYear} onChange={e => setRegForm({ ...regForm, birthYear: e.target.value })} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-bold outline-none">
                                       {Array.from({ length: 60 }, (_, i) => String(2015 - i)).map(y => <option key={y} value={y} className="bg-[#1b180d]">{y}</option>)}
                                    </select>
                                 </div>
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[9px] font-black text-gray-500 uppercase ml-2">Phone Number*</label>
                                 <input type="tel" placeholder="09xx-xxx-xxxx" value={regForm.phone} onChange={e => setRegForm({ ...regForm, phone: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-primary" />
                              </div>
                              <div className="md:col-span-4 space-y-2">
                                 <label className="text-[9px] font-black text-gray-500 uppercase ml-2">Current Address*</label>
                                 <input type="text" placeholder="Full residential address" value={regForm.address} onChange={e => setRegForm({ ...regForm, address: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-primary" />
                              </div>
                           </div>
                        </div>

                        {/* Section 3: Status & Notes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                           <div className="space-y-6">
                              <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Marital & Children</h5>
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-3">
                                    <p className="text-[9px] font-black text-gray-500 uppercase ml-2">Marital Status</p>
                                    <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
                                       {['single', 'married'].map(s => (
                                          <button key={s} onClick={() => setRegForm({ ...regForm, maritalStatus: s })} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${regForm.maritalStatus === s ? 'bg-primary text-[#1b180d]' : 'text-gray-400'}`}>{s}</button>
                                       ))}
                                    </div>
                                 </div>
                                 <div className="space-y-3">
                                    <p className="text-[9px] font-black text-gray-500 uppercase ml-2">Children</p>
                                    <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
                                       {['none', 'yes'].map(s => (
                                          <button key={s} onClick={() => setRegForm({ ...regForm, childrenStatus: s })} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${regForm.childrenStatus === s ? 'bg-primary text-[#1b180d]' : 'text-gray-400'}`}>{s === 'none' ? 'No' : 'Yes'}</button>
                                       ))}
                                    </div>
                                 </div>
                              </div>
                           </div>
                           <div className="space-y-6">
                              <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Special Notes</h5>
                              <textarea placeholder="Any specific details, personality notes, or intake remarks..." value={regForm.specialNotes} onChange={e => setRegForm({ ...regForm, specialNotes: e.target.value })} className="w-full h-32 bg-white/5 border border-white/10 rounded-3xl px-6 py-4 text-white text-sm outline-none focus:border-primary resize-none" />
                           </div>
                        </div>
                     </div>
                     <div className="p-10 border-t border-primary/10 flex flex-col md:flex-row gap-6 bg-primary/5">
                        <button onClick={() => handleRegisterStaff(false)} className="flex-1 py-6 border border-primary/30 text-primary rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] hover:bg-primary/10 transition-all">List as Applicant</button>
                        <button onClick={() => handleRegisterStaff(true)} className="flex-1 py-6 bg-primary text-[#1b180d] rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Acceptance of Employment</button>
                     </div>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>
      </div>
   );
};

export default AdminCCAs;
