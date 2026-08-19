import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Lock, Building, Users as UsersIcon, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

export const Profile: React.FC = () => {
  const { profile, updateProfileName, updatePassword, verifyOldPassword } = useAuthStore();
  const navigate = useNavigate();

  const [newName, setNewName] = useState(profile?.full_name || '');
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  const [pwdStep, setPwdStep] = useState<'idle' | 'verify' | 'update'>('idle');
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!profile) return null;

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    setIsUpdatingName(true);
    try {
      await updateProfileName(newName.trim());
      toast.success('Nama berhasil diperbarui');
    } catch (error: any) {
      toast.error('Gagal memperbarui nama: ' + error.message);
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleVerifyOldPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPwd.trim()) return;

    setIsVerifying(true);
    try {
      await verifyOldPassword(oldPwd);
      setPwdStep('update');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPwd.trim() || newPwd.length < 6) {
      toast.error('Password baru minimal 6 karakter');
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error('Konfirmasi password tidak cocok!');
      return;
    }
    
    setIsUpdatingPassword(true);
    try {
      await updatePassword(newPwd);
      setOldPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setPwdStep('idle');
      toast.success('Password berhasil diperbarui');
    } catch (error: any) {
      toast.error('Gagal memperbarui password: ' + error.message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleCancelPasswordUpdate = () => {
    setPwdStep('idle');
    setOldPwd('');
    setNewPwd('');
    setConfirmPwd('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 text-slate-900 dark:text-slate-100">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center mb-8 gap-4 pt-2 md:pt-0">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <h1 className="text-2xl md:text-3xl font-bold">Profil Saya</h1>
        </div>

        <div className="space-y-6">
          {/* Card 1: Informasi Akun */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 md:p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <User className="w-5 h-5 text-blue-500" />
              Informasi Akun
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">User ID Login</label>
                <div className="bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-md text-sm font-mono text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                  {profile.user_id_login}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Perusahaan</label>
                  <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-md border border-slate-100 dark:border-slate-700">
                    <Building className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="truncate">{profile.companies?.name || '-'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Departemen</label>
                  <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-md border border-slate-100 dark:border-slate-700">
                    <UsersIcon className="w-4 h-4 text-green-400 shrink-0" />
                    <span className="truncate">{profile.departments?.name || 'Semua Departemen'}</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Role Akses</label>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <Shield className={`w-4 h-4 ${profile.role === 'ADMIN' ? 'text-purple-500' : 'text-slate-400'}`} />
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${profile.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700'}`}>
                    {profile.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Ubah Nama */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 md:p-6">
            <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">Ubah Nama Lengkap</h2>
            <form onSubmit={handleUpdateName} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nama Lengkap Baru"
                required
                className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={isUpdatingName || newName.trim() === profile.full_name}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-sm"
              >
                {isUpdatingName ? 'Menyimpan...' : 'Simpan Nama'}
              </button>
            </form>
          </div>

          {/* Card 3: Ubah Password */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 md:p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <Lock className="w-5 h-5 text-slate-500" />
              Ubah Password
            </h2>
            
            {pwdStep === 'idle' && (
              <button
                onClick={() => setPwdStep('verify')}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-2 rounded-md font-medium transition-colors shadow-sm"
              >
                Ubah Password
              </button>
            )}

            {pwdStep === 'verify' && (
              <form onSubmit={handleVerifyOldPassword} className="space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">Masukkan password saat ini untuk melanjutkan.</p>
                <input
                  type="password"
                  value={oldPwd}
                  onChange={(e) => setOldPwd(e.target.value)}
                  placeholder="Password Lama"
                  required
                  className="w-full sm:w-auto min-w-[250px] px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white block"
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleCancelPasswordUpdate}
                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium transition-colors border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifying || !oldPwd.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {isVerifying ? 'Memverifikasi...' : 'Lanjut'}
                  </button>
                </div>
              </form>
            )}

            {pwdStep === 'update' && (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-3">
                  <input
                    type="password"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="Password Baru (min. 6 karakter)"
                    required
                    minLength={6}
                    className="w-full sm:w-auto min-w-[250px] px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white block"
                  />
                  <input
                    type="password"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="Konfirmasi Password Baru"
                    required
                    minLength={6}
                    className="w-full sm:w-auto min-w-[250px] px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white block"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleCancelPasswordUpdate}
                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium transition-colors border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingPassword || !newPwd.trim() || !confirmPwd.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {isUpdatingPassword ? 'Menyimpan...' : 'Simpan Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
};
