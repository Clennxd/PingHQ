import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useMemoStore } from '../store/memoStore';
import { MemoCard } from '../components/MemoCard';
import { CustomDropdown } from '../components/CustomDropdown';
import { Info, Megaphone, Settings, Search, Bell, Sun, Moon, Radio, Folder, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { profile, logout, isLoading: isProfileLoading } = useAuthStore();
  const { memos, isLoading: isMemoLoading, error, fetchMemos, subscribeToMemos, unsubscribeMemos, unreadCount, resetUnreadCount } = useMemoStore();
  const [filter, setFilter] = useState<'ALL' | 'INFO' | 'URGENT'>('ALL');
  const [timeFilter, setTimeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();

  // Basic dark mode toggle detection
  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDarkMode(true);
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (profile) {
      const companyId = profile.company_id || profile.companies?.id;
      const departmentId = profile.department_id || profile.departments?.id || null;
      
      if (companyId) {
        fetchMemos(companyId, departmentId, profile.id);
        subscribeToMemos(companyId, departmentId, profile.id);
      }
    }
    return () => {
      unsubscribeMemos();
    };
  }, [profile, fetchMemos, subscribeToMemos, unsubscribeMemos]);

  if (isProfileLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC] dark:bg-slate-950 text-slate-600 dark:text-slate-300 font-sans">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-3"></div>
        Loading...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center p-4 bg-[#F8FAFC] dark:bg-slate-950 font-sans">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Data Profil Tidak Ditemukan</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Akun Anda belum terdaftar di Perusahaan/Departemen manapun.</p>
        <button onClick={() => logout()} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">Logout</button>
      </div>
    );
  }

  const userName = profile.full_name || profile.name || 'User';

  const filteredMemos = memos.filter(m => {
    // 1. Filter Kategori
    if (filter === 'INFO' && m.type !== 'INFO' && m.type !== 'TASK') return false;
    if (filter === 'URGENT' && m.type !== 'URGENT') return false;
    
    // 2. Filter Waktu
    const now = new Date();
    const memoDate = new Date(m.created_at);
    if (timeFilter === 'TODAY') {
      return memoDate.toDateString() === now.toDateString();
    }
    if (timeFilter === 'WEEK') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      return memoDate >= sevenDaysAgo;
    }
    if (timeFilter === 'MONTH') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return memoDate >= thirtyDaysAgo;
    }
    
    // 3. Filter Pencarian (Search Query)
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const matchMessage = m.message.toLowerCase().includes(query);
      const matchSender = m.profiles?.full_name?.toLowerCase().includes(query) || false;
      
      // Jika pesan dan nama pengirim tidak mengandung kata kunci, sembunyikan memo ini
      if (!matchMessage && !matchSender) return false;
    }

    return true;
  });

  return (
    <div className="flex flex-col w-full min-h-full">
      {/* Top Navbar */}
      <div className="relative z-50 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-6 lg:px-8 shrink-0 shadow-sm lg:shadow-none">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span className="hidden sm:inline">Dashboard</span>
          <span className="hidden sm:inline">&gt;</span>
          <span className="font-medium text-slate-900 dark:text-white">Broadcast Feed</span>
        </div>
        
        <div className="flex items-center gap-3 md:gap-4">

          <div className="relative hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari pengumuman..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9 pr-4 py-1.5 bg-slate-100 dark:bg-slate-800 border-transparent rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-all"
            />
          </div>
          <button onClick={toggleDarkMode} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => { setIsNotifOpen(!isNotifOpen); resetUnreadCount(); }} 
              className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <AnimatePresence>
              {isNotifOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 z-[100] overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="font-semibold text-slate-800 dark:text-white">Notifikasi Terbaru</h3>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
                    {memos.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500">Belum ada notifikasi.</div>
                    ) : (
                      memos.slice(0, 5).map(memo => (
                        <div key={memo.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => setIsNotifOpen(false)}>
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-sm font-semibold text-slate-800 dark:text-white">{memo.profiles?.full_name}</span>
                            <span className="text-[10px] text-slate-400">{new Date(memo.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{memo.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div 
            className="lg:hidden w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs ml-1 sm:ml-2 cursor-pointer shadow-sm relative" 
            onClick={() => navigate('/profile')}
          >
            {userName.charAt(0)}
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-scroll p-4 md:p-6 lg:p-8 pb-24 lg:pb-8 relative scroll-smooth" style={{ scrollbarGutter: 'stable' }}>
        <div className="max-w-6xl mx-auto">
          {/* Content Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                <Radio className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Broadcast Feed</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Pusat informasi dan pembaruan realtime tim Anda.</p>
              </div>
            </div>
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 w-full md:w-auto md:min-w-[200px] shadow-sm">
              <div className="flex flex-col">
                <span className="text-xs md:text-sm text-slate-500 font-medium">Total Pengumuman</span>
                <span className="text-2xl font-bold text-slate-800 dark:text-white">{memos.length}</span>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                <Megaphone className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 md:gap-6 items-start w-full max-w-full">
            
            {/* Kolom Kiri: Filter & Banner */}
            <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4 w-full min-w-0 lg:sticky lg:top-0">
              {/* Adaptive Filter UI */}
              <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-2 lg:gap-1 pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0 hide-scrollbar lg:bg-white lg:dark:bg-slate-900 lg:border lg:border-slate-200 lg:dark:border-slate-800 lg:rounded-xl lg:p-3 lg:shadow-sm" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <button 
                  onClick={() => setFilter('ALL')}
                  className={filter === 'ALL' 
                    ? "flex items-center gap-2 px-4 lg:px-3 py-2 lg:py-2.5 rounded-full lg:rounded-lg text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all bg-blue-600 lg:bg-blue-50 text-white lg:text-blue-700 shadow-md lg:shadow-none border border-blue-600 lg:border-transparent"
                    : "flex items-center gap-2 px-4 lg:px-3 py-2 lg:py-2.5 rounded-full lg:rounded-lg text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all bg-white lg:bg-transparent dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 lg:border-transparent dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}
                >
                  <Folder className="w-4 h-4" />
                  Semua Pengumuman
                </button>
                <button 
                  onClick={() => setFilter('INFO')}
                  className={filter === 'INFO' 
                    ? "flex items-center gap-2 px-4 lg:px-3 py-2 lg:py-2.5 rounded-full lg:rounded-lg text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all bg-blue-600 lg:bg-blue-50 text-white lg:text-blue-700 shadow-md lg:shadow-none border border-blue-600 lg:border-transparent"
                    : "flex items-center gap-2 px-4 lg:px-3 py-2 lg:py-2.5 rounded-full lg:rounded-lg text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all bg-white lg:bg-transparent dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 lg:border-transparent dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}
                >
                  <Info className="w-4 h-4" />
                  Informasi / Tugas
                </button>
                <button 
                  onClick={() => setFilter('URGENT')}
                  className={filter === 'URGENT' 
                    ? "flex items-center gap-2 px-4 lg:px-3 py-2 lg:py-2.5 rounded-full lg:rounded-lg text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all bg-blue-600 lg:bg-blue-50 text-white lg:text-blue-700 shadow-md lg:shadow-none border border-blue-600 lg:border-transparent"
                    : "flex items-center gap-2 px-4 lg:px-3 py-2 lg:py-2.5 rounded-full lg:rounded-lg text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all bg-white lg:bg-transparent dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 lg:border-transparent dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}
                >
                  <AlertCircle className="w-4 h-4" />
                  Pengumuman Penting
                </button>
              </div>

              {/* Banner Card */}
              <div className="hidden lg:block bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-md relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-10">
                  <Megaphone className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-lg font-bold mb-2">Tetap Terhubung</h3>
                  <p className="text-sm text-blue-100 mb-4 leading-relaxed">Jangan lewatkan informasi krusial dari manajemen dan divisi Anda.</p>
                </div>
              </div>
            </div>

            {/* Kolom Kanan: Feed */}
            <div className="lg:col-span-8 xl:col-span-9 w-full min-w-0">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-200 dark:border-red-800 mb-6 text-sm shadow-sm">
                  Gagal memuat: {error}
                </div>
              )}
              
              <div className="flex flex-col">
                {/* Header Feed & Time Filter */}
                <div className="flex items-center justify-between mb-4 relative z-40">
                  <h2 className="text-sm md:text-base font-semibold text-slate-800 dark:text-white">
                    Daftar Pengumuman
                  </h2>
                  <div className="w-40 md:w-48 relative">
                    <CustomDropdown
                      options={[
                        { id: 'ALL', name: 'Semua Waktu' },
                        { id: 'TODAY', name: 'Hari Ini' },
                        { id: 'WEEK', name: '7 Hari Terakhir' },
                        { id: 'MONTH', name: '30 Hari Terakhir' }
                      ]}
                      value={timeFilter}
                      onChange={setTimeFilter}
                    />
                  </div>
                </div>

                {isMemoLoading ? (
                  <div className="flex justify-center py-12 relative z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : filteredMemos.length === 0 ? (
                  <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 border-dashed shadow-sm relative z-10">
                    <div className="w-16 h-16 mx-auto bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                      <Info className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Belum ada pengumuman</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Tidak ada memo yang sesuai dengan filter Anda.</p>
                  </div>
                ) : (
                  <div className="relative z-10">
                    {filteredMemos.map((memo) => (
                      <MemoCard key={memo.id} memo={memo} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
