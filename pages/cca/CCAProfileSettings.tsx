
import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/apiService';
import { CCA, Venue, CCAExperience, MediaItem } from '../../types';

const MBTI_LIST = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'
];

const ZODIAC_SIGNS = [
  { name: 'Aries (양자리)', start: '03-21', end: '04-19' },
  { name: 'Taurus (황소자리)', start: '04-20', end: '05-20' },
  { name: 'Gemini (쌍둥이자리)', start: '05-21', end: '06-20' },
  { name: 'Cancer (게자리)', start: '06-21', end: '07-22' },
  { name: 'Leo (사자자리)', start: '07-23', end: '08-22' },
  { name: 'Virgo (처녀자리)', start: '08-23', end: '09-22' },
  { name: 'Libra (천칭자리)', start: '09-23', end: '10-22' },
  { name: 'Scorpio (전갈자리)', start: '10-23', end: '11-21' },
  { name: 'Sagittarius (궁수자리)', start: '11-22', end: '12-21' },
  { name: 'Capricorn (염소자리)', start: '12-22', end: '01-19' },
  { name: 'Aquarius (물병자리)', start: '01-20', end: '02-18' },
  { name: 'Pisces (물고기자리)', start: '02-19', end: '03-20' }
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CCAProfileSettings: React.FC = () => {
  const [cca, setCca] = useState<CCA | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showMbtiPopup, setShowMbtiPopup] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [galleryItems, setGalleryItems] = useState<MediaItem[]>([]);
  
  // Form State
  const [formData, setFormData] = useState<Partial<CCA>>({});

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // For demo/preview, we use 'c1' as the current CCA ID
        const currentCcaId = 'c1'; 
        const [ccaData, venuesData, galleryData] = await Promise.all([
          apiService.getCCAs().then(list => list.find(c => c.id === currentCcaId) || null),
          apiService.getVenues(),
          apiService.getGallery(currentCcaId)
        ]);
        
        if (ccaData) {
          setCca(ccaData);
          setFormData(ccaData);
        } else {
          setError("CCA 정보를 불러올 수 없습니다. DB에 해당 ID의 데이터가 있는지 확인해주세요.");
        }
        setVenues(venuesData);
        setGalleryItems(galleryData);
      } catch (err) {
        console.error("Load failed", err);
        setError("데이터 로딩 중 오류가 발생했습니다. DB 테이블이 생성되었는지 확인해주세요.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const calculateZodiac = (birthday: string) => {
    if (!birthday) return '';
    const date = new Date(birthday);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const mmdd = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    const sign = ZODIAC_SIGNS.find(s => {
      if (s.start <= s.end) {
        return mmdd >= s.start && mmdd <= s.end;
      } else {
        // Capricorn case
        return mmdd >= s.start || mmdd <= s.end;
      }
    });
    return sign ? sign.name : '';
  };

  const calculateAge = (birthday: string) => {
    if (!birthday) return '-';
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculateDays = (dateStr: string) => {
    if (!dateStr) return 0;
    const start = new Date(dateStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - start.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = MONTHS[d.getMonth()].toUpperCase();
    const year = d.getFullYear();
    return `${day}. ${month}. ${year}`;
  };

  const handleInputChange = (field: keyof CCA | string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof CCA] as any || {}),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => {
        const updated = { ...prev, [field]: value };
        if (field === 'birthday') {
          updated.zodiac = calculateZodiac(value);
        }
        return updated;
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await apiService.uploadImage(file);
    if (url) {
      handleInputChange('image', url);
    }
  };

  const handleAddExperience = () => {
    const newExp: CCAExperience = {
      joinDate: '',
      leaveDate: '',
      venueName: '',
      venueType: 'JTV',
      grade: ''
    };
    const history = [...(formData.experienceHistory || []), newExp];
    handleInputChange('experienceHistory', history);
  };

  const handleUpdateExperience = (index: number, field: keyof CCAExperience, value: string) => {
    const history = [...(formData.experienceHistory || [])];
    history[index] = { ...history[index], [field]: value };
    handleInputChange('experienceHistory', history);
  };

  const handleSave = async () => {
    if (!cca) return;
    setIsSaving(true);
    try {
      const updateData = { ...formData };
      if (newPassword) (updateData as any).password = newPassword;
      
      const result = await apiService.updateCCAProfile(cca.id, updateData);
      if (result.success) {
        setCca({ ...cca, ...formData });
        setIsEditMode(false);
        setNewPassword('');
        alert("Profile updated successfully!");
      } else {
        alert(`Failed to update profile: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="size-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl">error</span>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase">Data Load Error</h3>
          <p className="text-sm text-gray-500 font-medium">{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-primary text-[#1b180d] rounded-2xl text-xs font-black uppercase tracking-widest"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!cca) return null;

  const birthdayDate = formData.birthday ? new Date(formData.birthday) : new Date();
  const bDay = birthdayDate.getDate();
  const bMonth = birthdayDate.getMonth();
  const bYear = birthdayDate.getFullYear();

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in pb-24 px-4">
      {/* Profile Header */}
      <section className="bg-white dark:bg-zinc-900 rounded-[3rem] p-8 md:p-12 border border-primary/5 shadow-xl flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
           <span className="material-symbols-outlined text-8xl">verified_user</span>
        </div>

        <div className="relative group">
          <div className="size-44 md:size-52 rounded-full border-4 border-primary p-1.5 bg-white dark:bg-zinc-800 relative overflow-hidden shadow-2xl">
            <img src={formData.image || cca.image} className="size-full rounded-full object-cover transition-transform group-hover:scale-105" />
            {isEditMode && (
              <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-white text-4xl">photo_camera</span>
                <span className="text-[10px] text-white font-black uppercase mt-2">Change Photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-green-500 size-6 rounded-full border-4 border-white dark:border-zinc-900 shadow-lg"></div>
        </div>

        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="space-y-1">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {isEditMode ? (
                <div className="flex flex-col gap-2 w-full md:w-auto">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Display Name (Nickname)</label>
                    <input 
                      type="text" 
                      value={formData.nickname || ''} 
                      onChange={(e) => handleInputChange('nickname', e.target.value)}
                      placeholder="Enter Nickname"
                      className="text-2xl font-black bg-gray-100 dark:bg-white/5 border-none rounded-xl px-4 py-2 w-full focus:ring-2 ring-primary/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Public Name</label>
                    <input 
                      type="text" 
                      value={formData.name || ''} 
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter Public Name"
                      className="text-lg font-bold bg-gray-100 dark:bg-white/5 border-none rounded-xl px-4 py-1 w-full focus:ring-2 ring-primary/20"
                    />
                  </div>
                </div>
              ) : (
                <h2 className="text-4xl font-black tracking-tight">{cca.nickname || cca.name}</h2>
              )}
              <div className="flex gap-2">
                <button 
                  onClick={() => isEditMode ? handleSave() : setIsEditMode(true)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isEditMode ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-primary text-[#1b180d] shadow-lg shadow-primary/20 hover:scale-105'}`}
                >
                  {isSaving ? 'Saving...' : (isEditMode ? 'Edit Profile' : 'Edit Profile')}
                </button>
                <button 
                  onClick={() => setShowPreview(true)}
                  className="px-6 py-2.5 bg-white dark:bg-zinc-800 border border-primary/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 transition-all"
                >
                  Preview
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
              <span>{cca.venueName}</span>
              <span>•</span>
              <span>
                {cca.experienceHistory && cca.experienceHistory.length > 0 
                  ? `${formatDate(cca.experienceHistory[0].joinDate)} [${calculateDays(cca.experienceHistory[0].joinDate)} days]`
                  : 'No Join Date'}
              </span>
            </div>
          </div>

          <div className="flex justify-center md:justify-start gap-8">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black">{cca.postsCount || 0}</span>
              <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Posts</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black">{cca.likesCount || 0}</span>
              <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Likes</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black">{cca.viewsCount || 0}</span>
              <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Views</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Public & SNS */}
        <div className="lg:col-span-1 space-y-10">
          {/* Public Info Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-primary/5 shadow-sm space-y-8">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-pink-500/10 text-pink-500 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined">public</span>
              </div>
              <h3 className="text-xl font-black tracking-tight">Public Presence</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">MBTI</label>
                <button 
                  disabled={!isEditMode}
                  onClick={() => setShowMbtiPopup(true)}
                  className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl p-4 font-bold text-sm text-left flex items-center justify-between group"
                >
                  <span>{formData.mbti || 'Select MBTI'}</span>
                  {isEditMode && <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">grid_view</span>}
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Zodiac (Auto-calc)</label>
                <div className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl p-4 font-bold text-sm text-gray-500">
                  {formData.zodiac || 'Enter birthday first'}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">One-Line Story</label>
                <textarea 
                  disabled={!isEditMode}
                  value={formData.oneLineStory || ''}
                  onChange={(e) => handleInputChange('oneLineStory', e.target.value)}
                  placeholder="Your vibe in one line..."
                  className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl p-4 font-bold text-sm focus:ring-2 ring-primary/20 resize-none h-24"
                />
              </div>
            </div>
          </div>

          {/* SNS Links Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-primary/5 shadow-sm space-y-8">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined">share</span>
              </div>
              <h3 className="text-xl font-black tracking-tight">Social Connect</h3>
            </div>

            <div className="space-y-4">
              {[
                { id: 'instagram', label: 'Instagram' },
                { id: 'facebook', label: 'Facebook' },
                { id: 'tiktok', label: 'TikTok' },
                { id: 'twitter', label: 'X (Twitter)' },
                { id: 'threads', label: 'Threads' },
                { id: 'telegram', label: 'Telegram' }
              ].map(social => (
                <div key={social.id} className="flex flex-col gap-2 bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-transparent focus-within:border-primary/20 transition-all">
                  <p className="text-[10px] font-black text-black dark:text-white uppercase tracking-widest">{social.label}</p>
                  <input 
                    type="text" 
                    disabled={!isEditMode}
                    value={(formData.sns as any)?.[social.id] || ''}
                    onChange={(e) => handleInputChange(`sns.${social.id}`, e.target.value)}
                    placeholder={`@username or link`}
                    className="w-full bg-transparent border-none p-0 text-xs font-bold focus:ring-0 text-gray-600 dark:text-gray-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Basic Info & Experience */}
        <div className="lg:col-span-2 space-y-10">
          {/* Basic Info Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-10 border border-primary/5 shadow-sm space-y-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <h3 className="text-xl font-black tracking-tight">Basic Information</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Real Name */}
              <div className="md:col-span-2 space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Real Name (Confidential)</label>
                <div className="grid grid-cols-3 gap-4">
                  <input 
                    type="text" 
                    disabled={!isEditMode}
                    value={formData.realNameFirst || ''}
                    onChange={(e) => handleInputChange('realNameFirst', e.target.value)}
                    placeholder="First Name"
                    className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl p-4 font-bold text-sm"
                  />
                  <input 
                    type="text" 
                    disabled={!isEditMode}
                    value={formData.realNameMiddle || ''}
                    onChange={(e) => handleInputChange('realNameMiddle', e.target.value)}
                    placeholder="Middle Name"
                    className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl p-4 font-bold text-sm"
                  />
                  <input 
                    type="text" 
                    disabled={!isEditMode}
                    value={formData.realNameLast || ''}
                    onChange={(e) => handleInputChange('realNameLast', e.target.value)}
                    placeholder="Last Name"
                    className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl p-4 font-bold text-sm"
                  />
                </div>
              </div>

              {/* Birthday */}
              <div className="md:col-span-2 space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Date of Birth</label>
                <div className="grid grid-cols-3 gap-4">
                  <select 
                    disabled={!isEditMode}
                    value={bDay}
                    onChange={(e) => {
                      const newDate = new Date(birthdayDate);
                      newDate.setDate(parseInt(e.target.value));
                      handleInputChange('birthday', newDate.toISOString().split('T')[0]);
                    }}
                    className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl p-4 font-bold text-sm"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{d.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                  <select 
                    disabled={!isEditMode}
                    value={bMonth}
                    onChange={(e) => {
                      const newDate = new Date(birthdayDate);
                      newDate.setMonth(parseInt(e.target.value));
                      handleInputChange('birthday', newDate.toISOString().split('T')[0]);
                    }}
                    className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl p-4 font-bold text-sm"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i}>{m}</option>
                    ))}
                  </select>
                  <select 
                    disabled={!isEditMode}
                    value={bYear}
                    onChange={(e) => {
                      const newDate = new Date(birthdayDate);
                      newDate.setFullYear(parseInt(e.target.value));
                      handleInputChange('birthday', newDate.toISOString().split('T')[0]);
                    }}
                    className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl p-4 font-bold text-sm"
                  >
                    {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - 18 - i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] text-primary font-black uppercase tracking-tighter pl-2">
                  Format: {bDay.toString().padStart(2, '0')}. {MONTHS[bMonth]}. {bYear}.
                </p>
              </div>

              {/* Address & Phone */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Residential Address</label>
                <input 
                  type="text" 
                  disabled={!isEditMode}
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Street, City, Province"
                  className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl p-4 font-bold text-sm"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Phone Number</label>
                <input 
                  type="tel" 
                  disabled={!isEditMode}
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="09XX-XXX-XXXX"
                  className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl p-4 font-bold text-sm"
                />
              </div>

              {/* Venue Selection */}
              <div className="md:col-span-2 space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Venue Affiliation (소속 업체)</label>
                <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="size-14 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-primary">apartment</span>
                    </div>
                    <div>
                      <p className="text-sm font-black">{cca.venueName}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Current Affiliation</p>
                    </div>
                  </div>
                  {isEditMode && (
                    <select 
                      value={formData.venueId}
                      onChange={(e) => handleInputChange('venueId', e.target.value)}
                      className="bg-white dark:bg-zinc-800 border-none rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest shadow-sm"
                    >
                      {venues.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                {formData.venueId !== cca.venueId && (
                  <p className="text-[10px] text-red-500 font-black uppercase tracking-tighter pl-2 animate-pulse">
                    * 업체 변경은 현재 소속 업체 관리자의 승인이 필요합니다.
                  </p>
                )}
              </div>

              {/* Marital & Children */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Marital Status</label>
                <div className="flex gap-4">
                  {['Single', 'Married', 'Separated'].map(opt => (
                    <button 
                      key={opt}
                      disabled={!isEditMode}
                      onClick={() => handleInputChange('maritalStatus', opt)}
                      className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${formData.maritalStatus === opt ? 'bg-primary text-[#1b180d] border-primary shadow-lg shadow-primary/20' : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-500'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Children</label>
                <div className="flex gap-4">
                  {['None', '1', '2', '3+'].map(opt => (
                    <button 
                      key={opt}
                      disabled={!isEditMode}
                      onClick={() => handleInputChange('childrenStatus', opt)}
                      className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${formData.childrenStatus === opt ? 'bg-primary text-[#1b180d] border-primary shadow-lg shadow-primary/20' : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-500'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Selection */}
              <div className="md:col-span-2 space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Language (가능 언어)</label>
                <div className="flex flex-wrap gap-3">
                  {['ENGLISH', 'KOREAN', 'JAPANESE', 'CHINESE', 'ETC'].map(lang => {
                    const isSelected = (formData.languages || []).includes(lang);
                    return (
                      <button 
                        key={lang}
                        type="button"
                        disabled={!isEditMode}
                        onClick={() => {
                          const current = formData.languages || [];
                          const next = isSelected 
                            ? current.filter(l => l !== lang)
                            : [...current, lang];
                          handleInputChange('languages', next);
                        }}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${isSelected ? 'bg-primary text-[#1b180d] border-primary shadow-lg shadow-primary/20' : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-500'}`}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Password Change */}
              {isEditMode && (
                <div className="md:col-span-2 space-y-4 pt-4 border-t border-gray-100 dark:border-white/5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Change Password</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password to change"
                      className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl p-4 font-bold text-sm pr-12"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">lock</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Experience History Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-10 border border-primary/5 shadow-sm space-y-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-12 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined">history_edu</span>
                </div>
                <h3 className="text-xl font-black tracking-tight">Work Experience (Resume)</h3>
              </div>
              {isEditMode && (
                <button 
                  onClick={handleAddExperience}
                  className="size-10 bg-primary text-[#1b180d] rounded-full flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-110 transition-all"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              )}
            </div>

            <div className="space-y-6">
              {formData.experienceHistory?.map((exp, idx) => (
                <div key={idx} className="bg-gray-50 dark:bg-white/5 p-6 rounded-[2rem] border border-transparent hover:border-primary/10 transition-all space-y-6 relative group">
                  {isEditMode && (
                    <button 
                      onClick={() => {
                        const history = [...(formData.experienceHistory || [])];
                        history.splice(idx, 1);
                        handleInputChange('experienceHistory', history);
                      }}
                      className="absolute top-4 right-4 size-8 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-2">Join Date</label>
                      <input 
                        type="date" 
                        disabled={!isEditMode}
                        value={exp.joinDate}
                        onChange={(e) => handleUpdateExperience(idx, 'joinDate', e.target.value)}
                        className="w-full bg-white dark:bg-zinc-800 border-none rounded-xl p-3 text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-2">Leave Date</label>
                      <input 
                        type="date" 
                        disabled={!isEditMode}
                        value={exp.leaveDate}
                        onChange={(e) => handleUpdateExperience(idx, 'leaveDate', e.target.value)}
                        className="w-full bg-white dark:bg-zinc-800 border-none rounded-xl p-3 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1 space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-2">Venue Type</label>
                      <select 
                        disabled={!isEditMode}
                        value={exp.venueType}
                        onChange={(e) => handleUpdateExperience(idx, 'venueType', e.target.value as any)}
                        className="w-full bg-white dark:bg-zinc-800 border-none rounded-xl p-3 text-xs font-bold"
                      >
                        {['JTV', 'KTV', 'BAR', 'CASINO', 'GOLF', 'ETC'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-1 space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-2">Venue Name</label>
                      <input 
                        type="text" 
                        disabled={!isEditMode}
                        value={exp.venueName}
                        onChange={(e) => handleUpdateExperience(idx, 'venueName', e.target.value)}
                        placeholder="Venue Name"
                        className="w-full bg-white dark:bg-zinc-800 border-none rounded-xl p-3 text-xs font-bold"
                      />
                    </div>
                    <div className="md:col-span-1 space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-2">Grade/Position</label>
                      <input 
                        type="text" 
                        disabled={!isEditMode}
                        value={exp.grade}
                        onChange={(e) => handleUpdateExperience(idx, 'grade', e.target.value)}
                        placeholder="e.g. ACE / PRO"
                        className="w-full bg-white dark:bg-zinc-800 border-none rounded-xl p-3 text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {(!formData.experienceHistory || formData.experienceHistory.length === 0) && (
                <div className="py-12 border-2 border-dashed border-gray-100 dark:border-white/5 rounded-[2rem] flex flex-col items-center justify-center gap-4 text-gray-400">
                  <span className="material-symbols-outlined text-4xl">work_off</span>
                  <p className="text-xs font-bold uppercase tracking-widest">No experience history added</p>
                </div>
              )}
            </div>
          </div>

          {/* Special Notes Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-10 border border-primary/5 shadow-sm space-y-8">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined">description</span>
              </div>
              <h3 className="text-xl font-black tracking-tight">Special Notes (특이사항)</h3>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Confidential Notes for Admins</label>
              <textarea 
                disabled={!isEditMode}
                value={formData.specialNotes || ''}
                onChange={(e) => handleInputChange('specialNotes', e.target.value)}
                placeholder="Enter any special notes, health conditions, or requests..."
                className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-[2rem] p-6 font-medium text-sm focus:ring-2 ring-primary/20 h-40 resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* MBTI Popup */}
      {showMbtiPopup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowMbtiPopup(false)}></div>
          <div className="bg-white dark:bg-zinc-900 rounded-[3rem] p-10 w-full max-w-md relative animate-scale-in border border-primary/10">
            <h3 className="text-2xl font-black mb-8 text-center">Select Your MBTI</h3>
            <div className="grid grid-cols-4 gap-4">
              {MBTI_LIST.map(mbti => (
                <button 
                  key={mbti}
                  onClick={() => {
                    handleInputChange('mbti', mbti);
                    setShowMbtiPopup(false);
                  }}
                  className={`aspect-square rounded-2xl flex items-center justify-center text-xs font-black transition-all border ${formData.mbti === mbti ? 'bg-primary text-[#1b180d] border-primary shadow-lg shadow-primary/20' : 'bg-gray-50 dark:bg-white/5 border-transparent hover:border-primary/20'}`}
                >
                  {mbti}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowMbtiPopup(false)}
              className="w-full mt-8 py-4 bg-gray-100 dark:bg-white/5 rounded-2xl text-xs font-black uppercase tracking-widest"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Preview Popup */}
      {showPreview && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowPreview(false)}></div>
          <div className="bg-white dark:bg-zinc-950 rounded-[3rem] w-full max-w-2xl h-[80vh] relative animate-scale-in border border-primary/10 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
               <h3 className="text-xl font-black uppercase tracking-widest">Profile Preview</h3>
               <button onClick={() => setShowPreview(false)} className="size-10 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-10">
               <div className="flex flex-col items-center text-center gap-6">
                  <div className="size-32 rounded-full border-4 border-primary p-1 bg-white dark:bg-zinc-800 shadow-2xl">
                     <img src={formData.image || cca.image} className="size-full rounded-full object-cover" />
                  </div>
                  <div className="space-y-1">
                     <h2 className="text-3xl font-black">{formData.nickname || cca.name}</h2>
                     <p className="text-primary font-black uppercase tracking-widest text-[10px]">{cca.grade} • {cca.venueName}</p>
                  </div>
               </div>
               
               <div className="flex flex-col items-center gap-8">
                  {/* Stats Row */}
                  <div className="flex gap-10">
                    <div className="text-center">
                      <p className="text-sm font-black">{formData.mbti || '-'}</p>
                      <p className="text-[8px] text-gray-500 font-black uppercase tracking-tighter">MBTI</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black">{formData.zodiac?.split(' ')[0] || '-'}</p>
                      <p className="text-[8px] text-gray-500 font-black uppercase tracking-tighter">Zodiac</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black">{calculateAge(formData.birthday || '')}</p>
                      <p className="text-[8px] text-gray-500 font-black uppercase tracking-tighter">Age</p>
                    </div>
                  </div>

                  {/* Social Row */}
                  <div className="flex flex-wrap justify-center gap-6">
                    {Object.entries(formData.sns || {}).map(([key, val]) => val && (
                      <div key={key} className="text-center">
                         <p className="text-[10px] font-black text-black dark:text-white uppercase tracking-widest">{key}</p>
                      </div>
                    ))}
                  </div>

                  {/* Intro Row */}
                  <div className="max-w-md">
                    <p className="text-center italic text-sm text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                      "{formData.oneLineStory || cca.description}"
                    </p>
                  </div>
               </div>

               {/* Instagram Style Gallery */}
               <div className="space-y-4 pt-10 border-t border-gray-100 dark:border-white/5">
                  <div className="flex items-center justify-center gap-8 border-t border-black dark:border-white -mt-10 pt-4">
                    <div className="flex items-center gap-1.5 text-black dark:text-white">
                      <span className="material-symbols-outlined text-sm">grid_on</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">Posts</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <span className="material-symbols-outlined text-sm">movie</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">Reels</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <span className="material-symbols-outlined text-sm">assignment_ind</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">Tagged</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1 md:gap-2">
                    {galleryItems.length > 0 ? galleryItems.map((item) => (
                      <div key={item.id} className="aspect-square bg-gray-100 dark:bg-white/5 relative group cursor-pointer overflow-hidden">
                        <img 
                          src={item.url} 
                          className="size-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                           <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm fill-1">favorite</span>
                              <span className="text-xs font-bold">{item.likes || 0}</span>
                           </div>
                           <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm fill-1">chat_bubble</span>
                              <span className="text-xs font-bold">{item.commentsCount || 0}</span>
                           </div>
                        </div>
                      </div>
                    )) : (
                      [1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="aspect-square bg-gray-100 dark:bg-white/5 animate-pulse rounded-sm"></div>
                      ))
                    )}
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CCAProfileSettings;
