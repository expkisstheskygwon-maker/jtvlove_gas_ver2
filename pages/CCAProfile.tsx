import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { CCA, MediaItem } from '../types';
import { useAuth } from '../contexts/AuthContext';

const ZODIAC_SIGNS = [
  { en: 'Aries', ko: '양자리', start: '03-21', end: '04-19' },
  { en: 'Taurus', ko: '황소자리', start: '04-20', end: '05-20' },
  { en: 'Gemini', ko: '쌍둥이자리', start: '05-21', end: '06-20' },
  { en: 'Cancer', ko: '게자리', start: '06-21', end: '07-22' },
  { en: 'Leo', ko: '사자자리', start: '07-23', end: '08-22' },
  { en: 'Virgo', ko: '처녀자리', start: '08-23', end: '09-22' },
  { en: 'Libra', ko: '천칭자리', start: '09-23', end: '10-22' },
  { en: 'Scorpio', ko: '전갈자리', start: '10-23', end: '11-21' },
  { en: 'Sagittarius', ko: '궁수자리', start: '11-22', end: '12-21' },
  { en: 'Capricorn', ko: '염소자리', start: '12-22', end: '01-19' },
  { en: 'Aquarius', ko: '물병자리', start: '01-20', end: '02-18' },
  { en: 'Pisces', ko: '물고기자리', start: '02-19', end: '03-20' }
];

const calculateZodiac = (birthday: string) => {
  if (!birthday) return { en: 'N/A', ko: '' };
  const date = new Date(birthday);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const mmdd = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

  const sign = ZODIAC_SIGNS.find(s => {
    if (s.start <= s.end) {
      return mmdd >= s.start && mmdd <= s.end;
    } else {
      return mmdd >= s.start || mmdd <= s.end;
    }
  });
  return sign ? { en: sign.en, ko: sign.ko } : { en: 'N/A', ko: '' };
};

