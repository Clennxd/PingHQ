import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Lock, Building, Users as UsersIcon, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { ConfirmModal } from '../components/ConfirmModal';

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

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    isDanger: false,
    onConfirm: async () => {}
  });

  if (!profile) return null;

  const updateProfileNameData = async () => {
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

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newName.trim() === profile?.full_name) return;
    
    setConfirmConfig({
      isOpen: true,
      title: 'Ubah Nama Lengkap',
      message: `Apakah Anda yakin ingin mengubah nama Anda menjadi "${newName.trim()}"?`,
      confirmText: 'Simpan Perubahan',
      isDanger: false,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        await updateProfileNameData();
      }
    });
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
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Informasi Pribadi</h3>
              <p className="text-sm text-slate-500 mt-1 mb-4">Gunakan nama asli Anda agar mudah dikenali oleh anggota organisasi lain.</p>
              <form id="update-name-form" onSubmit={handleNameSubmit} className="flex flex-col">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nama Lengkap</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: John Doe"
                  required
                  className="w-full max-w-md px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white"
                />
              </form>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-start">
              <button
                type="submit"
                form="update-name-form"
                disabled={isUpdatingName || newName.trim() === profile.full_name}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center min-w-[160px]"
              >
                {isUpdatingName ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>

          {/* Card 3: Ubah Password */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-slate-500" />
                Ubah Password
              </h3>
              <p className="text-sm text-slate-500 mt-1 mb-4">Amankan akun Anda dengan menggunakan password yang kuat dan unik.</p>
              
              {pwdStep === 'idle' && (
                <div className="pt-2">
                  <button
                    onClick={() => setPwdStep('verify')}
                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-2 rounded-lg font-medium transition-colors shadow-sm"
                  >
                    Mulai Ubah Password
                  </button>
                </div>
              )}

              {pwdStep === 'verify' && (
                <form id="verify-pwd-form" onSubmit={handleVerifyOldPassword} className="flex flex-col">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Password Saat Ini</label>
                  <input
                    type="password"
                    value={oldPwd}
                    onChange={(e) => setOldPwd(e.target.value)}
                    placeholder="Masukkan password lama"
                    required
                    className="w-full max-w-md px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white"
                  />
                </form>
              )}

              {pwdStep === 'update' && (
                <form id="update-pwd-form" onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Password Baru</label>
                    <input
                      type="password"
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      placeholder="Min. 6 karakter"
                      required
                      minLength={6}
                      className="w-full max-w-md px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Konfirmasi Password Baru</label>
                    <input
                      type="password"
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      placeholder="Masukkan ulang password baru"
                      required
                      minLength={6}
                      className="w-full max-w-md px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white"
                    />
                  </div>
                </form>
              )}
            </div>

            {pwdStep !== 'idle' && (
              <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-start gap-3">
                {pwdStep === 'verify' ? (
                  <button
                    type="submit"
                    form="verify-pwd-form"
                    disabled={isVerifying || !oldPwd.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-sm min-w-[120px] flex items-center justify-center"
                  >
                    {isVerifying ? 'Memverifikasi...' : 'Lanjut'}
                  </button>
                ) : (
                  <button
                    type="submit"
                    form="update-pwd-form"
                    disabled={isUpdatingPassword || !newPwd.trim() || !confirmPwd.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-sm min-w-[160px] flex items-center justify-center"
                  >
                    {isUpdatingPassword ? 'Menyimpan...' : 'Simpan Password'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCancelPasswordUpdate}
                  className="px-6 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
              </div>
            )}
          </div>
          
        </div>
      </div>
      
      <ConfirmModal 
        {...confirmConfig} 
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} 
      />
    </div>
  );
};
