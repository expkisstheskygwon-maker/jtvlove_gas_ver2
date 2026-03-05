import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { apiService } from './services/apiService';
import Home from './pages/Home';
import VenueList from './pages/VenueList';
import VenueDetail from './pages/VenueDetail';
import CCAList from './pages/CCAList';
import CCAProfile from './pages/CCAProfile';
import Community from './pages/Community';
import PostDetail from './pages/PostDetail';

import MyPage from './pages/MyPage';
import Login from './pages/Login';
import Register from './pages/Register';
import NoticeCenter from './pages/NoticeCenter';
import Policy from './pages/Policy';
import Footer from './pages/Footer';


// Admin & Portal
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProfile from './pages/admin/AdminProfile';
import AdminReservations from './pages/admin/AdminReservations';
import AdminCCAs from './pages/admin/AdminCCAs';

// CCA Portal
import CCAPortalLayout from './pages/cca/CCAPortalLayout';
import CCAPortalHome from './pages/cca/CCAPortalHome';
import CCAMySchedule from './pages/cca/CCAMySchedule';
import CCAGalleryManager from './pages/cca/CCAGalleryManager';
import CCAProfileSettings from './pages/cca/CCAProfileSettings';
import CCALogin from './pages/cca/CCALogin';
import CCASelectorModal from './pages/cca/CCASelectorModal';

// Super Admin Pages
import SuperAdminLayout from './pages/super/SuperAdminLayout';
import SuperDashboard from './pages/super/SuperDashboard';
import SuperSiteSettings from './pages/super/SuperSiteSettings';
import SuperPartners from './pages/super/SuperPartners';
import SuperLogin from './pages/super/SuperLogin';
import SuperCommunity from './pages/super/SuperCommunity';
import SuperUsers from './pages/super/SuperUsers';
import SuperHeroManager from './pages/super/SuperHeroManager';
import SuperNotice from './pages/super/SuperNotice';

