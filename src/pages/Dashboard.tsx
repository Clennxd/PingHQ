import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useMemoStore } from '../store/memoStore';
import { MemoCard } from '../components/MemoCard';
import { CreateMemoModal } from '../components/CreateMemoModal';
import { LogOut, Building, Users, Info, Megaphone } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { profile, logout, isLoading: isProfileLoading } = useAuthStore();
  const { memos, isLoading: isMemoLoading, error, fetchMemos, subscribeToMemos, unsubscribeMemos } = useMemoStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      <div className="flex h-screen items-center justify-center bg-backgroundLight dark:bg-backgroundDark text-gray-600 dark:text-gray-300">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mr-3"></div>
        Loading...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center p-4 bg-backgroundLight dark:bg-backgroundDark">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Data Profil Tidak Ditemukan</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Akun Anda belum terdaftar di Perusahaan/Departemen manapun. Hubungi Admin.</p>
        <button 
          onClick={() => logout()}
          className="px-6 py-2 bg-primary hover:bg-[#2563EB] text-white rounded-md transition-colors"
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
    <div className="flex flex-col md:flex-row min-h-screen bg-backgroundLight dark:bg-backgroundDark">
      {/* Sidebar / Top Header */}
      <div className="w-full md:w-[250px] bg-white dark:bg-[#131926] border-b md:border-b-0 md:border-r border-gray-200 dark:border-[#1E293B] p-5 flex flex-col md:h-screen sticky top-0 z-10 shadow-sm md:shadow-none">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-6">TeamPulse</h1>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm transition-colors flex items-center justify-center mb-8"
          >
            <Megaphone className="w-4 h-4 mr-2" />
            Buat Pengumuman
          </button>
          
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Organization</p>
              <div className="flex items-center text-sm font-medium text-gray-800 dark:text-gray-200">
                <Building className="w-4 h-4 mr-2 text-primary" />
                {companyName}
              </div>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Department</p>
              <div className="flex items-center text-sm font-medium text-gray-800 dark:text-gray-200">
                <Users className="w-4 h-4 mr-2 text-task" />
                {departmentName}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm mr-3 shrink-0">
              {userName.charAt(0)}
            </div>
            <div className="truncate pr-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{userName}</p>
              <p className="text-xs text-gray-500 truncate">{profile.role || 'Member'}</p>
            </div>
          </div>
          <button 
            onClick={() => logout()}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Feed */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4 md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Broadcast Feed</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Realtime updates and memos for {departmentName}</p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-md mb-6 text-sm">
              Failed to load memos: {error}
            </div>
          )}

          {isMemoLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : memos.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-[#131926] rounded-xl border border-gray-100 dark:border-[#1E293B]">
              <div className="w-16 h-16 mx-auto bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Info className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Belum ada pengumuman</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Memo terbaru dari perusahaan atau departemen Anda akan muncul di sini.</p>
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
