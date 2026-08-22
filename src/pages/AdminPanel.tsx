import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { Building, Building2, Users, Plus, LayoutDashboard, Settings, ShieldCheck, Clock, RefreshCw, UserX, Lock, Download, Database, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { CustomDropdown } from '../components/CustomDropdown';
import { ConfirmModal } from '../components/ConfirmModal';
import * as XLSX from 'xlsx-js-style';

const ADMIN_MENUS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'organisasi', label: 'Organisasi', icon: Building },
  { id: 'bagian', label: 'Bagian', icon: Building2 },
  { id: 'pengguna', label: 'Pengguna', icon: Users },
  { id: 'aktivitas', label: 'Aktivitas', icon: Clock },
  { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
];

const ROLE_OPTIONS = [
  {id: 'SUPER_ADMIN', name: 'Super Admin'},
  {id: 'MANAGER', name: 'Manager'},
  {id: 'SENIOR_SPV', name: 'Senior SPV'},
  {id: 'SPV', name: 'SPV'},
  {id: 'ADMIN', name: 'Admin'},
  {id: 'STAFF', name: 'Staff'}
];

export const AdminPanel: React.FC = () => {
  const { profile, checkSession } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') || 'organisasi';

  const [company, setCompany] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newDeptName, setNewDeptName] = useState('');
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [isResettingCode, setIsResettingCode] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false, title: '', message: '', confirmText: '', isDanger: false, onConfirm: () => {}
  });

  const [companyNameInput, setCompanyNameInput] = useState(profile?.companies?.name || '');
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [isExportingMemos, setIsExportingMemos] = useState(false);

  useEffect(() => {
    if (!profile) return;
    
    if (profile.role !== 'SUPER_ADMIN') {
      navigate('/dashboard', { replace: true });
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const companyId = profile.company_id || profile.companies?.id;
        if (!companyId) return;

        // Fetch Company
        const { data: compData, error: compErr } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single();
        if (compErr) throw compErr;
        setCompany(compData);
        if (compData) setCompanyNameInput(compData.name);

        // Fetch Departments
        const { data: deptData, error: deptErr } = await supabase
          .from('departments')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: true });
        if (deptErr) throw deptErr;
        setDepartments(deptData || []);

        // Fetch Employees
        const { data: empData, error: empErr } = await supabase
          .from('profiles')
          .select('*, departments(name)')
          .eq('company_id', companyId)
          .order('full_name', { ascending: true });
        if (empErr) throw empErr;
        setEmployees(empData || []);

        // Fetch Recent Activity
        const { data: activityData, error: actErr } = await supabase
          .from('memos')
          .select('*, profiles(full_name)')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(10);
        if (actErr) throw actErr;
        setRecentActivity(activityData || []);

      } catch (error: any) {
        toast.error('Gagal memuat data admin: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [profile, navigate]);

  const addDepartment = async () => {
    setIsAddingDept(true);
    try {
      const { data, error } = await supabase
        .from('departments')
        .insert({ company_id: company.id, name: newDeptName.trim() })
        .select()
        .single();

      if (error) throw error;
      
      setDepartments([...departments, data]);
      setNewDeptName('');
      toast.success('Bagian berhasil ditambahkan');
    } catch (error: any) {
      toast.error('Gagal menambah bagian: ' + error.message);
    } finally {
      setIsAddingDept(false);
    }
  };

  const handleAddDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim() || !company?.id) return;
    
    setConfirmConfig({
      isOpen: true,
      title: 'Tambah Bagian Baru',
      message: `Apakah Anda yakin ingin menambahkan bagian "${newDeptName.trim()}" ke dalam organisasi?`,
      confirmText: 'Tambah Bagian',
      isDanger: false,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        await addDepartment();
      }
    });
  };

  const updateEmployeeDepartment = async (userId: string, newDeptId: string) => {
    setUpdatingUserId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ department_id: newDeptId })
        .eq('id', userId);

      if (error) throw error;
      toast.success('Bagian berhasil diubah!');
      
      const updatedDept = departments.find(d => d.id === newDeptId);
      setEmployees(prev => prev.map(emp => {
        if (emp.id === userId) {
          return {
            ...emp,
            department_id: newDeptId,
            departments: updatedDept ? { name: updatedDept.name } : emp.departments
          };
        }
        return emp;
      }));

      if (profile?.id === userId) await checkSession();
    } catch (error: any) {
      toast.error('Gagal mengubah bagian: ' + error.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const updateEmployeeRole = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      toast.success('Jabatan berhasil diubah!');
      
      setEmployees(prev => prev.map(emp => {
        if (emp.id === userId) return { ...emp, role: newRole };
        return emp;
      }));

      if (profile?.id === userId) await checkSession();
    } catch (error: any) {
      toast.error('Gagal mengubah jabatan: ' + error.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const updateCompanyName = async () => {
    setIsSavingCompany(true);
    try {
      const companyId = profile?.company_id || profile?.companies?.id;
      if (!companyId) throw new Error("Company ID tidak ditemukan");

      const { error } = await supabase.from('companies').update({ name: companyNameInput.trim() }).eq('id', companyId);
      if (error) throw error;

      toast.success('Nama organisasi berhasil diperbarui!');
      
      // Update local state temporarily, then refresh global session
      setCompany((prev: any) => ({ ...prev, name: companyNameInput.trim() }));
      await checkSession();
    } catch (err: any) {
      toast.error('Gagal menyimpan nama organisasi: ' + err.message);
    } finally {
      setIsSavingCompany(false);
    }
  };

  const handleCompanyNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyNameInput.trim() || !company?.id) return;
    
    setConfirmConfig({
      isOpen: true,
      title: 'Ubah Nama Organisasi',
      message: `Apakah Anda yakin ingin mengubah nama organisasi menjadi "${companyNameInput.trim()}"?`,
      confirmText: 'Simpan Perubahan',
      isDanger: false,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        await updateCompanyName();
      }
    });
  };

  const regenerateInviteCode = async () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Perbarui Kode Undangan',
      message: 'Apakah Anda yakin ingin mengganti kode undangan? Kode lama tidak akan bisa digunakan lagi.',
      confirmText: 'Perbarui Kode',
      isDanger: false,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        setIsResettingCode(true);
        try {
          const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          const { error } = await supabase.from('companies').update({ invite_code: newCode }).eq('id', profile.company_id);
          if (error) throw error;
          
          setCompany((prev: any) => ({ ...prev, invite_code: newCode }));
          await checkSession();
          toast.success('Kode undangan berhasil diperbarui!');
        } catch (err: any) {
          toast.error(err.message);
        } finally {
          setIsResettingCode(false);
        }
      }
    });
  };

  const kickUser = async (userId: string, userName: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Keluarkan Pengguna',
      message: `Apakah Anda yakin ingin mengeluarkan ${userName} dari organisasi ini?`,
      confirmText: 'Keluarkan',
      isDanger: true,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          const { error } = await supabase.from('profiles').update({ company_id: null, department_id: null, role: 'STAFF' }).eq('id', userId);
          if (error) throw error;
          toast.success(`${userName} berhasil dikeluarkan dari organisasi.`);
          setEmployees(prev => prev.filter(p => p.id !== userId));
        } catch (err: any) {
          toast.error(err.message);
        }
      }
    });
  };

  if (!profile || profile.role !== 'SUPER_ADMIN') return <Navigate to="/dashboard" replace />;

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col w-full min-h-full">
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="text-white w-4 h-4" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">Admin Panel</h1>
        </div>
      </div>

      {/* Desktop Header Area */}
      <div className="hidden md:flex justify-between items-center p-4 md:p-6 lg:p-8 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Admin Panel</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kelola struktur organisasi dan akses pengguna.</p>
        </div>
      </div>

      {activeTab === 'organisasi' ? (
        <div className="px-4 md:px-6 lg:px-8 pb-8 flex flex-col gap-6">
          {/* Banner Kode Undangan */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl p-4 md:p-6 lg:p-8 text-center relative overflow-hidden shrink-0 shadow-sm">
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="flex items-center justify-center gap-2 mb-3 md:mb-4">
                <h2 className="text-xs md:text-sm font-semibold text-indigo-900/60 dark:text-indigo-400/80 uppercase tracking-widest">Kode Undangan Organisasi</h2>
              </div>
              <div className="bg-white dark:bg-slate-900 px-4 py-3 md:px-10 md:py-5 rounded-xl border border-indigo-100 dark:border-indigo-800 shadow-sm mb-3 md:mb-4 w-full md:w-auto inline-flex flex-col items-center justify-center overflow-hidden gap-3">
                {company?.invite_code ? (
                  <span className="tracking-[0.2em] md:tracking-[0.5em] text-2xl md:text-4xl text-indigo-600 dark:text-indigo-400 font-bold font-mono break-all text-center">
                    {company.invite_code}
                  </span>
                ) : (
                  <span className="text-lg md:text-xl text-slate-400 dark:text-slate-500 font-semibold font-mono text-center">
                    KODE BELUM DIBUAT
                  </span>
                )}
                <button 
                  onClick={regenerateInviteCode}
                  disabled={isResettingCode}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-full disabled:opacity-50"
                >
                  <RefreshCw size={16} className={isResettingCode ? 'animate-spin' : ''} />
                  <span>
                    {isResettingCode 
                      ? (company?.invite_code ? 'Memperbarui...' : 'Membuat...') 
                      : (company?.invite_code ? 'Perbarui Kode' : 'Buat Kode Sekarang')}
                  </span>
                </button>
              </div>
              <p className="text-xs md:text-sm text-indigo-700/80 dark:text-indigo-300/80 max-w-md mx-auto leading-relaxed px-2">
                Berikan kode ini kepada pengguna Anda agar mereka bisa bergabung ke organisasi <strong className="font-semibold text-indigo-900 dark:text-indigo-100">{company?.name}</strong>.
              </p>
            </div>
          </div>

          {/* Pengaturan Nama Organisasi */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 md:p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Profil Organisasi</h3>
              <p className="text-sm text-slate-500 mt-1 mb-4">Nama ini akan ditampilkan kepada seluruh anggota saat mereka bergabung.</p>
              
              <form id="update-company-form" onSubmit={handleCompanyNameSubmit} className="flex flex-col">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nama Organisasi</label>
                <input
                  type="text"
                  value={companyNameInput}
                  onChange={(e) => setCompanyNameInput(e.target.value)}
                  placeholder="Masukkan nama organisasi"
                  required
                  className="w-full max-w-md px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white"
                />
              </form>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-start">
              <button
                type="submit"
                form="update-company-form"
                disabled={isSavingCompany || companyNameInput.trim() === company?.name}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center min-w-[160px]"
              >
                {isSavingCompany ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Perubahan'
                )}
              </button>
            </div>
          </div>
        </div>
      ) : activeTab === 'bagian' ? (
        <div className="px-4 md:px-6 lg:px-8 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 md:p-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Tambah Bagian Baru</h3>
                <p className="text-sm text-slate-500 mt-1 mb-4">Buat bagian/departemen baru untuk mengelompokkan pengguna Anda.</p>
                <form id="add-dept-form" onSubmit={handleAddDeptSubmit} className="flex flex-col">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nama Bagian</label>
                  <input
                    type="text"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    placeholder="Contoh: IT Support, Marketing, HRD"
                    required
                    className="w-full max-w-md px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white"
                  />
                </form>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-start">
                <button
                  type="submit"
                  form="add-dept-form"
                  disabled={isAddingDept || !newDeptName.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center min-w-[160px]"
                >
                  {isAddingDept ? 'Menambahkan...' : 'Tambah Bagian'}
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 md:p-6 shadow-sm flex flex-col min-h-[400px]">
              <div className="flex items-center gap-3 mb-6 shrink-0">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <Building2 className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Daftar Bagian</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto max-h-[500px] border border-slate-100 dark:border-slate-800 rounded-xl mb-6 bg-slate-50/50 dark:bg-slate-800/20">
              <ul className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {departments.map(dept => {
                  const empCount = employees.filter(e => e.department_id === dept.id).length;
                  return (
                    <li key={dept.id} className="p-3 md:p-4 flex justify-between items-center hover:bg-white dark:hover:bg-slate-800 transition-colors group gap-2">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{dept.name}</span>
                      <span className="text-[10px] md:text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 px-2 md:px-3 py-1.5 rounded-full font-medium shadow-sm group-hover:border-indigo-200 dark:group-hover:border-indigo-800 transition-colors shrink-0 whitespace-nowrap">
                        {empCount} Pengguna
                      </span>
                    </li>
                  );
                })}
                {departments.length === 0 && (
                  <li className="p-8 text-center text-sm text-slate-500 font-medium">Belum ada bagian.</li>
                )}
              </ul>
            </div>
            
            <div className="mt-auto bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 p-3 md:p-4 rounded-xl flex items-center justify-between shrink-0">
              <span className="text-xs md:text-sm font-semibold text-emerald-800 dark:text-emerald-400">Total Bagian</span>
              <span className="text-lg md:text-xl font-bold text-emerald-600 dark:text-emerald-300">{departments.length}</span>
            </div>
          </div>
        </div>
      </div>
      ) : activeTab === 'pengguna' ? (
        <>
          <div className="px-4 md:px-6 lg:px-8 pb-8">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 md:p-6 shadow-sm flex flex-col min-h-[400px]">
              <div className="flex items-center gap-3 mb-6 shrink-0">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                  <Users className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Daftar Pengguna</h2>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[500px] mb-6 space-y-4 pr-1">
                {(() => {
                  const renderEmployeeRow = (emp: any) => (
                    <div key={emp.id} className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 md:p-4 border-b border-slate-100 dark:border-slate-800/50 last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      
                      {/* BAGIAN ATAS (Mobile) / KIRI (Desktop): Info User & Tombol Kick */}
                      <div className="flex items-start justify-between w-full lg:w-auto">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {emp.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm md:text-base font-semibold text-slate-800 dark:text-white line-clamp-1">{emp.full_name}</span>
                            <span className="text-xs text-slate-500">{emp.user_id_login}</span>
                          </div>
                        </div>

                        {emp.id !== profile.id && (
                          <button 
                            onClick={() => kickUser(emp.id, emp.full_name)}
                            className="lg:hidden p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ml-2"
                            title="Keluarkan Pengguna"
                          >
                            <UserX size={18} />
                          </button>
                        )}
                      </div>

                      {/* BAGIAN BAWAH (Mobile) / KANAN (Desktop): Dropdowns & Kick (Desktop) */}
                      <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto mt-1 lg:mt-0">
                        {emp.id === profile.id ? (
                          <div className="w-full sm:w-auto flex items-center gap-2 justify-center lg:justify-end">
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{emp.role?.replace('_', ' ')}</span>
                            <div className="w-full sm:w-auto px-3 py-2 bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 rounded-lg text-xs md:text-sm font-medium border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 cursor-not-allowed" title="Edit profil Anda melalui menu Profil">
                              <Lock size={14} />
                              <span>Akun Anda</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="w-full sm:w-auto sm:min-w-[140px]">
                              <CustomDropdown
                                options={departments.map(d => ({ id: d.id, name: d.name }))}
                                value={emp.department_id || ''}
                                onChange={(newDeptId) => updateEmployeeDepartment(emp.id, newDeptId)}
                                isLoading={updatingUserId === emp.id}
                                placeholder="Bagian"
                              />
                            </div>
                            <div className="w-full sm:w-auto sm:min-w-[140px]">
                              <CustomDropdown
                                options={ROLE_OPTIONS}
                                value={emp.role || ''}
                                onChange={(newRole) => updateEmployeeRole(emp.id, newRole)}
                                isLoading={updatingUserId === emp.id}
                                placeholder="Jabatan"
                              />
                            </div>
                            <button 
                              onClick={() => kickUser(emp.id, emp.full_name)}
                              className="hidden lg:flex p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ml-1"
                              title="Keluarkan Pengguna"
                            >
                              <UserX size={20} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );

                  const unassigned = employees.filter(e => !e.department_id);
                  
                  return (
                    <>
                      {unassigned.length > 0 && (
                        <div className="border border-red-200 dark:border-red-900/50 rounded-xl overflow-visible mb-4 shadow-sm">
                          <div className="bg-red-50 dark:bg-red-900/20 px-4 py-3 border-b border-red-200 dark:border-red-900/50 flex justify-between items-center text-red-600 dark:text-red-400">
                            <span className="font-semibold text-sm">Tanpa Bagian</span>
                            <span className="text-xs bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded-full font-medium">{unassigned.length} Pengguna</span>
                          </div>
                          <div className="divide-y divide-slate-100 dark:divide-slate-800/50 bg-white dark:bg-slate-900">
                            {unassigned.map(renderEmployeeRow)}
                          </div>
                        </div>
                      )}

                      {departments.map(dept => {
                        const deptEmployees = employees.filter(e => e.department_id === dept.id);
                        return (
                          <div key={dept.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-visible shadow-sm">
                            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                              <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{dept.name}</span>
                              <span className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-full font-medium">{deptEmployees.length} Pengguna</span>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800/50 bg-white dark:bg-slate-900">
                              {deptEmployees.length === 0 ? (
                                <div className="p-4 text-center text-sm text-slate-500">Belum ada pengguna di bagian ini.</div>
                              ) : (
                                deptEmployees.map(renderEmployeeRow)
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {departments.length === 0 && employees.length === 0 && (
                        <div className="p-8 text-center text-sm text-slate-500 font-medium border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 shadow-sm">
                          Belum ada pengguna.
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              
              <div className="mt-auto bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 p-3 md:p-4 rounded-xl flex items-center justify-between shrink-0">
                <span className="text-xs md:text-sm font-semibold text-indigo-800 dark:text-indigo-400">Total Pengguna</span>
                <span className="text-lg md:text-xl font-bold text-indigo-600 dark:text-indigo-300">{employees.length}</span>
              </div>
            </div>
          </div>
        </>
      ) : activeTab === 'aktivitas' ? (
        <div className="px-4 md:px-8 pb-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Riwayat Aktivitas Penyiaran</h2>
            </div>

            <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 md:ml-4 pb-4">
              {recentActivity.map((activity, index) => (
                <div key={activity.id} className={`mb-8 ml-6 relative ${index === recentActivity.length - 1 ? 'mb-0' : ''}`}>
                  <span className="absolute flex items-center justify-center w-3 h-3 bg-blue-500 rounded-full -left-[31px] md:-left-[33px] ring-4 ring-white dark:ring-slate-900 mt-1.5"></span>
                  <div className="flex flex-col">
                    <p className="text-sm text-slate-800 dark:text-slate-200">
                      <span className="font-semibold text-slate-900 dark:text-white">{activity.profiles?.full_name || 'Pengguna Tidak Diketahui'}</span> mengirim pengumuman 
                      <span className={`ml-1 font-semibold ${
                        activity.type === 'URGENT' ? 'text-red-500' : 
                        activity.type === 'TASK' ? 'text-green-500' : 
                        'text-blue-500'
                      }`}>
                        {activity.type}
                      </span>
                    </p>
                    <time className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{formatTime(activity.created_at)}</time>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="ml-6 py-4">
                  <p className="text-sm text-slate-500 italic">Belum ada aktivitas penyiaran di organisasi ini.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'pengaturan' ? (
        <div className="px-4 md:px-6 lg:px-8 pb-8 flex flex-col gap-6">

          {/* Card 1: Ekspor Data */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Download className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Ekspor Data (Excel)</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 ml-[52px]">Unduh data pengguna dan riwayat pengumuman dalam format Microsoft Excel (.xlsx) yang rapi.</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-start">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    const data = employees.map(p => ({
                      'Nama Lengkap': p.full_name,
                      'User ID': p.user_id_login,
                      'Jabatan': (p.role || '').replace('_', ' '),
                      'Bagian': departments.find(d => d.id === p.department_id)?.name || 'Tanpa Bagian'
                    }));

                    const worksheet = XLSX.utils.json_to_sheet(data);

                    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:D1');
                    const borderStyle = {
                      top: { style: 'thin', color: { rgb: 'FFCCCCCC' } },
                      bottom: { style: 'thin', color: { rgb: 'FFCCCCCC' } },
                      left: { style: 'thin', color: { rgb: 'FFCCCCCC' } },
                      right: { style: 'thin', color: { rgb: 'FFCCCCCC' } }
                    };

                    for (let R = range.s.r; R <= range.e.r; ++R) {
                      for (let C = range.s.c; C <= range.e.c; ++C) {
                        const address = XLSX.utils.encode_cell({ r: R, c: C });
                        if (!worksheet[address]) continue;

                        if (R === 0) {
                          // Style untuk Header (Baris 1)
                          worksheet[address].s = {
                            font: { bold: true, color: { rgb: "FFFFFFFF" } },
                            fill: { fgColor: { rgb: "FF4F46E5" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            border: borderStyle
                          };
                        } else {
                          // Style untuk Data (Baris 2 dst)
                          worksheet[address].s = {
                            alignment: { vertical: "center" },
                            border: borderStyle
                          };
                        }
                      }
                    }

                    worksheet['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 25 }, { wch: 30 }];

                    const workbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Pengguna");
                    XLSX.writeFile(workbook, `Data_Pengguna_${profile?.companies?.name?.replace(/\s+/g, '_') || 'Organisasi'}.xlsx`);
                    toast.success('File Excel Pengguna berhasil diunduh!');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
                >
                  <Download size={16} />
                  Unduh Data Pengguna
                </button>
                <button
                  disabled={isExportingMemos}
                  onClick={async () => {
                    setIsExportingMemos(true);
                    try {
                      const { data: allMemos, error } = await supabase
                        .from('memos')
                        .select('*, profiles(full_name), departments(name)')
                        .eq('company_id', profile!.company_id)
                        .order('created_at', { ascending: false });
                      if (error) throw error;
                      if (!allMemos || allMemos.length === 0) { toast.error('Belum ada pengumuman untuk diekspor.'); return; }

                      const data = allMemos.map(m => ({
                        'Tanggal & Waktu': new Date(m.created_at).toLocaleString('id-ID'),
                        'Pengirim': m.profiles?.full_name || 'Unknown',
                        'Tipe': m.type,
                        'Target Bagian': m.department_id ? (m.departments?.name || 'Bagian Internal') : 'Seluruh Organisasi',
                        'Isi Pengumuman': m.message
                      }));

                      const worksheet = XLSX.utils.json_to_sheet(data);

                      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:E1');
                      const borderStyle = {
                        top: { style: 'thin', color: { rgb: 'FFCCCCCC' } },
                        bottom: { style: 'thin', color: { rgb: 'FFCCCCCC' } },
                        left: { style: 'thin', color: { rgb: 'FFCCCCCC' } },
                        right: { style: 'thin', color: { rgb: 'FFCCCCCC' } }
                      };

                      for (let R = range.s.r; R <= range.e.r; ++R) {
                        for (let C = range.s.c; C <= range.e.c; ++C) {
                          const address = XLSX.utils.encode_cell({ r: R, c: C });
                          if (!worksheet[address]) continue;

                          if (R === 0) {
                            // Style untuk Header (Baris 1)
                            worksheet[address].s = {
                              font: { bold: true, color: { rgb: "FFFFFFFF" } },
                              fill: { fgColor: { rgb: "FF4F46E5" } },
                              alignment: { horizontal: "center", vertical: "center" },
                              border: borderStyle
                            };
                          } else {
                            // Style untuk Data (Baris 2 dst)
                            worksheet[address].s = {
                              alignment: { vertical: "center" },
                              border: borderStyle
                            };
                          }
                        }
                      }

                      worksheet['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 30 }, { wch: 60 }];

                      const workbook = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Pengumuman");
                      XLSX.writeFile(workbook, `Riwayat_Pengumuman_${profile?.companies?.name?.replace(/\s+/g, '_') || 'Organisasi'}.xlsx`);
                      toast.success('File Excel Pengumuman berhasil diunduh!');
                    } catch (err: any) {
                      toast.error(err.message);
                    } finally {
                      setIsExportingMemos(false);
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={16} />
                  {isExportingMemos ? 'Mengunduh...' : 'Unduh Riwayat Pengumuman'}
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Manajemen Penyimpanan */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Manajemen Penyimpanan</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 ml-[52px]">Bersihkan pengumuman yang sudah usang untuk menghemat ruang penyimpanan dan mempercepat aplikasi.</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-start">
              <button
                onClick={() => {
                  setConfirmConfig({
                    isOpen: true,
                    title: 'Hapus Pengumuman Lama',
                    message: 'Apakah Anda yakin ingin menghapus semua pengumuman yang berusia lebih dari 30 hari? Tindakan ini tidak dapat dibatalkan.',
                    confirmText: 'Ya, Hapus',
                    isDanger: true,
                    onConfirm: async () => {
                      try {
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        const { error } = await supabase
                          .from('memos')
                          .delete()
                          .eq('company_id', profile!.company_id)
                          .lt('created_at', thirtyDaysAgo.toISOString());
                        if (error) throw error;
                        toast.success('Pengumuman lama berhasil dihapus!');
                      } catch (err: any) {
                        toast.error('Gagal menghapus: ' + err.message);
                      }
                      setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                    }
                  });
                }}
                className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-600 dark:hover:bg-slate-500 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
              >
                <Database size={16} />
                Hapus Pengumuman &gt; 30 Hari
              </button>
            </div>
          </div>

          {/* Card 3: Zona Berbahaya */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900/50 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">Zona Berbahaya</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 ml-[52px]">Tindakan di bawah ini bersifat permanen dan tidak dapat dibatalkan. Harap berhati-hati.</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/10 px-6 py-4 border-t border-red-200 dark:border-red-900/50 flex justify-start">
              <button
                onClick={() => {
                  setConfirmConfig({
                    isOpen: true,
                    title: 'Hapus Seluruh Pengumuman',
                    message: 'PERINGATAN: Anda akan menghapus SELURUH riwayat pengumuman di organisasi ini. Data yang dihapus tidak dapat dipulihkan. Lanjutkan?',
                    confirmText: 'Ya, Hapus Semua',
                    isDanger: true,
                    onConfirm: async () => {
                      try {
                        const { error } = await supabase
                          .from('memos')
                          .delete()
                          .eq('company_id', profile!.company_id);
                        if (error) throw error;
                        toast.success('Seluruh riwayat pengumuman berhasil dihapus!');
                      } catch (err: any) {
                        toast.error('Gagal menghapus: ' + err.message);
                      }
                      setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                    }
                  });
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
              >
                <AlertTriangle size={16} />
                Hapus Seluruh Riwayat Pengumuman
              </button>
            </div>
          </div>

        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 h-full p-4">
          <Settings size={48} className="mb-4 opacity-20" />
          <h2 className="text-xl font-semibold text-slate-600 dark:text-slate-300 text-center">Fitur {ADMIN_MENUS.find(m => m.id === activeTab)?.label}</h2>
          <p className="text-sm mt-2 text-center">Modul ini sedang dalam tahap pengembangan.</p>
        </div>
      )}

      <ConfirmModal 
        {...confirmConfig} 
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} 
      />
    </div>
  );
};
