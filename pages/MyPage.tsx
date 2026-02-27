
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

const MyPage: React.FC = () => {
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'service' | 'payment'>('info');

  // Stats
  const [stats, setStats] = useState({
    bookings: 0,
    posts: 0,
    notifications: 0
  });

  useEffect(() => {
    if (!authUser) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        const fullUser = await apiService.getUser(authUser.id);
        if (fullUser) {
          setUser({
            ...fullUser,
            realName: fullUser.real_name || authUser.realName,
          });
        } else {
          setUser(authUser);
        }

        // Mock stats
        setStats({
          bookings: 0,
          posts: 0,
          notifications: 0
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [authUser, navigate]);

  if (loading || !user) return <div className="flex items-center justify-center min-h-[60vh] text-primary animate-pulse font-black uppercase tracking-widest text-xs">Accessing Data...</div>;

  const currentXp = user.totalXp || 0;
  const nextLevelXp = user.nextLevelXp || Math.floor(80 * Math.pow(1.05, (user.level || 1) - 1));
  const xpPercentage = Math.min(100, Math.floor((currentXp / nextLevelXp) * 100));

  return (
    <div className="max-w-7xl mx-auto w-full p-4 lg:p-8 pb-24 lg:pb-12 animate-fade-in text-zinc-900 dark:text-zinc-100">
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Profile Card & Quick Stats */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Premium Profile Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-white/5 p-8 relative overflow-hidden group">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors duration-500"></div>

            <div className="flex flex-col items-center text-center gap-6 mb-10 relative z-10">
              <div className="relative">
                <div className="size-28 lg:size-36 rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-800 p-1.5 shadow-2xl ring-1 ring-zinc-200 dark:ring-white/10 group-hover:rotate-3 transition-transform duration-500">
                  <div className="w-full h-full rounded-[2rem] overflow-hidden">
                    <img
                      alt={user.nickname}
                      className="w-full h-full object-cover"
                      src={`https://picsum.photos/seed/${user.id}/300/300`}
                    />
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-primary text-[#1b180d] text-[10px] font-black px-4 py-1.5 rounded-full border-4 border-white dark:border-zinc-900 shadow-xl uppercase tracking-widest">
                  LV.{user.level || 1}
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-black mb-1.5 tracking-tighter">{user.nickname}</h2>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">커뮤니티 활동 {user.activityDays || 1}일째</p>
              </div>
            </div>

            {/* XP Progress Section */}
            <div className="space-y-4 relative z-10 bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-zinc-100 dark:border-white/5">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Progress to Level {(user.level || 1) + 1}</span>
                <span className="text-sm font-black text-primary">{xpPercentage}%</span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2.5 overflow-hidden shadow-inner p-0.5">
                <div className="bg-primary h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,215,0,0.5)]" style={{ width: `${xpPercentage}%` }}></div>
              </div>
              <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 text-center uppercase tracking-tighter">
                다음 레벨까지 얼마 남지 않았어요! ({currentXp}/{nextLevelXp} XP)
              </p>
            </div>
          </div>

          {/* Interactive Stat Cards */}
          <div className="grid grid-cols-3 gap-4">
            <button className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-white/5 flex flex-col items-center text-center shadow-lg hover:-translate-y-1 transition-all group">
              <span className="material-symbols-outlined text-primary mb-2 group-hover:scale-110 transition-transform">event_available</span>
              <span className="text-[8px] text-zinc-400 font-black uppercase tracking-widest mb-1">Bookings</span>
              <span className="text-xl font-black">{stats.bookings}</span>
            </button>
            <button className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-white/5 flex flex-col items-center text-center shadow-lg hover:-translate-y-1 transition-all group">
              <span className="material-symbols-outlined text-primary mb-2 group-hover:scale-110 transition-transform">edit_square</span>
              <span className="text-[8px] text-zinc-400 font-black uppercase tracking-widest mb-1">Posts</span>
              <span className="text-xl font-black">{stats.posts}</span>
            </button>
            <button className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-white/5 flex flex-col items-center text-center shadow-lg hover:-translate-y-1 transition-all group">
              <span className="material-symbol-outlined text-primary mb-2 group-hover:scale-110 transition-transform">notifications_active</span>
              <span className="text-[8px] text-zinc-400 font-black uppercase tracking-widest mb-1">Inbox</span>
              <span className="text-xl font-black text-primary">{stats.notifications}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Tabbed Content Area */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Modern Tab Navigation */}
          <div className="flex gap-2 p-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-2xl w-fit">
            {[
              { id: 'info', name: 'Profile', icon: 'person' },
              { id: 'service', name: 'Service', icon: 'grid_view' },
              { id: 'payment', name: 'Points', icon: 'account_balance_wallet' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white dark:bg-zinc-800 text-primary shadow-lg' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>

          <div className="animate-fade-in-up">
            {/* Section 1: Account Info */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-white/5 p-8 shadow-xl">
                  <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-8 px-2">Privacy & Contact</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-6 bg-zinc-50 dark:bg-white/5 rounded-[2rem] border border-zinc-100 dark:border-transparent group">
                      <div className="flex items-center gap-6">
                        <div className="size-12 rounded-[1.2rem] bg-white dark:bg-zinc-800 shadow-md flex items-center justify-center text-zinc-400">
                          <span className="material-symbols-outlined">badge</span>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-zinc-400 uppercase mb-1">Full Legal Name</p>
                          <p className="text-sm font-black">{user.realName}</p>
                        </div>
                      </div>
                      <span className="text-[8px] font-black text-zinc-300 dark:text-zinc-700 uppercase">ReadOnly</span>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-zinc-50 dark:bg-white/5 rounded-[2rem] border border-zinc-100 dark:border-transparent">
                      <div className="flex items-center gap-6">
                        <div className="size-12 rounded-[1.2rem] bg-white dark:bg-zinc-800 shadow-md flex items-center justify-center text-zinc-400">
                          <span className="material-symbols-outlined">mail</span>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-zinc-400 uppercase mb-1">Email Address (ID)</p>
                          <p className="text-sm font-black">{user.email}</p>
                        </div>
                      </div>
                      <button className="bg-white dark:bg-zinc-800 px-5 py-3 rounded-xl text-[9px] font-black text-primary uppercase tracking-widest border border-primary/20 hover:bg-primary hover:text-white transition-all">Change</button>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-zinc-50 dark:bg-white/5 rounded-[2rem] border border-zinc-100 dark:border-transparent">
                      <div className="flex items-center gap-6">
                        <div className="size-12 rounded-[1.2rem] bg-white dark:bg-zinc-800 shadow-md flex items-center justify-center text-zinc-400">
                          <span className="material-symbols-outlined">phone_iphone</span>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-zinc-400 uppercase mb-1">Mobile Phone</p>
                          <p className="text-sm font-black">{user.phone}</p>
                        </div>
                      </div>
                      <button className="bg-white dark:bg-zinc-800 px-5 py-3 rounded-xl text-[9px] font-black text-primary uppercase tracking-widest border border-primary/20 hover:bg-primary hover:text-white transition-all">Verify</button>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-zinc-50 dark:bg-white/5 rounded-[2rem] border border-zinc-100 dark:border-transparent">
                      <div className="flex items-center gap-6">
                        <div className="size-12 rounded-[1.2rem] bg-white dark:bg-zinc-800 shadow-md flex items-center justify-center text-zinc-400">
                          <span className="material-symbols-outlined">lock_reset</span>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-zinc-400 uppercase mb-1">Password Shield</p>
                          <p className="text-sm font-black">••••••••••••</p>
                        </div>
                      </div>
                      <button className="bg-zinc-900 dark:bg-primary text-white dark:text-[#1b180d] px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-all">Update</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 2: Service History */}
            {activeTab === 'service' && (
              <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-white/5 p-8 shadow-xl">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-8 px-2">Activity Universe</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: 'Activity History', icon: 'browse_gallery', color: 'bg-blue-500' },
                    { name: '1:1 Query Center', icon: 'chat_bubble', color: 'bg-primary' },
                    { name: 'User Guidelines', icon: 'menu_book', color: 'bg-emerald-500' },
                    { name: 'Terms of Service', icon: 'gavel', color: 'bg-zinc-500' }
                  ].map(item => (
                    <Link key={item.name} to="#" className="flex items-center gap-6 p-6 bg-zinc-50 dark:bg-white/5 rounded-[2rem] border border-zinc-100 dark:border-transparent hover:border-primary/30 transition-all group">
                      <div className={`size-14 rounded-2xl ${item.color}/10 flex items-center justify-center text-zinc-400 group-hover:text-primary transition-colors`}>
                        <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-widest group-hover:text-primary transition-colors">{item.name}</p>
                        <p className="text-[9px] font-bold text-zinc-400">View details & record</p>
                      </div>
                      <span className="material-symbols-outlined ml-auto text-zinc-200 dark:text-zinc-800 group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Section 3: Points & Payments */}
            {activeTab === 'payment' && (
              <div className="space-y-6">
                <div className="bg-[#1b180d] dark:bg-zinc-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-10">
                    <span className="material-symbols-outlined text-[120px]">currency_exchange</span>
                  </div>
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">Total Balance</p>
                  <h4 className="text-5xl font-black mb-8 tracking-tighter">{(user.points || 0).toLocaleString()}<span className="text-sm text-zinc-400 ml-2 uppercase tracking-widest font-bold">P</span></h4>

                  <div className="flex gap-3 relative z-10">
                    <button className="bg-primary text-[#1b180d] px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all">Add Points</button>
                    <button className="bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">Point History</button>
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-white/5 p-8 shadow-xl">
                  <div className="flex items-center justify-between mb-8 px-2">
                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Billing Information</h3>
                    <span className="text-[8px] font-black text-primary-dark uppercase flex items-center gap-2">
                      <span className="size-2 bg-green-500 rounded-full animate-pulse"></span> Verified Member
                    </span>
                  </div>
                  <div className="p-6 bg-zinc-50 dark:bg-white/5 rounded-[2rem] border border-zinc-100 dark:border-transparent flex items-center gap-6">
                    <span className="material-symbols-outlined text-zinc-300">info</span>
                    <p className="text-[10px] font-bold text-zinc-500 max-w-lg leading-relaxed uppercase">
                      현재 포인트 충전은 무통장 입금으로 진행됩니다. 입금 후 고객센터 혹은 슈퍼관리자에게 요청 주시면 실시간 확인 후 지급해 드립니다.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center md:justify-end">
            <button className="py-6 px-10 text-[10px] font-black text-zinc-400 hover:text-red-500 transition-all flex items-center gap-3 group uppercase tracking-[0.2em]">
              <span className="material-symbols-outlined text-lg group-hover:scale-125 transition-transform">logout</span>
              Logout Account
            </button>
          </div>
        </div>
      </div>

      {/* Premium Footer */}
      <footer className="mt-24 pt-16 border-t border-zinc-200 dark:border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-16 px-4">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="size-8 bg-primary rounded-xl flex items-center justify-center text-[#1b180d]">
                <span className="material-symbols-outlined text-sm font-black">stars</span>
              </div>
              <h4 className="font-black text-lg uppercase tracking-tighter">Philippines <span className="text-primary">JTV</span></h4>
            </div>
            <p className="text-[10px] font-bold text-zinc-500 leading-loose uppercase tracking-wide">
              필리핀 최고의 엔터테인먼트 비즈니스 협회 및<br />넘버원 커뮤니티 플랫폼입니다.
            </p>
          </div>

          {['Exploration', 'Community', 'Service'].map((group, idx) => (
            <div key={group}>
              <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-8">{group}</h5>
              <ul className="space-y-4">
                {idx === 0 && ['Venue Finder', 'CCA Alliance', 'Regional Guide'].map(item => (
                  <li key={item}><Link to="#" className="text-[9px] font-black text-zinc-500 hover:text-primary transition-colors uppercase tracking-widest">{item}</Link></li>
                ))}
                {idx === 1 && ['Free Lounge', 'VVIP Review', 'Event Center'].map(item => (
                  <li key={item}><Link to="#" className="text-[9px] font-black text-zinc-500 hover:text-primary transition-colors uppercase tracking-widest">{item}</Link></li>
                ))}
                {idx === 2 && ['Partnership', 'Customer Care', 'Legal Terms'].map(item => (
                  <li key={item}><Link to="#" className="text-[9px] font-black text-zinc-500 hover:text-primary transition-colors uppercase tracking-widest">{item}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="py-12 border-t border-zinc-100 dark:border-white/5 text-center px-4">
          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.5em] opacity-50">
            © 2026 Association PH-JTV. Crafting elite experiences in Asia.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MyPage;
