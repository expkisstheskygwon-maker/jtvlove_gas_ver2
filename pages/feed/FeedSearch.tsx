import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { CCA } from '../../types';

const FeedSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [ccas, setCCAs] = useState<CCA[]>([]);
  const [filtered, setFiltered] = useState<CCA[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCCAs = async () => {
      setLoading(true);
      try {
        const data = await apiService.getCCAs();
        const active = data.filter((c: any) => c.status === 'active');
        setCCAs(active);
        setFiltered(active);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCCAs();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setFiltered(ccas);
      return;
    }
    const q = query.toLowerCase();
    setFiltered(ccas.filter(c =>
      (c.nickname || '').toLowerCase().includes(q) ||
      (c.name || '').toLowerCase().includes(q) ||
      (c.venueName || '').toLowerCase().includes(q)
    ));
  }, [query, ccas]);

  const goToProfile = (nickname: string) => {
    window.location.hash = `/@${nickname}`;
  };

  return (
    <>
      {/* Search Bar */}
      <div className="ft-search-bar">
        <span className="material-symbols-outlined">search</span>
        <input
          type="text"
          placeholder="크리에이터 이름, 키워드 등"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {loading ? (
        <div className="ft-loading"><div className="ft-spinner"></div></div>
      ) : (
        <div>
          {filtered.map(cca => (
            <div
              key={cca.id}
              className="ft-creator-item"
              onClick={() => goToProfile(cca.nickname || cca.name)}
            >
              <img
                src={cca.image || 'https://ui-avatars.com/api/?name=' + cca.name}
                alt=""
                className="ft-creator-item-avatar"
              />
              <div className="ft-creator-item-info">
                <div className="ft-creator-item-name">
                  {cca.nickname || cca.name}
                  {cca.grade === 'STAR' && (
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--ft-primary)' }}>verified</span>
                  )}
                </div>
                <div className="ft-creator-item-handle">@{(cca.nickname || cca.name).toLowerCase().replace(/\s/g, '_')}</div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="ft-empty">
              <span className="material-symbols-outlined">search_off</span>
              <p>검색 결과가 없습니다.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default FeedSearch;
