
import React, { useState, useEffect } from 'react';
import { MediaItem } from '../../types';
import { apiService } from '../../services/apiService';

const CCAGalleryManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'photo' | 'video'>('all');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Upload Form State
  const [uploadType, setUploadType] = useState<'photo' | 'video'>('photo');
  const [caption, setCaption] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const currentCcaId = 'c1'; // Mock current user

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getGallery(currentCcaId);
      setMediaItems(data);
    } catch (err) {
      console.error("Failed to load gallery", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (uploadType === 'photo' && !selectedFile) {
      alert("Please select a photo");
      return;
    }
    if (uploadType === 'video' && !videoUrl) {
      alert("Please enter a video link");
      return;
    }

    setIsUploading(true);
    try {
      let url = '';
      if (uploadType === 'photo' && selectedFile) {
        // Convert to Base64 (using uploadImage fallback or direct conversion)
        url = await apiService.uploadImage(selectedFile) || '';
      } else {
        url = videoUrl;
      }

      if (!url) throw new Error("Failed to get media URL");

      const result = await apiService.createGalleryItem({
        ccaId: currentCcaId,
        type: uploadType,
        url,
        caption
      });

      if (result.success) {
        setShowUploadModal(false);
        setCaption('');
        setVideoUrl('');
        setSelectedFile(null);
        setPreviewUrl(null);
        loadGallery();
      } else {
        alert("Upload failed: " + result.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    const success = await apiService.deleteGalleryItem(id);
    if (success) {
      setSelectedItem(null);
      loadGallery();
    } else {
      alert("Delete failed");
    }
  };

  const filteredMedia = activeTab === 'all' 
    ? mediaItems 
    : mediaItems.filter(m => m.type === activeTab);

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h3 className="text-3xl font-black tracking-tight">Media Feed</h3>
          <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Manage your visual branding</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="h-14 bg-primary text-[#1b180d] px-8 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all flex items-center gap-3"
        >
          <span className="material-symbols-outlined">add_a_photo</span>
          Upload New Media
        </button>
      </div>

      {/* Stats Summary */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-primary/5 text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Photos</p>
          <p className="text-2xl font-black text-primary">{mediaItems.filter(m => m.type === 'photo').length}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-primary/5 text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Videos</p>
          <p className="text-2xl font-black text-blue-500">{mediaItems.filter(m => m.type === 'video').length}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-primary/5 text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Engagement</p>
          <p className="text-2xl font-black text-purple-500">
            {mediaItems.reduce((acc, curr) => acc + (curr.likes || 0) + (curr.commentsCount || 0), 0)}
          </p>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="flex gap-4 border-b border-primary/10">
        {(['all', 'photo', 'video'] as const).map(t => (
          <button 
            key={t}
            onClick={() => setActiveTab(t)}
            className={`py-4 px-6 font-black text-xs uppercase tracking-widest border-b-2 transition-all ${activeTab === t ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-primary/50'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredMedia.length > 0 ? (
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
                  <div className="flex items-center gap-1.5"><span className="material-symbols-outlined fill-1">favorite</span> {item.likes || 0}</div>
                  <div className="flex items-center gap-1.5"><span className="material-symbols-outlined fill-1">chat_bubble</span> {item.commentsCount || 0}</div>
                </div>
                <span className="material-symbols-outlined text-4xl opacity-50">
                  {item.type === 'video' ? 'play_circle' : 'zoom_in'}
                </span>
              </div>

              {/* Type Icon Badge */}
              <div className="absolute top-4 right-4 size-8 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white/70">
                <span className="material-symbols-outlined text-[16px]">
                  {item.type === 'video' ? 'movie' : 'image'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center space-y-4 bg-gray-50 dark:bg-white/5 rounded-[3rem] border-2 border-dashed border-primary/10">
          <span className="material-symbols-outlined text-6xl text-gray-300">photo_library</span>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No media found in this category</p>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[3rem] p-8 md:p-10 shadow-2xl animate-scale-in border border-primary/10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black tracking-tight">Upload New Media</h3>
              <button onClick={() => setShowUploadModal(false)} className="size-10 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center"><span className="material-symbols-outlined">close</span></button>
            </div>

            <div className="space-y-6">
              {/* Type Selector */}
              <div className="flex gap-4">
                {(['photo', 'video'] as const).map(t => (
                  <button 
                    key={t}
                    onClick={() => setUploadType(t)}
                    className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${uploadType === t ? 'bg-primary text-[#1b180d] border-primary shadow-lg shadow-primary/20' : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-500'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Media Input */}
              {uploadType === 'photo' ? (
                <div className="space-y-4">
                  <label className="block aspect-video bg-gray-50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-primary/10 cursor-pointer overflow-hidden relative group">
                    {previewUrl ? (
                      <img src={previewUrl} className="size-full object-cover" />
                    ) : (
                      <div className="size-full flex flex-col items-center justify-center gap-2 text-gray-400">
                        <span className="material-symbols-outlined text-4xl">add_photo_alternate</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">Select Image</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                  <p className="text-[10px] text-gray-400 font-bold text-center uppercase tracking-tighter">* Images will be saved as Base64 (max 700KB)</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Video Link (YouTube/Vimeo/Direct)</label>
                  <input 
                    type="text" 
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl p-4 font-bold text-sm focus:ring-2 ring-primary/20"
                  />
                </div>
              )}

              {/* Caption */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Caption</label>
                <textarea 
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Tell a story about this media..."
                  className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl p-4 font-bold text-sm focus:ring-2 ring-primary/20 resize-none h-24"
                />
              </div>

              <button 
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full py-5 bg-primary text-[#1b180d] rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isUploading ? (
                  <div className="size-5 border-2 border-[#1b180d] border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined">cloud_upload</span>
                    Publish Media
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed View Popup */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-5xl rounded-[3rem] overflow-hidden flex flex-col lg:flex-row h-[80vh] shadow-2xl animate-fade-in">
            {/* Visual Part */}
            <div className="flex-[1.5] bg-black relative">
              {selectedItem.type === 'video' ? (
                <div className="size-full flex items-center justify-center">
                  {/* Simple iframe for video links, or just a placeholder if it's not a direct link */}
                  {selectedItem.url.includes('youtube.com') || selectedItem.url.includes('youtu.be') ? (
                    <iframe 
                      src={selectedItem.url.replace('watch?v=', 'embed/')} 
                      className="w-full aspect-video"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <video src={selectedItem.url} controls className="max-h-full max-w-full" />
                  )}
                </div>
              ) : (
                <img src={selectedItem.url} className="size-full object-contain" />
              )}
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
                <button 
                  onClick={() => handleDelete(selectedItem.id)}
                  className="size-10 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium leading-relaxed">{selectedItem.caption}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {new Date(selectedItem.date).toLocaleDateString()}
                  </p>
                </div>

                <div className="space-y-6 pt-6 border-t border-primary/5">
                   <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Engagement stats are simulated in this preview</p>
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
                 <p className="text-xs font-black mb-4">{selectedItem.likes || 0} Likes</p>
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
