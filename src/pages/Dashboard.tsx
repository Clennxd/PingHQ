import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useMemoStore } from '../store/memoStore';
import { MemoCard } from '../components/MemoCard';
import { CreateMemoModal } from '../components/CreateMemoModal';
import { LogOut, Building, Users, Info, Megaphone, Settings, Search, Bell, Sun, Moon, Plus, Radio, LayoutDashboard, CircleDot, Folder, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { profile, logout, isLoading: isProfileLoading } = useAuthStore();
  const { memos, isLoading: isMemoLoading, error, fetchMemos, subscribeToMemos, unsubscribeMemos } = useMemoStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'INFO' | 'URGENT'>('ALL');
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

  useEffect(() => {
    if (profile) {
      const companyId = profile.company_id || profile.companies?.id;
      const departmentId = profile.department_id || profile.departments?.id || null;
      
      if (companyId) {
        fetchMemos(companyId, departmentId);
        subscribeToMemos(companyId, departmentId);
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

  const companyName = profile.companies?.name || 'Company Not Set';
  const departmentName = profile.departments?.name || 'All Departments';
  const userName = profile.full_name || profile.name || 'User';

  const filteredMemos = memos.filter(m => {
    if (filter === 'ALL') return true;
    if (filter === 'INFO') return m.type === 'INFO' || m.type === 'TASK';
    if (filter === 'URGENT') return m.type === 'URGENT';
    return true;
  });

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] dark:bg-slate-950 overflow-hidden font-sans">
      
      {/* SIDEBAR (Desktop Only) */}
      <div className="hidden lg:flex w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col z-10 shrink-0">
        <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <LayoutDashboard className="text-white w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">PingHQ</h1>
          </div>
          {profile.role === 'ADMIN' && (
            <button onClick={() => navigate('/admin')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
          <div className="space-y-2">
            {profile.role === 'ADMIN' && (
              <button 
                onClick={() => navigate('/admin')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" /> Admin Panel
              </button>
            )}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4" /> Buat Pengumuman
              </div>
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">Organisasi</p>
            <div className="space-y-1">
              <div className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300">
                <Building className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{companyName}</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300">
                <Users className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{departmentName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/50 shrink-0">
          <div 
            onClick={() => navigate('/profile')}
            className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 shrink-0 border border-slate-200 dark:border-slate-700">
                  {userName.charAt(0)}
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
              </div>
              <div className="truncate pr-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{userName}</p>
                <p className="text-xs text-slate-500 truncate">{profile.role}</p>
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); logout(); }} className="text-slate-400 hover:text-red-500 shrink-0 p-1">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 shrink-0 z-10 shadow-sm lg:shadow-none">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="hidden sm:inline">Dashboard</span>
            <span className="hidden sm:inline">&gt;</span>
            <span className="font-medium text-slate-900 dark:text-white">Broadcast Feed</span>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
            {profile.role === 'ADMIN' && (
              <button onClick={() => navigate('/admin')} className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            )}
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari pengumuman..." 
                className="w-64 pl-9 pr-4 py-1.5 bg-slate-100 dark:bg-slate-800 border-transparent rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-all"
              />
            </div>
            <button onClick={toggleDarkMode} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
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
        <div className="flex-1 overflow-y-scroll p-4 lg:p-6 pb-24 lg:pb-6 relative scroll-smooth" style={{ scrollbarGutter: 'stable' }}>
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
            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6 items-start w-full max-w-full">
              
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
                    <button onClick={() => setIsModalOpen(true)} className="bg-white text-blue-600 text-sm font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-blue-50 transition-colors w-full">
                      Tulis Pengumuman Baru
                    </button>
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

                {isMemoLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : filteredMemos.length === 0 ? (
                  <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 border-dashed shadow-sm">
                    <div className="w-16 h-16 mx-auto bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                      <Info className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Belum ada pengumuman</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Tidak ada memo yang sesuai dengan filter Anda.</p>
                  </div>
                ) : (
                  <div>
                    {filteredMemos.map((memo) => (
                      <MemoCard key={memo.id} memo={memo} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile FAB Button */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="w-6 h-6" />
        </button>

        {profile && (
          <CreateMemoModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            profile={profile} 
          />
        )}
      </div>
    </div>
  );
};
