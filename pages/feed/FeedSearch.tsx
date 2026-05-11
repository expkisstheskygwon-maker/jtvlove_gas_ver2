import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { CCA } from '../../types';

const FeedSearch: React.FC = () => {
  const navigate = useNavigate();
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
    navigate(`/@${nickname}`);
  };

  return (
    <>
      <div style={{ padding: '20px 16px 10px' }}>
        {/* Modern Search Bar */}
        <div className="ft-search-modern-wrapper">
          <span className="material-symbols-outlined ft-search-icon">search</span>
          <input
            type="text"
            className="ft-search-input-modern"
            placeholder="크리에이터 검색..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button className="ft-search-clear" onClick={() => setQuery('')}>
              <span className="material-symbols-outlined">cancel</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 100, textAlign: 'center' }}>
          <div className="ft-spinner" style={{ margin: '0 auto' }}></div>
        </div>
      ) : (
        <div style={{ padding: '0 16px 40px' }}>
          {filtered.length > 0 ? (
            <div className="ft-search-grid">
              {filtered.map(cca => (
                <div
                  key={cca.id}
                  className="ft-search-grid-item"
                  onClick={() => goToProfile(cca.nickname || cca.name)}
                >
                  <div className="ft-search-thumb-wrapper">
                    <img
                      src={cca.image || 'https://ui-avatars.com/api/?name=' + cca.name}
                      alt=""
                    />
                    <div className="ft-search-thumb-overlay">
                      <div className="ft-search-thumb-nick">{cca.nickname || cca.name}</div>
                      {cca.grade === 'STAR' && (
                        <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#fff' }}>verified</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ft-empty" style={{ paddingTop: 80 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.2, marginBottom: 12 }}>search_off</span>
              <p style={{ color: 'var(--ft-text-tertiary)', fontWeight: 600 }}>검색 결과가 없습니다.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default FeedSearch;
