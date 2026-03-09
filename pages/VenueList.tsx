
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { Venue } from '../types'; // assuming types exist from other usages
import { VENUES as MOCK_VENUES } from '../constants';

const VenueList: React.FC = () => {
  const [activeTab, setActiveTab] = useState('ALL');
  const regions = ['ALL', 'Manila', 'Clark/Angeles', 'Cebu', 'Others'];

  const [venues, setVenues] = useState<any[]>([]);
  const [heroSettings, setHeroSettings] = useState({
    image: MOCK_VENUES[0]?.image || '',
    title: '이달의 추천 JTV',
    subtitle: '최고의 서비스와 품격을 보장합니다.'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedVenues, settings] = await Promise.all([
          apiService.getVenues(),
          apiService.getSiteSettings()
        ]);

        setVenues(fetchedVenues || []);

        setHeroSettings({
          image: settings?.venues_hero_image || MOCK_VENUES[0]?.image || '',
          title: settings?.venues_hero_title || '이달의 추천 JTV',
          subtitle: settings?.venues_hero_subtitle || '최고의 서비스와 품격을 보장합니다.'
        });
      } catch (err) {
        console.error("Failed to load venues page data", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // activeTab에 따른 필터링 (Others인 경우 정의된 필터가 아닌 나머지를 보여줌)
  const filteredVenues = venues.filter(venue => {
    if (activeTab === 'ALL') return true;

    const region = (venue.region || '').toUpperCase();
    const tabUpper = activeTab.toUpperCase();

    if (activeTab === 'Others') {
      // Manila, Clark, Angeles, Cebu 중 하나라도 포함되지 않은 것들
      return !['MANILA', 'CLARK', 'ANGELES', 'CEBU'].some(r => region.includes(r));
    }

    if (activeTab === 'Clark/Angeles') {
      return region.includes('CLARK') || region.includes('ANGELES');
    }

    return region.includes(tabUpper);
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="size-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black uppercase tracking-widest text-primary">Loading Venues...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full pb-24 animate-fade-in">
      {/* Hero */}
      <div className="px-4 py-6">
        <div className="relative h-[220px] md:h-[400px] rounded-2xl overflow-hidden shadow-2xl bg-zinc-900 border border-white/5">
          {heroSettings.image && (
            <img src={heroSettings.image} alt="Venue Hero" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-8">
            <span className="bg-primary text-[#1b180d] text-[10px] font-bold px-3 py-1 rounded-full w-fit mb-3 uppercase tracking-wider">Premium Selection</span>
            <h2 className="text-white text-3xl md:text-5xl font-extrabold leading-tight">{heroSettings.title}</h2>
            <p className="text-white/80 text-sm md:text-xl mt-2">{heroSettings.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Region Tabs */}
      <div className="mt-8 border-b border-primary/10 px-4">
        <div className="flex gap-8 overflow-x-auto hide-scrollbar">
          {regions.map(region => (
            <button
              key={region}
              onClick={() => setActiveTab(region)}
              className={`py-4 font-bold text-sm whitespace-nowrap transition-all border-b-2 ${activeTab === region ? 'text-primary border-primary scale-110' : 'text-gray-400 border-transparent hover:text-primary/50'}`}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      {/* Venue Grid */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
        {filteredVenues.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 font-bold">
            해당 지역에 등록된 업소가 없습니다.
          </div>
        ) : (
          filteredVenues.map(venue => {
            let tags = [];
            try { tags = typeof venue.tags === 'string' ? JSON.parse(venue.tags) : (venue.tags || []); } catch (e) { }

            return (
              <Link to={`/venues/${venue.id}`} key={venue.id} className="bg-white dark:bg-zinc-900/50 rounded-2xl overflow-hidden shadow-sm border border-primary/5 group hover:shadow-2xl transition-all duration-300">
                <div className="relative aspect-video overflow-hidden bg-zinc-800">
                  {venue.image ? (
                    <img src={venue.image} alt={venue.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-600">NO IMAGE</div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1 shadow-xl">
                    <span className="material-symbols-outlined text-primary text-[16px] fill-1">star</span>
                    <span className="text-xs font-bold text-gray-800">{venue.rating || 0}</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white group-hover:text-primary transition-colors">{venue.name}</h3>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{typeof venue.region === 'string' ? venue.region.split(',')[0] : ''}</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 line-clamp-2 leading-relaxed">{venue.description || 'Description not available.'}</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(tags) && tags.map((tag: string) => (
                      <span key={tag} className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border border-primary/5">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

export default VenueList;

