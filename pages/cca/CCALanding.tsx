import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const CCALanding: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#faf9f6] dark:bg-[#0f0e0b] font-display text-zinc-900 dark:text-white pb-20 overflow-x-hidden">
            <Helmet>
                <title>CCA Partner Guide | JTV STAR</title>
                <meta name="description" content="Join JTV STAR as a CCA. Experience perfect privacy protection, smart schedule management, and transparent revenue settlement." />
            </Helmet>

            {/* Top Navigation for Landing */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-primary/10">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="size-8 bg-gradient-to-br from-primary to-yellow-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                            <span className="material-symbols-outlined text-sm font-black">sparkles</span>
                        </div>
                        <h1 className="text-sm font-black tracking-tighter uppercase">JTV STAR <span className="text-primary">PARTNERS</span></h1>
                    </Link>
                    <div className="flex gap-3 items-center">
                        <Link to="/applicant/status" className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-emerald-500 transition-colors flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">badge</span>
                            My Status
                        </Link>
                        <Link to="/cca-portal/login" className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-primary transition-colors">
                            Login
                        </Link>
                        <Link to="/cca-portal/apply" className="px-6 py-2 bg-primary text-[#1b180d] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                            Apply Now
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2"></div>
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-yellow-600/10 rounded-full blur-[100px] pointer-events-none translate-x-1/2"></div>

                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
                    <div className="lg:w-1/2 text-center lg:text-left space-y-8 animate-fade-in">
                        <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-[0.2em] border border-primary/20">
                            The Best Stage For You
                        </span>
                        <h2 className="text-4xl md:text-6xl font-extrabold leading-[1.1] tracking-tight">
                            The Best Stage to Prove<br />
                            <span className="text-primary">Your Value,</span> JTV STAR
                        </h2>
                        <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed max-w-lg mx-auto lg:mx-0">
                            Are you getting the highly-paid treatment you deserve? Experience smart scheduling without privacy concerns and meet the top 1% booking clients right now.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link to="/cca-portal/apply" className="px-10 py-5 bg-[#1b180d] dark:bg-primary text-white dark:text-[#1b180d] rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                                Apply as a Partner <span className="material-symbols-outlined">arrow_forward</span>
                            </Link>
                        </div>
                    </div>
                    
                    <div className="lg:w-1/2 relative animate-scale-in">
                        <div className="relative z-10 bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 shadow-2xl border border-primary/10 rotate-2 hover:rotate-0 transition-transform duration-500">
                            {/* Mock Dashboard UI for Hero */}
                            <div className="flex items-center justify-between mb-6 pb-6 border-b border-primary/5">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-full bg-gradient-to-tr from-primary to-yellow-500 p-0.5">
                                        <div className="size-full bg-white dark:bg-zinc-900 rounded-full border-2 border-transparent"></div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Welcome</p>
                                        <p className="text-lg font-extrabold">Ace <span className="text-primary">YUMI</span></p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Today's Requests</p>
                                    <p className="text-xl font-black text-emerald-500">4 Groups</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-4 flex items-center justify-between border border-transparent hover:border-primary/20 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <span className="text-lg font-black text-zinc-400 w-12 text-center">20:00</span>
                                        <div>
                                            <p className="font-bold text-sm">VIP Client Booking (Request)</p>
                                            <p className="text-[10px] text-primary font-black uppercase">Confirmed</p>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-xl">verified</span>
                                </div>
                                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-4 flex items-center justify-between border border-transparent hover:border-primary/20 transition-colors opacity-70">
                                    <div className="flex items-center gap-4">
                                        <span className="text-lg font-black text-zinc-400 w-12 text-center">22:30</span>
                                        <div>
                                            <p className="font-bold text-sm">General Booking Standby</p>
                                            <p className="text-[10px] text-zinc-500 font-black uppercase">Waiting</p>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-zinc-400 bg-zinc-200 dark:bg-zinc-700 p-2 rounded-xl">schedule</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Decorative elements */}
                        <div className="absolute -bottom-6 -left-6 bg-white dark:bg-zinc-900 border border-primary/20 px-6 py-4 rounded-2xl shadow-xl z-20 flex items-center gap-4 animate-bounce hover:animate-none">
                            <div className="size-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                                <span className="material-symbols-outlined">payments</span>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Estimated Income This Month</p>
                                <p className="text-lg font-black tracking-tighter">₱ 200,000 <span className="text-primary text-xs">↑</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Benefits */}
            <section className="py-20 bg-white dark:bg-zinc-950 border-y border-primary/5 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest mb-4">Why Join Us?</span>
                        <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight">Why Hundreds of Top CCAs <br className="md:hidden"/> <span className="text-primary">Chose Us</span></h3>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-[2rem] p-8 border border-zinc-100 dark:border-white/5 hover:-translate-y-2 transition-transform group">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-[#1b180d] transition-colors">
                                <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
                            </div>
                            <h4 className="text-xl font-bold mb-4">Perfect Privacy Protection</h4>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                                No need to share your personal messenger contacts like KakaoTalk or LINE with clients. Manage your bookings and requests safely through our built-in 1:1 messaging. Dangerous clients can be blocked directly within the system.
                            </p>
                        </div>
                        
                        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-[2rem] p-8 border border-zinc-100 dark:border-white/5 hover:-translate-y-2 transition-transform group">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-6 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-3xl">event_available</span>
                            </div>
                            <h4 className="text-xl font-bold mb-4">Smart & Easy Schedule Management</h4>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                                Check your assigned bookings, schedules, and requested clients at a glance on an intuitive calendar dashboard. Easily switch your status between Clock-in/Clock-out and Standby with a single toggle.
                            </p>
                        </div>

                        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-[2rem] p-8 border border-zinc-100 dark:border-white/5 hover:-translate-y-2 transition-transform group">
                            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
                            </div>
                            <h4 className="text-xl font-bold mb-4">Transparent Earning System & Incentives</h4>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                                Request allowances, tips, and incentives/points from confirmed bookings are calculated in real-time and displayed on your dashboard. See exactly how hard you're working and get rewarded exclusively for your abilities.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Income Simulator Demo Section */}
            <section className="py-24 px-6 max-w-7xl mx-auto relative overflow-hidden bg-zinc-900 rounded-[3rem] mt-20 border border-primary/10 shadow-2xl">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 blur-[100px] pointer-events-none"></div>
                
                <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10 text-white">
                    <div className="lg:w-1/2 space-y-6">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Reward System</span>
                        <h3 className="text-3xl md:text-5xl font-extrabold tracking-tight">Your Effort, <br />Even Smarter <span className="text-primary">Value Creation</span></h3>
                        <p className="text-zinc-400 leading-relaxed font-medium">Don't be tied to a simple hourly pay framework. As your Rating gets higher and your Request clients increase, our system algorithm automatically provides additional points/tier badge rewards to generate even more booking opportunities for you.</p>
                        
                        <ul className="space-y-4 pt-4">
                            <li className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg text-sm">verified</span>
                                <span className="font-bold text-sm">Exclusive exposure capability on the main screen for Aces</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-emerald-500 bg-emerald-500/10 p-1.5 rounded-lg text-sm">paid</span>
                                <span className="font-bold text-sm">Additional cash-convertible mileage points per each honest review</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-blue-500 bg-blue-500/10 p-1.5 rounded-lg text-sm">star_rate</span>
                                <span className="font-bold text-sm">Scouting opportunities to premium lounges when excellent reviews accumulate</span>
                            </li>
                        </ul>
                    </div>

                    <div className="lg:w-1/2 w-full">
                        {/* Interactive Graph Mockup */}
                        <div className="bg-zinc-950 p-8 rounded-3xl border border-white/10 shadow-inner">
                            <div className="flex justify-between items-end mb-8">
                                <div>
                                    <p className="text-[10px] uppercase font-black text-zinc-500 tracking-widest mb-1">Top 5% Average Combined Income Ratio</p>
                                    <h4 className="text-3xl font-black text-white">Overwhelming Growth Curve</h4>
                                </div>
                                <div className="text-right">
                                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase rounded-full border border-emerald-500/30">+32% / Mo</span>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-2">
                                        <span className="text-zinc-400">Basic Attendance Allowance</span>
                                        <span className="text-white">40%</span>
                                    </div>
                                    <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-zinc-500 w-[40%] rounded-full"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-2">
                                        <span className="text-zinc-400">System Booking / Request Bonus</span>
                                        <span className="text-primary">45%</span>
                                    </div>
                                    <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-[45%] rounded-full shadow-[0_0_10px_rgba(255,215,0,0.5)]"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-2">
                                        <span className="text-zinc-400">Client Bonus Tips & Review Rewards</span>
                                        <span className="text-emerald-500">15%</span>
                                    </div>
                                    <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[15%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Already Applied? Check Status */}
            <section className="py-16 px-6 max-w-4xl mx-auto">
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 border border-emerald-500/10 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="size-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-4xl text-emerald-500">fact_check</span>
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-xl md:text-2xl font-extrabold mb-2">Already Applied?</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-1">Check your application status and respond to job offers from venues.</p>
                            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-black">Use the Name + 4-digit PIN you entered during application</p>
                        </div>
                        <Link 
                            to="/applicant/status" 
                            className="px-10 py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 flex-shrink-0"
                        >
                            <span className="material-symbols-outlined text-lg">badge</span>
                            Check My Status
                        </Link>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 px-6 text-center">
                <h3 className="text-3xl md:text-5xl font-extrabold mb-6">Start Right Now</h3>
                <p className="text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto mb-10 font-medium">Registering your profile takes only 3 minutes. Join for free now and become a partner at the top JTV lounges.</p>
                <Link to="/cca-portal/apply" className="inline-flex px-12 py-5 bg-primary text-[#1b180d] rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-110 active:scale-95 transition-all">
                    Apply to Register Profile
                </Link>
                <p className="mt-6 text-[10px] text-zinc-400 uppercase tracking-widest font-black">We will notify you of the results within 24 hours after review</p>
            </section>
        </div>
    );
};

export default CCALanding;
