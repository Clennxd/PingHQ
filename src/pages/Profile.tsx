import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Lock, Building, Users as UsersIcon, Shield, UserCircle, IdCard, Key, ArrowRight, Clock } from 'lucide-react';
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
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
      {/* Header Halaman */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 md:hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white">Profil Saya</h1>
        <span className="text-slate-400 hidden md:inline">•</span>
        <p className="text-slate-500 text-sm hidden md:block">Kelola pengaturan akun dan preferensi Anda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* KOLOM KIRI */}
        <div className="lg:col-span-8">
          
          {/* Card 1: Informasi Akun */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-8 border border-slate-200 dark:border-slate-800 relative overflow-hidden shadow-sm">
            <IdCard className="hidden md:block opacity-5 absolute -top-4 -right-4 w-32 h-32 text-slate-900 dark:text-white" />
            
            <div className="flex items-start gap-3 md:gap-4 relative z-10">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                <User className="w-5 h-5 md:w-6 md:h-6 text-slate-700 dark:text-slate-300" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">Informasi Akun</h2>
                <p className="text-xs md:text-sm text-slate-500 mt-1">Detail kredensial dan hak akses organisasi.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 mt-6 md:mt-8 relative z-10">
              <div>
                <label className="block text-slate-400 text-xs md:text-sm font-medium">User ID Login</label>
                <div className="text-lg md:text-xl font-bold mt-1 text-slate-900 dark:text-white">{profile.user_id_login}</div>
              </div>
              <div>
                <label className="block text-slate-400 text-xs md:text-sm font-medium">Role Akses</label>
                <div>
                  <span className="inline-flex items-center px-3 py-1 mt-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full text-xs font-bold tracking-wider">
                    <Shield size={12} className="mr-1.5" /> {profile.role.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-slate-400 text-xs md:text-sm font-medium">Organisasi</label>
                <div className="flex items-center gap-2 mt-1 text-slate-900 dark:text-white font-semibold text-sm md:text-base">
                  <Building className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="truncate">{profile.companies?.name || '-'}</span>
                </div>
              </div>
              <div>
                <label className="block text-slate-400 text-xs md:text-sm font-medium">Bagian</label>
                <div className="flex items-center gap-2 mt-1 text-slate-900 dark:text-white font-semibold text-sm md:text-base">
                  <UsersIcon className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="truncate">{profile.departments?.name || 'Tanpa Bagian'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Profil Pribadi */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-8 border border-slate-200 dark:border-slate-800 relative overflow-hidden shadow-sm mt-6">
            <div className="flex items-start gap-3 md:gap-4 mb-6">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                <UserCircle className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">Profil Pribadi</h2>
                <p className="text-xs md:text-sm text-slate-500 mt-1">Gunakan identitas asli untuk memudahkan kolaborasi internal.</p>
              </div>
            </div>

            <form id="update-name-form" onSubmit={handleNameSubmit}>
              <div className="mb-6 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nama Lengkap"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white text-sm md:text-base font-medium"
                />
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500">Nama ini akan tampil di seluruh aplikasi.</p>
                <button
                  type="submit"
                  disabled={isUpdatingName || newName.trim() === profile.full_name}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 px-6 py-2.5 rounded-xl text-sm md:text-base font-semibold transition-colors disabled:opacity-50 flex justify-center items-center"
                >
                  {isUpdatingName ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* KOLOM KANAN */}
        <div className="lg:col-span-4">
          
          {/* Card 3: Keamanan Akun (DARK CARD) */}
          <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-3xl p-5 md:p-8 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-5 md:p-6">
              <span className="text-[9px] md:text-[10px] font-bold bg-white/10 px-2 md:px-3 py-1 rounded-full tracking-widest text-white/80">KEAMANAN</span>
            </div>
            
            <div className="p-3 bg-white/10 rounded-2xl w-fit backdrop-blur-sm border border-white/5 mt-2 md:mt-2">
              <Key className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>

            <h2 className="text-xl md:text-2xl font-bold mt-5 md:mt-6">Keamanan Akun</h2>
            <p className="text-slate-400 text-xs md:text-sm mt-2 md:mt-3 leading-relaxed">
              Amankan akun Anda dengan menggunakan password yang kuat dan unik.
            </p>

            {pwdStep === 'idle' && (
              <button 
                onClick={() => setPwdStep('verify')}
                className="w-full mt-6 md:mt-8 bg-white text-slate-900 hover:bg-slate-100 py-2.5 px-4 md:py-3 rounded-xl flex justify-between items-center text-sm md:text-base font-semibold transition-colors"
              >
                Mulai Ubah Password <ArrowRight size={18}/>
              </button>
            )}

            {pwdStep === 'verify' && (
              <form onSubmit={handleVerifyOldPassword} className="mt-6 flex flex-col gap-4">
                <div>
                  <input
                    type="password"
                    value={oldPwd}
                    onChange={(e) => setOldPwd(e.target.value)}
                    placeholder="Password saat ini"
                    required
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-white text-sm md:text-base placeholder:text-slate-500"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleCancelPasswordUpdate}
                    className="w-full sm:w-auto px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm md:text-base font-semibold transition-colors flex-1 text-slate-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifying || !oldPwd.trim()}
                    className="w-full sm:w-auto px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm md:text-base font-semibold transition-colors flex-1 disabled:opacity-50"
                  >
                    {isVerifying ? 'Cek...' : 'Lanjut'}
                  </button>
                </div>
              </form>
            )}

            {pwdStep === 'update' && (
              <form onSubmit={handleUpdatePassword} className="mt-6 flex flex-col gap-4">
                <input
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="Password baru"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white text-sm md:text-base placeholder:text-slate-500"
                />
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder="Konfirmasi password baru"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white text-sm md:text-base placeholder:text-slate-500"
                />
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleCancelPasswordUpdate}
                    className="w-full sm:w-auto px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm md:text-base font-semibold transition-colors flex-1 text-slate-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingPassword || !newPwd.trim() || !confirmPwd.trim()}
                    className="w-full sm:w-auto px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm md:text-base font-semibold transition-colors flex-1 disabled:opacity-50"
                  >
                    {isUpdatingPassword ? 'Simpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Card 4: Aktivitas Terakhir */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm mt-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 text-slate-400" />
              <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">Aktivitas Terakhir</h3>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="font-semibold text-sm md:text-base text-emerald-900 dark:text-emerald-400">Sesi Aktif Saat Ini</p>
              </div>
              <p className="text-xs md:text-sm text-emerald-600 dark:text-emerald-500/80">Sesi login berhasil dari perangkat terverifikasi.</p>
            </div>
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
