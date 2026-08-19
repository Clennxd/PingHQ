import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { CreateMemoModal } from './CreateMemoModal';
import { LayoutDashboard, Building2, Users, LogOut, Radio, Plus, Clock, Settings } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { profile, logout } = useAuthStore();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeTab = searchParams.get('tab');
  
  const companyName = profile?.companies?.name || 'PingHQ';
  const userName = profile?.full_name || profile?.name || 'User';

  const isActive = (path: string, tab?: string) => {
    if (tab) {
      return location.pathname === path && activeTab === tab;
    }
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] dark:bg-slate-950 overflow-hidden font-sans">
      
      {/* SIDEBAR (Desktop Only) */}
      <div className="hidden md:flex flex-col w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full shrink-0 z-10">
        
        {/* Header Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/50">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <Radio className="text-white w-4 h-4" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">
            {companyName}
          </h1>
        </div>

        {/* Menu Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-blue-500/20 transition-all hover:shadow-md mb-2"
          >
            <span>Buat Pengumuman</span>
            <div className="bg-white/20 p-1 rounded-md">
              <Plus className="w-4 h-4" />
            </div>
          </button>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">Utama</p>
            <div className="space-y-1">
              <Link 
                to="/dashboard"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                  isActive('/dashboard') 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold' 
                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" /> Dashboard
              </Link>
            </div>
          </div>

          {profile?.role === 'ADMIN' && (
            <div>
              <div className="px-4 mt-6 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Admin Panel</div>
              <div className="space-y-1">
                <Link 
                  to="/admin?tab=bagian"
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                    isActive('/admin', 'bagian') 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold' 
                      : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
                  }`}
                >
                  <Building2 className="w-5 h-5" /> Bagian
                </Link>
                <Link 
                  to="/admin?tab=pengguna"
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                    isActive('/admin', 'pengguna') 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold' 
                      : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
                  }`}
                >
                  <Users className="w-5 h-5" /> Pengguna
                </Link>
                <Link 
                  to="/admin?tab=aktivitas"
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                    isActive('/admin', 'aktivitas') 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold' 
                      : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
                  }`}
                >
                  <Clock className="w-5 h-5" /> Aktivitas
                </Link>
                <Link 
                  to="/admin?tab=pengaturan"
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                    isActive('/admin', 'pengaturan') 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold' 
                      : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
                  }`}
                >
                  <Settings className="w-5 h-5" /> Pengaturan
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer Profil */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/50 shrink-0">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/profile')} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-xl transition-colors text-left flex-1 min-w-0">
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 shrink-0 border border-slate-200 dark:border-slate-700">
                {userName.charAt(0)}
              </div>
              <div className="truncate pr-2 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{userName}</p>
                <p className="text-xs text-slate-500 truncate">{profile?.role}</p>
              </div>
            </button>
            <button onClick={() => logout()} className="text-red-500 hover:text-red-600 shrink-0 p-2 ml-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden w-full relative">
        <Outlet />
      </div>

      {/* Global Modals */}
      {profile && (
        <CreateMemoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} profile={profile} />
      )}
    </div>
  );
};
