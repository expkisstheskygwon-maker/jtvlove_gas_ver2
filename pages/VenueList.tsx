
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { VENUES } from '../constants';

const VenueList: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Manila');
  const regions = ['Manila', 'Clark/Angeles', 'Cebu', 'Others'];

  return (
    <div className="max-w-7xl mx-auto w-full pb-24">
      {/* Hero */}
      <div className="px-4 py-6">
        <div className="relative h-[220px] md:h-[400px] rounded-2xl overflow-hidden shadow-2xl">
          <img src={VENUES[0].image} alt="Venue Hero" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
            <span className="bg-primary text-[#1b180d] text-[10px] font-bold px-3 py-1 rounded-full w-fit mb-3 uppercase tracking-wider">Premium Selection</span>
            <h2 className="text-white text-3xl md:text-5xl font-extrabold leading-tight">이달의 추천 JTV</h2>
            <p className="text-white/80 text-sm md:text-xl mt-2">최고의 서비스와 품격을 보장합니다.</p>
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
        {VENUES.map(venue => (
          <Link to={`/venues/${venue.id}`} key={venue.id} className="bg-white dark:bg-zinc-900/50 rounded-2xl overflow-hidden shadow-sm border border-primary/5 group hover:shadow-2xl transition-all duration-300">
            <div className="relative aspect-video overflow-hidden">
              <img src={venue.image} alt={venue.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1 shadow-xl">
                <span className="material-symbols-outlined text-primary text-[16px] fill-1">star</span>
                <span className="text-xs font-bold">{venue.rating}</span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors">{venue.name}</h3>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{venue.region.split(',')[0]}</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 line-clamp-2 leading-relaxed">{venue.description}</p>
              <div className="flex flex-wrap gap-2">
                {venue.tags.map(tag => (
                  <span key={tag} className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border border-primary/5">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default VenueList;
