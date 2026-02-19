
import React, { useState } from 'react';
import { MediaItem } from '../../types';

const MOCK_MEDIA: MediaItem[] = [
  { id: 'm1', type: 'photo', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800', caption: '오늘 밤도 화이팅! ✨ 우리 그랜드 팰리스에서 만나요.', likes: 124, shares: 12, commentsCount: 5, date: '2023.11.20' },
  { id: 'm2', type: 'photo', url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=800', caption: '새로 장만한 드레스 👗 어때요? 피드백 환영!', likes: 98, shares: 5, commentsCount: 2, date: '2023.11.19' },
  { id: 'm3', type: 'video', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=800', caption: '노래 연습 중 🎤 주말 공연 기대해주세요.', likes: 256, shares: 45, commentsCount: 15, date: '2023.11.18' },
  { id: 'm4', type: 'photo', url: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=800', caption: '깜짝 선물 고마워요! 💖 감동입니다.', likes: 180, shares: 8, commentsCount: 10, date: '2023.11.17' },
  { id: 'm5', type: 'audio', url: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=800', caption: '목소리만 들어보세요. 🎧 따뜻한 인사를 전합니다.', likes: 60, shares: 20, commentsCount: 4, date: '2023.11.16' },
  { id: 'm6', type: 'photo', url: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?q=80&w=800', caption: '클락 여행 중... ✈️ 힐링하고 올게요.', likes: 210, shares: 3, commentsCount: 7, date: '2023.11.15' },
];

const CCAGalleryManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'photo' | 'video' | 'audio'>('all');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  const filteredMedia = activeTab === 'all' 
    ? MOCK_MEDIA 
    : MOCK_MEDIA.filter(m => m.type === activeTab);

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h3 className="text-3xl font-black tracking-tight">Media Feed</h3>
          <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Manage your visual branding</p>
        </div>
        <button className="h-14 bg-primary text-[#1b180d] px-8 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all flex items-center gap-3">
          <span className="material-symbols-outlined">add_a_photo</span>
          Upload New Media
        </button>
      </div>

      {/* Stats Summary */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-primary/5 text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Likes</p>
          <p className="text-2xl font-black text-primary">1,240</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-primary/5 text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Shares</p>
          <p className="text-2xl font-black text-blue-500">328</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-primary/5 text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Embeds</p>
          <p className="text-2xl font-black text-purple-500">84</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-primary/5 text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Comments</p>
          <p className="text-2xl font-black text-green-500">56</p>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="flex gap-4 border-b border-primary/10">
        {(['all', 'photo', 'video', 'audio'] as const).map(t => (
          <button 
            key={t}
            onClick={() => setActiveTab(t)}
            className={`py-4 px-6 font-black text-xs uppercase tracking-widest border-b-2 transition-all ${activeTab === t ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-primary/50'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Insta-style Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {filteredMedia.map(item => (
          <div 
            key={item.id} 
            onClick={() => setSelectedItem(item)}
            className="group relative aspect-square rounded-[2rem] overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl transition-all border border-primary/5"
          >
            <img src={item.url} className="size-full object-cover transition-transform duration-700 group-hover:scale-110" />
            
            {/* Overlay Info */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white gap-4">
              <div className="flex gap-6">
                <div className="flex items-center gap-1.5"><span className="material-symbols-outlined fill-1">favorite</span> {item.likes}</div>
                <div className="flex items-center gap-1.5"><span className="material-symbols-outlined fill-1">chat_bubble</span> {item.commentsCount}</div>
              </div>
              <span className="material-symbols-outlined text-4xl opacity-50">
                {item.type === 'video' ? 'play_circle' : item.type === 'audio' ? 'graphic_eq' : 'zoom_in'}
              </span>
            </div>

            {/* Type Icon Badge */}
            <div className="absolute top-4 right-4 size-8 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white/70">
              <span className="material-symbols-outlined text-[16px]">
                {item.type === 'video' ? 'movie' : item.type === 'audio' ? 'music_note' : 'image'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed View Popup */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-5xl rounded-[3rem] overflow-hidden flex flex-col lg:flex-row h-[80vh] shadow-2xl animate-fade-in">
            {/* Visual Part */}
            <div className="flex-[1.5] bg-black relative">
              <img src={selectedItem.url} className="size-full object-contain" />
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-6 left-6 size-12 bg-white/10 backdrop-blur-md rounded-full text-white flex items-center justify-center hover:bg-white/20"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            {/* Interaction Part */}
            <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900 border-l border-primary/5">
              <div className="p-8 border-b border-primary/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200/200" className="size-10 rounded-full border border-primary/20" />
                  <span className="font-black text-lg">Yumi Kim</span>
                </div>
                <button className="material-symbols-outlined">more_horiz</button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium leading-relaxed">{selectedItem.caption}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{selectedItem.date}</p>
                </div>

                {/* Comment Mock Section */}
                <div className="space-y-6 pt-6 border-t border-primary/5">
                   {[1, 2].map(i => (
                     <div key={i} className="flex gap-4">
                        <img src={`https://picsum.photos/100/100?random=${i+20}`} className="size-8 rounded-full" />
                        <div className="flex-1">
                           <p className="text-xs font-black">Fan_Account_{i} <span className="text-gray-400 font-bold ml-2">너무 예뻐요! 💖</span></p>
                           <div className="flex gap-4 mt-2 text-[10px] font-black text-gray-400 uppercase">
                              <button>Reply</button>
                              <button>Delete</button>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
              </div>

              <div className="p-8 bg-gray-50 dark:bg-white/5 border-t border-primary/5">
                 <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-4">
                       <span className="material-symbols-outlined text-primary fill-1">favorite</span>
                       <span className="material-symbols-outlined">chat_bubble</span>
                       <span className="material-symbols-outlined">share</span>
                    </div>
                    <span className="material-symbols-outlined">bookmark</span>
                 </div>
                 <p className="text-xs font-black mb-4">{selectedItem.likes} Likes</p>
                 <div className="flex gap-3">
                    <input type="text" placeholder="Write a comment..." className="flex-1 bg-white dark:bg-zinc-800 border-primary/10 rounded-xl px-4 py-2 text-xs" />
                    <button className="text-primary font-black text-xs uppercase tracking-widest">Post</button>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CCAGalleryManager;