const calculateAge = (birthday: string) => {
  if (!birthday) return '??';
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const CCAProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cca, setCca] = useState<CCA | null>(null);
  const [gallery, setGallery] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestForm, setRequestForm] = useState({
    customerName: '',
    customerContact: '',
    customerNote: '',
    preferredDate: new Date().toISOString().split('T')[0],
    preferredTime: '20:00',
    groupSize: 1
  });
  const [lightboxMedia, setLightboxMedia] = useState<MediaItem | null>(null);
  // Like state
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  // Message state
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [msgContent, setMsgContent] = useState('');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState(false);

  // Prevent background scrolling when modals are open
  useEffect(() => {
    if (lightboxMedia || showRequestModal || showMsgModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [lightboxMedia, showRequestModal, showMsgModal]);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const [ccaData, galleryData] = await Promise.all([
          apiService.getCCAById(id),
          apiService.getGallery(id)
        ]);
        setCca(ccaData);
        setGallery(galleryData);
      } catch (error) {
        console.error('Failed to load CCA profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id]);

  // Load like status
  useEffect(() => {
    if (!id) return;
    apiService.getCCALikes(id, user?.id).then(data => {
      setLikeCount(data.count);
      setIsLiked(data.liked);
    });
  }, [id, user?.id]);

  const handleToggleLike = async () => {
    if (!user) {
      alert('좋아요를 누르려면 로그인이 필요합니다.');
      navigate('/login', { state: { returnTo: `/ccas/${id}` } });
      return;
    }
    if (!id || likeLoading) return;
    setLikeLoading(true);
    const result = await apiService.toggleCCALike(id, user.id);
    setIsLiked(result.liked);
    setLikeCount(result.count);
    setLikeLoading(false);
  };

  const handleSendMessage = async () => {
    if (!cca || !user || !msgContent.trim()) return;
    setMsgSending(true);
    const result = await apiService.sendMessage({
      sender_id: user.id,
      sender_type: 'user',
      sender_name: user.nickname || user.realName || '',
      receiver_id: cca.id,
      receiver_type: 'cca',
      receiver_name: cca.nickname || cca.name,
      subject: msgSubject || `${user.nickname || '고객'}님의 메시지`,
      content: msgContent
    });
    setMsgSending(false);
    if (result.success) {
      setMsgSuccess(true);
      setTimeout(() => {
        setShowMsgModal(false);
        setMsgSuccess(false);
        setMsgContent('');
        setMsgSubject('');
      }, 2000);
    } else {
      alert('메시지 전송 실패: ' + (result.error || ''));
    }
  };

  const handleOpenRequestModal = () => {
    if (!user) {
      alert('지명 요청 기능을 이용하시려면 로그인이 필요합니다.\n로그인 페이지로 이동합니다.');
      navigate('/login', { state: { returnTo: `/ccas/${id}` } });
      return;
    }

    // 만약 유저 이름이나 연락처가 있다면 기본 폼에 값 넣어주기
    setRequestForm(prev => ({
      ...prev,
      customerName: prev.customerName || user.nickname || user.realName || '',
      customerContact: prev.customerContact || (user as any).phone || ''
    }));
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async () => {
    if (!cca || !requestForm.customerName) {
      alert('이름을 입력해주세요.');
      return;
    }
    setRequestSubmitting(true);
    try {
      const result = await apiService.createCCARequest({
        cca_id: cca.id,
        venue_id: cca.venueId || '',
        cca_name: cca.nickname || cca.name,
        venue_name: cca.venueName || '',
        customer_name: requestForm.customerName,
        customer_contact: requestForm.customerContact,
        customer_note: requestForm.customerNote,
        preferred_date: requestForm.preferredDate,
        preferred_time: requestForm.preferredTime,
        group_size: requestForm.groupSize,
        user_id: user?.id || ''
      });
      if (result.success) {
        setRequestSuccess(true);
        setTimeout(() => {
          setShowRequestModal(false);
          setRequestSuccess(false);
          setRequestForm({ customerName: '', customerContact: '', customerNote: '', preferredDate: new Date().toISOString().split('T')[0], preferredTime: '20:00', groupSize: 1 });
        }, 2000);
      } else {
        alert('요청 실패: ' + (result.error || '알 수 없는 오류'));
      }
    } catch (err) {
      console.error(err);
      alert('요청 중 오류가 발생했습니다.');
    } finally {
      setRequestSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background-light dark:bg-background-dark">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black uppercase tracking-widest text-xs text-gray-400">Loading Profile...</p>
      </div>
    );
  }

  if (!cca) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background-light dark:bg-background-dark">
        <span className="material-symbols-outlined text-6xl text-gray-300">person_off</span>
        <p className="font-black uppercase tracking-widest text-sm text-gray-400">CCA Not Found</p>
        <button onClick={() => navigate('/ccas')} className="px-8 py-3 bg-primary text-[#1b180d] rounded-xl font-black text-xs uppercase tracking-widest">Back to Directory</button>
      </div>
    );
  }

  const zodiac = calculateZodiac(cca.birthday || '');

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen pb-24 md:pb-20">
      {/* Mobile-only sticky header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10 px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <h1 className="text-xs font-black uppercase tracking-[0.3em] text-primary">프로필 상세</h1>
        <div className="size-10"></div>
      </div>

      <div className="max-w-7xl mx-auto px-0 md:px-8 lg:px-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 md:gap-12 items-start">

          {/* Left Side: Profile Photo */}
          <div className="lg:col-span-5 md:sticky md:top-24 space-y-6">
            <div className="relative aspect-[4/5] md:aspect-[3/4] lg:aspect-[4/5] md:rounded-3xl overflow-hidden shadow-2xl group">
              <img src={cca.image} alt={cca.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:hidden"></div>

              {/* Mobile Floating Overlay Info */}
              <div className="absolute bottom-6 left-6 right-6 md:hidden text-white space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-4xl font-extrabold tracking-tighter">{cca.nickname || cca.name}</h2>
                  <span className="material-symbols-outlined text-primary fill-1">verified</span>
                </div>
                <p className="text-sm font-bold opacity-80">{cca.venueName}</p>
              </div>
            </div>

            {/* PC Display Stats Quick View - FIXED: 나이 중복 제거, 대신 신장/체형 등 다른 정보 */}
            <div className="hidden md:grid grid-cols-3 gap-4">
              <div className="bg-white dark:bg-zinc-800/50 p-6 rounded-2xl border border-primary/5 text-center space-y-2 shadow-sm">
                <span className="material-symbols-outlined text-primary block">location_on</span>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">소속 JTV</p>
                <p className="text-sm font-black">{cca.venueName}</p>
              </div>
              <div className="bg-white dark:bg-zinc-800/50 p-6 rounded-2xl border border-primary/5 text-center space-y-2 shadow-sm">
                <span className="material-symbols-outlined text-primary block">star</span>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">평점</p>
                <p className="text-sm font-black">{cca.rating || '0'} / 5</p>
              </div>
              <div className="bg-white dark:bg-zinc-800/50 p-6 rounded-2xl border border-primary/5 text-center space-y-2 shadow-sm">
                <span className="material-symbols-outlined text-primary block">translate</span>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">언어</p>
                <p className="text-sm font-black">{(cca.languages || []).join(', ') || 'N/A'}</p>
              </div>
            </div>

            {/* SNS Links */}
            {cca.sns && Object.values(cca.sns).some(v => v) && (
              <div className="hidden md:flex flex-wrap gap-3 justify-center">
                {cca.sns.instagram && <a href={`https://instagram.com/${cca.sns.instagram}`} target="_blank" rel="noopener noreferrer" className="size-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center border border-primary/10 hover:bg-primary/10 transition-colors"><img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" className="size-5" alt="IG" /></a>}
                {cca.sns.facebook && <a href={`https://facebook.com/${cca.sns.facebook}`} target="_blank" rel="noopener noreferrer" className="size-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center border border-primary/10 hover:bg-primary/10 transition-colors"><img src="https://cdn-icons-png.flaticon.com/512/124/124010.png" className="size-5" alt="FB" /></a>}
                {cca.sns.tiktok && <a href={`https://tiktok.com/@${cca.sns.tiktok}`} target="_blank" rel="noopener noreferrer" className="size-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center border border-primary/10 hover:bg-primary/10 transition-colors"><img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" className="size-5" alt="TT" /></a>}
                {cca.sns.telegram && <a href={`https://t.me/${cca.sns.telegram}`} target="_blank" rel="noopener noreferrer" className="size-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center border border-primary/10 hover:bg-primary/10 transition-colors"><img src="https://cdn-icons-png.flaticon.com/512/2111/2111646.png" className="size-5" alt="TG" /></a>}
              </div>
            )}

            {/* PC Desktop CTA - FIXED: 문구 변경 + 기능 연결 */}
            <div className="hidden md:block">
              <button
                onClick={handleOpenRequestModal}
                className="w-full py-6 bg-primary text-[#1b180d] rounded-2xl font-black text-lg tracking-tight shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 uppercase"
              >
                <span className="material-symbols-outlined font-black">calendar_month</span>
                지금 지명하기 (Request)
              </button>
            </div>
          </div>

          {/* Right Side: Detailed Content */}
          <div className="lg:col-span-7 px-6 py-10 md:px-0 md:py-0 space-y-12">

            {/* Name and Rating Block - Desktop Only */}
            <div className="hidden md:block space-y-4">
              <div className="flex items-center gap-4">
                <h1 className="text-6xl font-extrabold tracking-tighter">{cca.nickname || cca.name}</h1>
                <div className="bg-primary/10 text-primary px-4 py-2 rounded-2xl flex items-center gap-2">
                  <span className="material-symbols-outlined fill-1 text-2xl">star</span>
                  <span className="text-2xl font-black">{cca.rating}</span>
                </div>
                {/* Like Button */}
                <button
                  onClick={handleToggleLike}
                  disabled={likeLoading}
                  className={`px-4 py-2 rounded-2xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 ${isLiked ? 'bg-pink-500/15 text-pink-500' : 'bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-pink-400'}`}
                >
                  <span className={`material-symbols-outlined text-2xl ${isLiked ? 'fill-1' : ''}`}>favorite</span>
                  <span className="text-lg font-black">{likeCount}</span>
                </button>
              </div>
              <div className="flex items-center gap-6">
                <p className="text-xl font-bold text-gray-500 flex items-center gap-2 italic">
                  <span className="material-symbols-outlined text-primary">location_on</span>
                  <span className="text-[#1b180d] dark:text-white not-italic underline decoration-primary underline-offset-4">{cca.venueName}</span> 전속
                </p>
                {/* FIXED: oneLineStory는 여기에만 표시 */}
                {cca.oneLineStory && (
                  <p className="text-lg font-medium text-primary italic">"{cca.oneLineStory}"</p>
                )}
              </div>
            </div>

            {/* Bento Info Grid - FIXED: Zodiac 영문/한글 줄바꿈 + 글씨 크기 조절 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-3xl border border-primary/5 space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Age</p>
                <p className="text-lg font-black">{calculateAge(cca.birthday || '')} Years</p>
              </div>
              <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-3xl border border-primary/5 space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">MBTI</p>
                <p className="text-lg font-black uppercase">{cca.mbti || 'N/A'}</p>
              </div>
              <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-3xl border border-primary/5 space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Zodiac</p>
                <p className="text-sm font-black leading-tight">{zodiac.en}</p>
                {zodiac.ko && <p className="text-xs font-bold text-gray-400">({zodiac.ko})</p>}
              </div>
              <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-3xl border border-primary/5 space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Marital</p>
                <p className="text-lg font-black">{cca.maritalStatus || 'Single'}</p>
              </div>
            </div>

            {/* Section: Introduction - FIXED: description만 표시 (oneLineStory 중복 제거) */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                <h3 className="text-2xl font-extrabold tracking-tight">인사말</h3>
              </div>
              <div className="bg-white dark:bg-zinc-900/50 p-8 rounded-3xl border border-primary/10 shadow-sm leading-relaxed text-lg md:text-xl text-gray-600 dark:text-gray-300 italic font-medium relative">
                "{cca.description || cca.oneLineStory || '안녕하세요!'}"
                {/* Message Button */}
                <button
                  onClick={() => {
                    if (!user) {
                      alert('메시지를 보내려면 로그인이 필요합니다.');
                      navigate('/login', { state: { returnTo: `/ccas/${id}` } });
                      return;
                    }
                    setShowMsgModal(true);
                  }}
                  className="absolute bottom-4 right-4 flex items-center gap-2 px-5 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-all text-sm font-black not-italic"
                >
                  <span className="material-symbols-outlined text-lg">mail</span>
                  메시지 보내기
                </button>
              </div>
            </div>

            {/* Section: Lifestyle & Habits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-3xl border border-primary/5 flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">local_bar</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase">Drinking</p>
                  <p className="text-sm font-black">{cca.drinking || 'Social'}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-3xl border border-primary/5 flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">smoking_rooms</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase">Smoking</p>
                  <p className="text-sm font-black">{cca.smoking || 'No'}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-3xl border border-primary/5 flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">pets</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase">Pets</p>
                  <p className="text-sm font-black">{cca.pets || 'None'}</p>
                </div>
              </div>
            </div>

            {/* Section: Specialties */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                <h3 className="text-2xl font-extrabold tracking-tight">특징 / 특기</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {(cca.specialties || []).map(s => (
                  <div key={s} className="bg-primary/5 border border-primary/20 px-6 py-3 rounded-2xl flex items-center justify-center text-center">
                    <span className="text-xs font-black text-primary uppercase tracking-tighter">{s}</span>
                  </div>
                ))}
                {(!cca.specialties || cca.specialties.length === 0) && <p className="text-gray-400 italic">No specialties listed.</p>}
              </div>
            </div>

            {/* Section: Gallery - FIXED: 비디오 재생 기능 추가 */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                  <h3 className="text-2xl font-extrabold tracking-tight uppercase">Gallery</h3>
                </div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{gallery.length} Items</span>
              </div>

              {gallery.length > 0 ? (
                <div className="columns-2 md:columns-3 gap-4 space-y-4">
                  {gallery.map((item) => (
                    <div
                      key={item.id}
                      className="break-inside-avoid relative group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer"
                      onClick={() => setLightboxMedia(item)}
                    >
                      {item.type === 'photo' ? (
                        <img src={item.url} alt={item.caption || 'Gallery'} className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="aspect-video bg-zinc-900 flex items-center justify-center relative overflow-hidden">
                          <video src={item.url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-5xl drop-shadow-lg">play_circle</span>
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                        <p className="text-white text-xs font-bold line-clamp-2">{item.caption}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 bg-white dark:bg-zinc-900/50 rounded-[3rem] border border-dashed border-primary/20 flex flex-col items-center justify-center gap-4">
                  <span className="material-symbols-outlined text-4xl text-gray-300">photo_library</span>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No media uploaded yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom CTA - FIXED: 문구 변경 + 기능 연결 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-background-dark/80 backdrop-blur-xl border-t border-primary/10 px-6 py-4 z-50">
        <button
          onClick={handleOpenRequestModal}
          className="w-full bg-primary text-[#1b180d] py-5 rounded-2xl font-black text-lg tracking-tight shadow-2xl shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase"
        >
          <span className="material-symbols-outlined font-black">calendar_month</span>
          지금 지명하기 (Request)
        </button>
      </div>

      {/* Media Lightbox */}
      {lightboxMedia && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl" onClick={() => setLightboxMedia(null)}>
          <button className="absolute top-6 right-6 size-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
          <div className="w-full h-full max-w-5xl max-h-[90vh] flex flex-col items-center justify-center relative" onClick={(e) => e.stopPropagation()}>
            {lightboxMedia.type === 'photo' ? (
              <img src={lightboxMedia.url} alt={lightboxMedia.caption || ''} className="max-w-full max-h-full w-auto object-contain rounded-2xl shadow-2xl" />
            ) : (
              <video src={lightboxMedia.url} controls autoPlay className="max-w-full max-h-full w-auto object-contain rounded-2xl shadow-2xl" />
            )}
            {lightboxMedia.caption && (
              <p className="text-center text-white/70 text-sm font-bold mt-4 shrink-0">{lightboxMedia.caption}</p>
            )}
          </div>
        </div>
      )}

      {/* Nomination Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-10">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => !requestSubmitting && setShowRequestModal(false)}></div>
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 shadow-2xl z-10 border border-primary/10 animate-scale-in relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>

            {requestSuccess ? (
              <div className="text-center py-12 relative z-10">
                <div className="size-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="material-symbols-outlined text-green-500 text-4xl">check_circle</span>
                </div>
                <h3 className="text-2xl font-black mb-2">지명 요청 완료!</h3>
                <p className="text-gray-500">업체 관리자와 {cca.nickname || cca.name}님에게 전달됩니다.</p>
              </div>
            ) : (
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">지명 요청</h3>
                    <p className="text-sm font-bold text-primary mt-1">{cca.nickname || cca.name} · {cca.venueName}</p>
                  </div>
                  <button onClick={() => setShowRequestModal(false)} className="size-10 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center hover:bg-primary/10 transition-colors">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">이름 *</label>
                    <input
                      type="text"
                      value={requestForm.customerName}
                      onChange={(e) => setRequestForm({ ...requestForm, customerName: e.target.value })}
                      placeholder="예약자 성함"
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 font-bold text-sm focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">연락처 (카카오/전화/텔레그램)</label>
                    <input
                      type="text"
                      value={requestForm.customerContact}
                      onChange={(e) => setRequestForm({ ...requestForm, customerContact: e.target.value })}
                      placeholder="연락 가능한 수단"
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 font-bold text-sm focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">희망 날짜</label>
                      <input
                        type="date"
                        value={requestForm.preferredDate}
                        onChange={(e) => setRequestForm({ ...requestForm, preferredDate: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-3 py-4 font-bold text-xs focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">시간</label>
                      <select
                        value={requestForm.preferredTime}
                        onChange={(e) => setRequestForm({ ...requestForm, preferredTime: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-3 py-4 font-bold text-xs focus:border-primary outline-none transition-all appearance-none"
                      >
                        {Array.from({ length: 12 }, (_, i) => {
                          const h = (18 + i) % 24;
                          return <option key={h} value={`${h.toString().padStart(2, '0')}:00`}>{h.toString().padStart(2, '0')}:00</option>;
                        })}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">인원</label>
                      <input
                        type="number"
                        min="1"
                        value={requestForm.groupSize}
                        onChange={(e) => setRequestForm({ ...requestForm, groupSize: parseInt(e.target.value) || 1 })}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-3 py-4 font-bold text-xs text-center focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">요청 사항 / 메모</label>
                    <textarea
                      rows={3}
                      value={requestForm.customerNote}
                      onChange={(e) => setRequestForm({ ...requestForm, customerNote: e.target.value })}
                      placeholder="요청 사항이 있으시면 입력해주세요..."
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 font-bold text-sm focus:border-primary outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSubmitRequest}
                  disabled={requestSubmitting || !requestForm.customerName}
                  className="w-full py-5 bg-primary text-[#1b180d] rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {requestSubmitting ? (
                    <div className="size-5 border-2 border-[#1b180d] border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">send</span>
                      지명 요청 보내기
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMsgModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-lg" onClick={() => setShowMsgModal(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {msgSuccess ? (
              <div className="py-20 flex flex-col items-center gap-4 animate-fade-in">
                <div className="size-20 bg-green-500/10 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-500 text-4xl">check_circle</span>
                </div>
                <p className="text-lg font-black">메시지가 전송되었습니다!</p>
              </div>
            ) : (
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">mail</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-black">{cca?.nickname || cca?.name}에게 메시지</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Direct Message</p>
                    </div>
                  </div>
                  <button onClick={() => setShowMsgModal(false)} className="size-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">제목</label>
                  <input
                    type="text"
                    value={msgSubject}
                    onChange={(e) => setMsgSubject(e.target.value)}
                    placeholder="메시지 제목 (선택사항)"
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 font-bold text-sm focus:border-primary outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">내용 *</label>
                  <textarea
                    rows={5}
                    value={msgContent}
                    onChange={(e) => setMsgContent(e.target.value)}
                    placeholder="메시지 내용을 입력하세요..."
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 font-bold text-sm focus:border-primary outline-none transition-all resize-none"
                  />
                </div>

                <button
                  onClick={handleSendMessage}
                  disabled={msgSending || !msgContent.trim()}
                  className="w-full py-5 bg-primary text-[#1b180d] rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {msgSending ? (
                    <div className="size-5 border-2 border-[#1b180d] border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">send</span>
                      메시지 보내기
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CCAProfile;
