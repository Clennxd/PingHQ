import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useMemoStore } from '../store/memoStore';
import { MemoCard } from '../components/MemoCard';
import { CreateMemoModal } from '../components/CreateMemoModal';
import { LogOut, Building, Users, Info, Megaphone, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { profile, logout, isLoading: isProfileLoading } = useAuthStore();
  const { memos, isLoading: isMemoLoading, error, fetchMemos, subscribeToMemos, unsubscribeMemos } = useMemoStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      // Pastikan ada property company_id dan department_id di tabel profiles Anda.
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
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-3"></div>
        Loading...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center p-4 bg-slate-50 dark:bg-slate-900">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Data Profil Tidak Ditemukan</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Akun Anda belum terdaftar di Perusahaan/Departemen manapun. Hubungi Admin.</p>
        <button 
          onClick={() => logout()}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
        >
          Logout & Kembali
        </button>
      </div>
    );
  }

  const companyName = profile.companies?.name || 'Company Not Set';
  const departmentName = profile.departments?.name || 'All Departments';
  const userName = profile.full_name || profile.name || 'User';

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Sidebar (Desktop) / Header (Mobile) */}
      <div className="w-full h-16 md:h-auto md:w-72 bg-white dark:bg-slate-800 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 flex-none z-10 flex flex-col">
        <div className="flex-1 flex flex-col px-4 py-3 md:p-5 justify-center md:justify-start">
          <div className="flex items-center justify-between mb-0 md:mb-6">
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-tight">{companyName}</h1>
              {/* Mobile only department sub-header */}
              <p className="md:hidden text-xs md:text-sm text-slate-500 leading-tight">{departmentName}</p>
            </div>
            
            {/* Mobile only profile/logout */}
            <div className="flex md:hidden items-center space-x-3">
              {profile.role === 'ADMIN' && (
                <button onClick={() => navigate('/admin')} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                  <Settings className="w-5 h-5" />
                </button>
              )}
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                {userName.charAt(0)}
              </div>
              <button onClick={() => logout()} className="text-slate-400 hover:text-red-500">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Desktop only Organization / Department info & Create Button */}
          <div className="hidden md:block">
            {profile.role === 'ADMIN' && (
              <button 
                onClick={() => navigate('/admin')}
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-2.5 px-4 rounded-lg shadow-sm transition-colors flex items-center justify-center mb-3"
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin Panel
              </button>
            )}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm transition-colors flex items-center justify-center mb-8"
            >
              <Megaphone className="w-4 h-4 mr-2" />
              Buat Pengumuman
            </button>
            
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Organization</p>
                <div className="flex items-center text-sm font-medium text-slate-800 dark:text-slate-200">
                  <Building className="w-4 h-4 mr-2 text-blue-500" />
                  {companyName}
                </div>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Department</p>
                <div className="flex items-center text-sm font-medium text-slate-800 dark:text-slate-200">
                  <Users className="w-4 h-4 mr-2 text-green-500" />
                  {departmentName}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop only bottom profile/logout */}
        <div className="hidden md:flex mt-auto pt-6 border-t border-slate-200 dark:border-slate-700 items-center justify-between p-5">
          <div className="flex items-center overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm mr-3 shrink-0">
              {userName.charAt(0)}
            </div>
            <div className="truncate pr-2">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{userName}</p>
              <p className="text-xs text-slate-500 truncate">{profile.role || 'Member'}</p>
            </div>
          </div>
          <button 
            onClick={() => logout()}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Feed Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        <div className="max-w-3xl mx-auto pb-24 md:pb-0"> {/* padding-bottom added for mobile to avoid FAB overlap */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Broadcast Feed</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Realtime updates and memos for {departmentName}</p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-md mb-6 text-sm">
              Failed to load memos: {error}
            </div>
          )}

          {isMemoLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : memos.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="w-16 h-16 mx-auto bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                <Info className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Belum ada pengumuman</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Memo terbaru dari perusahaan atau departemen Anda akan muncul di sini.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {memos.map((memo) => (
                <MemoCard key={memo.id} memo={memo} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile FAB Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="md:hidden fixed bottom-6 right-6 z-50 bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
      >
        <Megaphone className="w-6 h-6" />
      </button>

      {profile && (
        <CreateMemoModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          profile={profile} 
        />
      )}
    </div>
  );
};
