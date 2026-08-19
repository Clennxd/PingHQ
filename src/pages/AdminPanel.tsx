import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { Building2, Users, ArrowLeft, Plus, LayoutDashboard, Settings, Building, LogOut, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { CustomDropdown } from '../components/CustomDropdown';

const ROLE_OPTIONS = [
  {id: 'ADMIN', name: 'Admin'},
  {id: 'MANAGER', name: 'Manager'},
  {id: 'SENIOR_SPV', name: 'Senior SPV'},
  {id: 'SPV', name: 'SPV'},
  {id: 'STAFF', name: 'Staff'}
];

export const AdminPanel: React.FC = () => {
  const { profile, checkSession, logout } = useAuthStore();
  const navigate = useNavigate();

  const [company, setCompany] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newDeptName, setNewDeptName] = useState('');
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

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
      toast.success('Departemen berhasil ditambahkan');
    } catch (error: any) {
      toast.error('Gagal menambah departemen: ' + error.message);
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
      toast.success('Departemen berhasil diubah!');
      
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
      toast.error('Gagal mengubah departemen: ' + error.message);
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

  if (!profile || profile.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC] dark:bg-slate-950 font-sans">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const userName = profile.full_name || profile.name || 'Admin User';

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] dark:bg-slate-950 overflow-hidden font-sans">
      
      {/* SIDEBAR (Desktop Only) - Lebar disamakan menjadi w-72 */}
      <div className="hidden md:flex flex-col w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full shrink-0 z-10">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/50">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="text-white w-4 h-4" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">
            {company?.name || 'Admin Panel'}
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">Menu Utama</p>
          <div className="space-y-1">
            <button onClick={() => navigate('/dashboard')} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
              <Building className="w-4 h-4" /> Perusahaan
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors">
              <Building2 className="w-4 h-4" /> Departemen
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
              <Users className="w-4 h-4" /> Karyawan
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
              <Settings className="w-4 h-4" /> Pengaturan
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800/50 shrink-0">
          <div className="flex items-center justify-between">
            {/* Profil Clickable */}
            <button onClick={() => navigate('/profile')} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-xl transition-colors text-left flex-1 min-w-0">
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 shrink-0 border border-slate-200 dark:border-slate-700">
                {userName.charAt(0)}
              </div>
              <div className="truncate pr-2 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{userName}</p>
                <p className="text-xs text-slate-500 truncate">{profile.role}</p>
              </div>
            </button>
            <button onClick={() => logout()} className="text-red-500 hover:text-red-600 shrink-0 p-2 ml-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      {/* Tambahkan overflow-x-hidden w-full agar tidak tembus samping di HP */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden w-full">
        
        {/* Mobile Header (Hanya muncul di HP karena sidebar hilang) */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="text-white w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">Admin Panel</h1>
          </div>
          <button onClick={() => navigate('/dashboard')} className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop Header Area */}
        <div className="hidden md:flex justify-between items-center p-6 md:p-8 shrink-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Admin Panel</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kelola struktur perusahaan dan akses karyawan.</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kembali</span>
          </button>
        </div>

        {/* Banner Kode Undangan */}
        <div className="m-4 md:mx-8 md:mb-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl p-4 md:p-8 text-center relative overflow-hidden shrink-0 shadow-sm">
          <div className="relative z-10 flex flex-col items-center justify-center">
            <h2 className="text-xs md:text-sm font-semibold text-indigo-900/60 dark:text-indigo-400/80 uppercase tracking-widest mb-3 md:mb-4">Kode Undangan Perusahaan</h2>
            <div className="bg-white dark:bg-slate-900 px-4 py-3 md:px-10 md:py-5 rounded-xl border border-indigo-100 dark:border-indigo-800 shadow-sm mb-3 md:mb-4 w-full md:w-auto inline-flex justify-center overflow-hidden">
              {/* Tambahkan break-all agar kode panjang tidak merusak box di HP */}
              <span className="tracking-[0.2em] md:tracking-[0.5em] text-2xl md:text-4xl text-indigo-600 dark:text-indigo-400 font-bold font-mono md:ml-2 break-all text-center">
                {company?.invite_code || 'TIDAK TERSEDIA'}
              </span>
            </div>
            <p className="text-xs md:text-sm text-indigo-700/80 dark:text-indigo-300/80 max-w-md mx-auto leading-relaxed px-2">
              Berikan kode ini kepada karyawan Anda agar mereka bisa bergabung ke perusahaan <strong className="font-semibold text-indigo-900 dark:text-indigo-100">{company?.name}</strong>.
            </p>
          </div>
        </div>

        {/* Grid Departemen & Karyawan */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 px-4 md:px-8 pb-8 items-start">
          
          {/* Card Departemen */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 md:p-6 shadow-sm flex flex-col h-full min-h-[400px]">
            <div className="flex items-center gap-3 mb-6 shrink-0">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Building2 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Departemen</h2>
            </div>
            
            <form onSubmit={handleAddDepartment} className="flex gap-2 md:gap-3 mb-6 shrink-0">
              <input
                type="text"
                placeholder="Nama departemen baru"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                required
                className="flex-1 px-3 md:px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all min-w-0"
              />
              <button
                type="submit"
                disabled={isAddingDept}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 md:px-5 py-2.5 rounded-xl flex items-center justify-center text-sm font-semibold transition-colors disabled:opacity-70 shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4 sm:mr-1.5" /> <span className="hidden sm:inline">Tambah</span>
              </button>
            </form>

            <div className="flex-1 overflow-y-auto max-h-[300px] border border-slate-100 dark:border-slate-800 rounded-xl mb-6 bg-slate-50/50 dark:bg-slate-800/20">
              <ul className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {departments.map(dept => {
                  const empCount = employees.filter(e => e.department_id === dept.id).length;
                  return (
                    <li key={dept.id} className="p-3 md:p-4 flex justify-between items-center hover:bg-white dark:hover:bg-slate-800 transition-colors group gap-2">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{dept.name}</span>
                      <span className="text-[10px] md:text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 px-2 md:px-3 py-1.5 rounded-full font-medium shadow-sm group-hover:border-indigo-200 dark:group-hover:border-indigo-800 transition-colors shrink-0 whitespace-nowrap">
                        {empCount} Karyawan
                      </span>
                    </li>
                  );
                })}
                {departments.length === 0 && (
                  <li className="p-8 text-center text-sm text-slate-500 font-medium">Belum ada departemen.</li>
                )}
              </ul>
            </div>
            
            <div className="mt-auto bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 p-3 md:p-4 rounded-xl flex items-center justify-between shrink-0">
              <span className="text-xs md:text-sm font-semibold text-emerald-800 dark:text-emerald-400">Total Departemen</span>
              <span className="text-lg md:text-xl font-bold text-emerald-600 dark:text-emerald-300">{departments.length}</span>
            </div>
          </div>

          {/* Card Karyawan */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 md:p-6 shadow-sm flex flex-col h-full min-h-[400px]">
            <div className="flex items-center gap-3 mb-6 shrink-0">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Daftar Karyawan</h2>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[365px] border border-slate-100 dark:border-slate-800 rounded-xl mb-6 bg-slate-50/50 dark:bg-slate-800/20">
              <ul className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {employees.map(emp => (
                  <li key={emp.id} className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 p-3 md:p-4 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-3 min-w-0 mb-1 xl:mb-0">
                      <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-sm shrink-0 border border-slate-300 dark:border-slate-600">
                        {emp.full_name?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{emp.full_name}</p>
                        <p className="text-[10px] md:text-xs text-slate-500 truncate mt-0.5">{emp.user_id_login}</p>
                      </div>
                    </div>
                    
                    {/* Dropdown Wrappers full-width on mobile, auto on desktop */}
                    <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto shrink-0">
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
                          placeholder="Departemen"
                        />
                      </div>
                    </div>
                  </li>
                ))}
                {employees.length === 0 && (
                  <li className="p-8 text-center text-sm text-slate-500 font-medium">Belum ada karyawan.</li>
                )}
              </ul>
            </div>
            
            <div className="mt-auto bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 p-3 md:p-4 rounded-xl flex items-center justify-between shrink-0">
              <span className="text-xs md:text-sm font-semibold text-indigo-800 dark:text-indigo-400">Total Karyawan</span>
              <span className="text-lg md:text-xl font-bold text-indigo-600 dark:text-indigo-300">{employees.length}</span>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};
