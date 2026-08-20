import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { Building, Building2, Users, Plus, LayoutDashboard, Settings, ShieldCheck, Clock, RefreshCw, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { CustomDropdown } from '../components/CustomDropdown';

const ADMIN_MENUS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'organisasi', label: 'Organisasi', icon: Building },
  { id: 'bagian', label: 'Bagian', icon: Building2 },
  { id: 'pengguna', label: 'Pengguna', icon: Users },
  { id: 'aktivitas', label: 'Aktivitas', icon: Clock },
  { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
];

const ROLE_OPTIONS = [
  {id: 'ADMIN', name: 'Admin'},
  {id: 'MANAGER', name: 'Manager'},
  {id: 'SENIOR_SPV', name: 'Senior SPV'},
  {id: 'SPV', name: 'SPV'},
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

  const [companyNameInput, setCompanyNameInput] = useState(profile?.companies?.name || '');
  const [isSavingCompany, setIsSavingCompany] = useState(false);

  useEffect(() => {
    if (!profile) return;
    
    if (profile.role !== 'ADMIN') {
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

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim() || !company?.id) return;
    
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

  const updateCompanyName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyNameInput.trim() || !company?.id) return;

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

  const regenerateInviteCode = async () => {
    if (!confirm('Apakah Anda yakin ingin mengganti kode undangan? Kode lama tidak akan bisa digunakan lagi.')) return;
    setIsResettingCode(true);
    try {
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { error } = await supabase.from('companies').update({ invite_code: newCode }).eq('id', profile.company_id);
      if (error) throw error;
      toast.success('Kode undangan berhasil diperbarui!');
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsResettingCode(false);
    }
  };

  const kickUser = async (userId: string, userName: string) => {
    if (!confirm(`TENDANG PENGGUNA: Apakah Anda yakin ingin mengeluarkan ${userName} dari organisasi ini?`)) return;
    try {
      const { error } = await supabase.from('profiles').update({ company_id: null, department_id: null, role: 'STAFF' }).eq('id', userId);
      if (error) throw error;
      toast.success(`${userName} berhasil dikeluarkan dari organisasi.`);
      setEmployees(prev => prev.filter(p => p.id !== userId));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (!profile || profile.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;

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
      <div className="hidden md:flex justify-between items-center p-6 md:p-8 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Admin Panel</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kelola struktur organisasi dan akses pengguna.</p>
        </div>
      </div>

      {activeTab === 'organisasi' ? (
        <div className="px-4 md:px-8 pb-8 flex flex-col gap-6">
          {/* Banner Kode Undangan */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl p-6 md:p-8 text-center relative overflow-hidden shrink-0 shadow-sm">
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="flex items-center justify-center gap-2 mb-3 md:mb-4">
                <h2 className="text-xs md:text-sm font-semibold text-indigo-900/60 dark:text-indigo-400/80 uppercase tracking-widest">Kode Undangan Organisasi</h2>
              </div>
              <div className="bg-white dark:bg-slate-900 px-4 py-3 md:px-10 md:py-5 rounded-xl border border-indigo-100 dark:border-indigo-800 shadow-sm mb-3 md:mb-4 w-full md:w-auto inline-flex flex-col items-center justify-center overflow-hidden gap-3">
                <span className="tracking-[0.2em] md:tracking-[0.5em] text-2xl md:text-4xl text-indigo-600 dark:text-indigo-400 font-bold font-mono break-all text-center">
                  {company?.invite_code || 'TIDAK TERSEDIA'}
                </span>
                {company?.invite_code && (
                  <button 
                    onClick={regenerateInviteCode}
                    disabled={isResettingCode}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-full disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isResettingCode ? 'animate-spin' : ''}`} />
                    {isResettingCode ? 'Memperbarui...' : 'Perbarui Kode'}
                  </button>
                )}
              </div>
              <p className="text-xs md:text-sm text-indigo-700/80 dark:text-indigo-300/80 max-w-md mx-auto leading-relaxed px-2">
                Berikan kode ini kepada pengguna Anda agar mereka bisa bergabung ke organisasi <strong className="font-semibold text-indigo-900 dark:text-indigo-100">{company?.name}</strong>.
              </p>
            </div>
          </div>

          {/* Pengaturan Nama Organisasi */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg">
                <Building className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Identitas Organisasi</h2>
            </div>
            
            <form onSubmit={updateCompanyName} className="flex flex-col gap-6 mt-2 max-w-3xl">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nama Organisasi</label>
                <input
                  type="text"
                  value={companyNameInput}
                  onChange={(e) => setCompanyNameInput(e.target.value)}
                  placeholder="Masukkan nama organisasi"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-all shadow-sm"
                />
              </div>
              
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-start">
                <button
                  type="submit"
                  disabled={isSavingCompany || companyNameInput.trim() === company?.name}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center min-w-[160px]"
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
            </form>
          </div>
        </div>
      ) : activeTab === 'bagian' ? (
        <div className="px-4 md:px-8 pb-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 md:p-6 shadow-sm flex flex-col min-h-[400px]">
            <div className="flex items-center gap-3 mb-6 shrink-0">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Building2 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Daftar Bagian</h2>
            </div>
            
            <form onSubmit={handleAddDepartment} className="flex gap-2 md:gap-3 mb-6 shrink-0">
              <input
                type="text"
                placeholder="Nama bagian baru"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                required
                className="flex-1 px-3 md:px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all min-w-0 max-w-md"
              />
              <button
                type="submit"
                disabled={isAddingDept}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 md:px-5 py-2.5 rounded-xl flex items-center justify-center text-sm font-semibold transition-colors disabled:opacity-70 shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4 sm:mr-1.5" /> <span className="hidden sm:inline">Tambah</span>
              </button>
            </form>

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
      ) : activeTab === 'pengguna' ? (
        <>
          <div className="px-4 md:px-8 pb-8">
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
                    <div key={emp.id} className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 p-3 md:p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0 mb-1 xl:mb-0">
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-sm shrink-0 border border-slate-300 dark:border-slate-600">
                          {emp.full_name?.charAt(0) || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{emp.full_name}</p>
                          <p className="text-[10px] md:text-xs text-slate-500 truncate mt-0.5">{emp.user_id_login}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto shrink-0 items-center">
                        <div className="w-full sm:w-1/2 xl:w-36">
                          <CustomDropdown
                            options={ROLE_OPTIONS}
                            value={emp.role || ''}
                            onChange={(newRole) => updateEmployeeRole(emp.id, newRole)}
                            isLoading={updatingUserId === emp.id}
                            placeholder="Jabatan"
                          />
                        </div>
                        <div className="w-full sm:w-1/2 xl:w-40">
                          <CustomDropdown
                            options={departments.map(d => ({ id: d.id, name: d.name }))}
                            value={emp.department_id || ''}
                            onChange={(newDeptId) => updateEmployeeDepartment(emp.id, newDeptId)}
                            isLoading={updatingUserId === emp.id}
                            placeholder="Bagian"
                          />
                        </div>
                        {emp.id !== profile.id && (
                          <button
                            onClick={() => kickUser(emp.id, emp.full_name)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors sm:ml-1"
                            title="Keluarkan Pengguna"
                          >
                            <UserX className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );

                  const unassigned = employees.filter(e => !e.department_id);
                  
                  return (
                    <>
                      {unassigned.length > 0 && (
                        <div className="border border-red-200 dark:border-red-900/50 rounded-xl overflow-hidden mb-4 shadow-sm">
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
                          <div key={dept.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
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
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 h-full p-4">
          <Settings size={48} className="mb-4 opacity-20" />
          <h2 className="text-xl font-semibold text-slate-600 dark:text-slate-300 text-center">Pengaturan Lanjutan</h2>
          <p className="text-sm mt-2 text-center">Modul ini sedang dalam tahap pengembangan.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 h-full p-4">
          <Settings size={48} className="mb-4 opacity-20" />
          <h2 className="text-xl font-semibold text-slate-600 dark:text-slate-300 text-center">Fitur {ADMIN_MENUS.find(m => m.id === activeTab)?.label}</h2>
          <p className="text-sm mt-2 text-center">Modul ini sedang dalam tahap pengembangan.</p>
        </div>
      )}
    </div>
  );
};