// Venue Admin Auth & Selector
import VenueAdminLogin from './pages/admin/VenueAdminLogin';
import VenueAdminRegister from './pages/admin/VenueAdminRegister';
import VenueSelectorModal from './pages/admin/VenueSelectorModal';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [boards, setBoards] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [showVenueSelector, setShowVenueSelector] = useState(false);
  const [showCCASelector, setShowCCASelector] = useState(false);

  const handleVenueSelect = (venueId: string) => {
    updateUser({ venueId });
    setShowVenueSelector(false);
    navigate('/admin');
  };

  const handleCCASelect = (ccaId: string) => {
    updateUser({ ccaId });
    setShowCCASelector(false);
    navigate('/cca-portal');
  };

  const handleOwnerClick = (e: React.MouseEvent) => {
    if (user?.role === 'super_admin') {
      e.preventDefault();
      setShowVenueSelector(true);
    }
  };

  const handleCCAClick = (e: React.MouseEvent) => {
    if (user?.role === 'super_admin') {
      e.preventDefault();
      setShowCCASelector(true);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    const fetchBoards = async () => {
      const data = await apiService.getBoardConfigs();
      if (data && data.length > 0) {
        setBoards(data);
      } else {
        setBoards([
          { id: 'Free Board', name: '커뮤니티' },
          { id: 'JTV Review', name: '업소 리뷰' },
          { id: 'CCA Review', name: 'CCA 리뷰' },
          { id: 'Q&A Board', name: '질문 게시판' }
        ]);
      }
    };
    fetchBoards();

    const fetchSettings = async () => {
      const data = await apiService.getSiteSettings();
      setSettings(data);
    };
    fetchSettings();
  }, []);

  const isSpecial = location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/cca-portal') ||
    location.pathname.startsWith('/super-admin');
  const isActive = (path: string) => location.pathname === path;

  if (isSpecial) return null;

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-primary/10 px-4 h-16 hidden md:flex items-center">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="h-8 object-contain" />
            ) : (
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white shrink-0">
                <span className="material-symbols-outlined text-xl fill-1">stars</span>
              </div>
            )}
            <h1 className="font-extrabold text-sm tracking-tight leading-none uppercase">
              {settings?.site_name ? (
                <span className="whitespace-pre-line">{settings.site_name}</span>
              ) : (
                <>필리핀<br /><span className="text-primary">JTV 협회</span></>
              )}
            </h1>
          </Link>
          <nav className="flex items-center gap-8">
            <Link to="/" className={`text-sm font-bold transition-colors ${isActive('/') ? 'text-primary' : 'hover:text-primary'}`}>홈</Link>
            <Link to="/venues" className={`text-sm font-bold transition-colors ${isActive('/venues') ? 'text-primary' : 'hover:text-primary'}`}>업소 정보</Link>
            <Link to="/ccas" className={`text-sm font-bold transition-colors ${isActive('/ccas') ? 'text-primary' : 'hover:text-primary'}`}>CCA 리스트</Link>

            <div className="relative group py-4">
              <Link to="/community" className={`text-sm font-bold transition-colors flex items-center gap-1 ${location.pathname.startsWith('/community') ? 'text-primary' : 'hover:text-primary'}`}>
                커뮤니티
                <span className="material-symbols-outlined text-xs group-hover:rotate-180 transition-transform">expand_more</span>
              </Link>
              {/* Dropdown Menu */}
              <div className="absolute top-14 left-1/2 -translate-x-1/2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-2 z-[60]">
                {boards.map(board => (
                  <Link
                    key={board.id}
                    to={`/community?board=${board.id}`}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 text-[11px] font-black uppercase tracking-widest transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm text-primary">forum</span>
                    {board.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="relative group py-4">
              <Link to="/notice" className={`text-sm font-bold transition-colors flex items-center gap-1 ${location.pathname.startsWith('/notice') || location.pathname.startsWith('/policy') ? 'text-primary' : 'hover:text-primary'}`}>
                공지/이벤트
                <span className="material-symbols-outlined text-xs group-hover:rotate-180 transition-transform">expand_more</span>
              </Link>
              <div className="absolute top-14 left-1/2 -translate-x-1/2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-2 z-[60]">
                <Link to="/notice?type=Notice" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 text-[11px] font-black uppercase tracking-widest transition-colors">
                  <span className="material-symbols-outlined text-sm text-primary">campaign</span>
                  공지사항
                </Link>
                <Link to="/notice?type=Event" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 text-[11px] font-black uppercase tracking-widest transition-colors">
                  <span className="material-symbols-outlined text-sm text-primary">celebration</span>
                  이벤트
                </Link>
                <Link to="/notice?type=FAQ" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 text-[11px] font-black uppercase tracking-widest transition-colors">
                  <span className="material-symbols-outlined text-sm text-primary">quiz</span>
                  FAQ
                </Link>
                <div className="h-px bg-gray-100 dark:bg-white/5 my-1 mx-2"></div>
                <Link to="/policy?type=terms" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 text-[10px] font-bold uppercase tracking-tighter opacity-70 hover:opacity-100">
                  <span className="material-symbols-outlined text-sm">gavel</span>
                  이용약관
                </Link>
                <Link to="/policy?type=privacy" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 text-[10px] font-bold uppercase tracking-tighter opacity-70 hover:opacity-100">
                  <span className="material-symbols-outlined text-sm">privacy_tip</span>
                  개인정보 처리방침
                </Link>
              </div>
            </div>

            <Link to="/mypage" className={`text-sm font-bold transition-colors ${isActive('/mypage') ? 'text-primary' : 'hover:text-primary'}`}>마이페이지</Link>
            <div className="flex gap-2">
              <Link to="/admin/login" onClick={handleOwnerClick} className="text-[10px] font-black bg-zinc-100 dark:bg-white/5 px-3 py-1 rounded-full uppercase">업주용</Link>
              <Link to="/cca-portal/login" onClick={handleCCAClick} className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-tighter">CCA 전용</Link>
              <Link to="/super-admin" className="text-[10px] font-black bg-red-500/10 text-red-600 px-3 py-1 rounded-full uppercase">관리자</Link>
            </div>

            {user ? (
              <button onClick={handleLogout} className="ml-4 flex items-center gap-2 px-6 py-2 bg-red-500/10 text-red-500 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:scale-105 active:scale-95 transition-all">
                <span className="material-symbols-outlined text-lg">logout</span>
                Logout
              </button>
            ) : (
              <Link to="/login" className="ml-4 flex items-center gap-2 px-6 py-2 bg-zinc-900 dark:bg-primary dark:text-[#1b180d] text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:scale-105 active:scale-95 transition-all">
                <span className="material-symbols-outlined text-lg">login</span>
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-primary/10 px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt="Logo" className="h-6 object-contain" />
          ) : (
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined text-sm">stars</span>
            </div>
          )}
          <span className="font-black text-[10px] uppercase tracking-tighter">
            {settings?.site_name || 'JTV LOVE'}
          </span>
        </Link>
        {user ? (
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-1.5 bg-red-500/10 text-red-500 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
            <span className="material-symbols-outlined text-sm">logout</span>
            Logout
          </button>
        ) : (
          <Link to="/login" className="flex items-center gap-2 px-4 py-1.5 bg-zinc-900 dark:bg-primary dark:text-[#1b180d] text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
            <span className="material-symbols-outlined text-sm">login</span>
            Login
          </Link>
        )}
      </header>

      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 border-t border-primary/10 px-4 py-2 z-50 md:hidden flex items-center justify-between">
        <Link to="/" className={`flex flex-1 flex-col items-center gap-1 transition-colors ${isActive('/') ? 'text-primary' : 'text-gray-400'}`}>
          <span className="material-symbols-outlined">home</span>
          <span className="text-[10px] font-bold">홈</span>
        </Link>
        <Link to="/venues" className={`flex flex-1 flex-col items-center gap-1 transition-colors ${isActive('/venues') ? 'text-primary' : 'text-gray-400'}`}>
          <span className="material-symbols-outlined">apartment</span>
          <span className="text-[10px] font-bold">업소</span>
        </Link>
        <Link to="/ccas" className={`flex flex-1 flex-col items-center gap-1 transition-colors ${isActive('/ccas') ? 'text-primary' : 'text-gray-400'}`}>
          <span className="material-symbols-outlined">groups</span>
          <span className="text-[10px] font-bold">리스트</span>
        </Link>
        <Link to="/community" className={`flex flex-1 flex-col items-center gap-1 transition-colors ${isActive('/community') ? 'text-primary' : 'text-gray-400'}`}>
          <span className="material-symbols-outlined">forum</span>
          <span className="text-[10px] font-bold">커뮤니티</span>
        </Link>
        <Link to="/mypage" className={`flex flex-1 flex-col items-center gap-1 transition-colors ${isActive('/mypage') ? 'text-primary' : 'text-gray-400'}`}>
          <span className="material-symbols-outlined">person</span>
          <span className="text-[10px] font-bold">마이페이지</span>
        </Link>
      </nav>

      <VenueSelectorModal
        isOpen={showVenueSelector}
        onClose={() => setShowVenueSelector(false)}
        onSelect={handleVenueSelect}
      />
      <CCASelectorModal
        isOpen={showCCASelector}
        onClose={() => setShowCCASelector(false)}
        onSelect={handleCCASelect}
      />
    </>
  );
};

const FooterWrapper = () => {
  const location = useLocation();
  const isSpecial = location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/cca-portal') ||
    location.pathname.startsWith('/super-admin') ||
    location.pathname === '/login' ||
    location.pathname === '/register';
  if (isSpecial) return null;
  return <Footer />;
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen">
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/venues" element={<VenueList />} />
          <Route path="/venues/:id" element={<VenueDetail />} />
          <Route path="/ccas" element={<CCAList />} />
          <Route path="/ccas/:id" element={<CCAProfile />} />
          <Route path="/community" element={<Community />} />
          <Route path="/community/post/:id" element={<PostDetail />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/notice" element={<NoticeCenter />} />
          <Route path="/policy" element={<Policy />} />

          {/* Venue Admin Auth */}
          <Route path="/admin/login" element={<VenueAdminLogin />} />
          <Route path="/admin/register" element={<VenueAdminRegister />} />

          {/* Admin Routes */}
          <Route path="/admin/*" element={<AdminLayoutRoutes />} />

          {/* CCA Portal Auth */}
          <Route path="/cca-portal/login" element={<CCALogin />} />

          {/* CCA Portal Routes */}
          <Route path="/cca-portal/*" element={<CCAPortalLayout><CCAPortalRoutes /></CCAPortalLayout>} />

          {/* Super Admin Auth */}
          <Route path="/super-admin/login" element={<SuperLogin />} />

          {/* Super Admin Routes */}
          <Route path="/super-admin/*" element={
            <SuperAdminProtectedRoute>
              <SuperAdminLayout>
                <SuperAdminRoutes />
              </SuperAdminLayout>
            </SuperAdminProtectedRoute>
          } />
        </Routes>
        <FooterWrapper />
      </div>
    </Router>
  );
};

const CCAPortalProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user || (user.role !== 'cca' && user.role !== 'super_admin')) {
    return <Navigate to="/cca-portal/login" replace />;
  }
  return <>{children}</>;
};

const SuperAdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user || user.role !== 'super_admin') {
    return <Navigate to="/super-admin/login" replace />;
  }
  return <>{children}</>;
};

const AdminLayoutRoutes = () => (
  <Routes>
    <Route path="/" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
    <Route path="/profile" element={<AdminLayout><AdminProfile /></AdminLayout>} />
    <Route path="/reservations" element={<AdminLayout><AdminReservations /></AdminLayout>} />
    <Route path="/ccas" element={<AdminLayout><AdminCCAs /></AdminLayout>} />
  </Routes>
);

const CCAPortalRoutes = () => (
  <Routes>
    <Route path="/" element={<CCAPortalHome />} />
    <Route path="/schedule" element={<CCAMySchedule />} />
    <Route path="/gallery" element={<CCAGalleryManager />} />
    <Route path="/settings" element={<CCAProfileSettings />} />
  </Routes>
);

const SuperAdminRoutes = () => (
  <Routes>
    <Route path="/" element={<SuperDashboard />} />
    <Route path="/site-settings" element={<SuperSiteSettings />} />
    <Route path="/partners" element={<SuperPartners />} />
    <Route path="/hero" element={<SuperHeroManager />} />
    <Route path="/community" element={<SuperCommunity />} />
    <Route path="/users" element={<SuperUsers />} />
    <Route path="/notices" element={<SuperNotice />} />
  </Routes>
);

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navItems = [
    { path: '/admin', name: '대시보드', icon: 'dashboard' },
    { path: '/admin/profile', name: '업소 설정', icon: 'storefront' },
    { path: '/admin/reservations', name: '예약 관리', icon: 'calendar_month' },
    { path: '/admin/ccas', name: '스태프 관리', icon: 'groups' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-zinc-950">
      <aside className="w-64 bg-background-dark text-white p-6 hidden lg:flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-[#1b180d]">
            <span className="material-symbols-outlined font-black">shield_person</span>
          </div>
          <div>
            <h2 className="font-black text-sm uppercase tracking-tighter">업주용 콘솔</h2>
            {user?.role === 'super_admin' && (
              <Link to="/super-admin" className="text-[9px] font-black text-primary hover:underline">◀ 슈퍼관리자 홈으로</Link>
            )}
          </div>
        </div>
        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 p-4 rounded-xl font-bold transition-all ${location.pathname === item.path ? 'bg-primary text-[#1b180d]' : 'hover:bg-white/5 opacity-70 hover:opacity-100'}`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
};

export default App;