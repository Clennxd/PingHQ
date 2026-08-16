import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { Building2, Users, ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { CustomDropdown } from '../components/CustomDropdown';

export const AdminPanel: React.FC = () => {
  const { profile, checkSession } = useAuthStore();
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

      // Jika Admin mengubah departemennya sendiri, refresh global state
      if (profile?.id === userId) {
        await checkSession();
      }
    } catch (error: any) {
      toast.error('Gagal mengubah departemen: ' + error.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (!profile || profile.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Panel</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Kembali ke Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Section 1: Invite Code */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm col-span-1 md:col-span-2 w-full">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center mb-4">
              <Building2 className="w-5 h-5 mr-2 text-blue-500" />
              Kode Undangan Perusahaan
            </h2>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 flex flex-col items-center justify-center">
              <span className="text-3xl font-mono font-bold text-blue-600 dark:text-blue-400 tracking-wider break-all text-center">
                {company?.invite_code || 'TIDAK TERSEDIA'}
              </span>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center break-words">
                Berikan kode ini kepada karyawan Anda agar mereka bisa bergabung ke perusahaan <strong className="text-slate-700 dark:text-slate-300">{company?.name}</strong>.
              </p>
            </div>
          </div>

          {/* Section 2: Departments */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full w-full">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center mb-4">
              <Building2 className="w-5 h-5 mr-2 text-green-500" />
              Departemen
            </h2>
            
            <form onSubmit={handleAddDepartment} className="flex flex-col sm:flex-row gap-2 mb-4 w-full">
              <input
                type="text"
                placeholder="Nama departemen baru"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                required
                className="flex-1 px-3 py-2 bg-transparent border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
              />
              <button
                type="submit"
                disabled={isAddingDept}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center justify-center text-sm font-medium transition-colors disabled:opacity-70 whitespace-nowrap w-full sm:w-auto shrink-0"
              >
                <Plus className="w-4 h-4 mr-1" /> Tambah
              </button>
            </form>

            <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[300px] border border-slate-200 dark:border-slate-700 rounded-lg w-full">
              <ul className="divide-y divide-slate-200 dark:divide-slate-700 w-full">
                {departments.map(dept => (
                  <li key={dept.id} className="p-3 text-sm text-slate-700 dark:text-slate-300 break-words">
                    {dept.name}
                  </li>
                ))}
                {departments.length === 0 && (
                  <li className="p-4 text-center text-sm text-slate-500">Belum ada departemen.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Section 3: Employees */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full w-full">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center mb-4">
              <Users className="w-5 h-5 mr-2 text-purple-500" />
              Daftar Karyawan
            </h2>
            <div className="flex-1 overflow-x-auto overflow-y-auto min-h-[200px] max-h-[300px] border border-slate-200 dark:border-slate-700 rounded-lg w-full">
              <ul className="w-full">
                {employees.map((emp, index) => (
                  <li 
                    key={emp.id} 
                    className={`flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors w-full ${index !== employees.length - 1 ? 'border-b border-slate-200 dark:border-slate-700' : ''}`}
                  >
                    <div className="flex flex-col min-w-0 w-full">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{emp.full_name}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <p className="text-xs text-slate-500 truncate max-w-full">ID: {emp.user_id_login}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${emp.role === 'ADMIN' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                          {emp.role}
                        </span>
                      </div>
                    </div>
                    <div className="w-full md:w-auto shrink-0 mt-2 md:mt-0">
                      <CustomDropdown
                        options={departments.map(d => ({ id: d.id, name: d.name }))}
                        value={emp.department_id || ''}
                        onChange={(newDeptId) => updateEmployeeDepartment(emp.id, newDeptId)}
                        isLoading={updatingUserId === emp.id}
                        placeholder="Pilih Dept"
                      />
                    </div>
                  </li>
                ))}
                {employees.length === 0 && (
                  <li className="p-4 text-center text-sm text-slate-500 w-full">Belum ada karyawan.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
