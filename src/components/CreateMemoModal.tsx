import React, { useState, useEffect, useMemo } from 'react';
import { useMemoStore } from '../store/memoStore';
import type { Profile } from '../store/authStore';
import { supabase } from '../lib/supabase';

interface CreateMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
}

interface TargetOption {
  value: string;
  label: string;
}

export const CreateMemoModal: React.FC<CreateMemoModalProps> = ({ isOpen, onClose, profile }) => {
  const [target, setTarget] = useState<string>('');
  const [type, setType] = useState<string>('INFO');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);

  const { createMemo } = useMemoStore();

  useEffect(() => {
    if (!isOpen) return;

    // Reset state on open
    setError('');
    setIsSubmitting(false);
    setMessage('');
    setType('INFO');

    const fetchDepartments = async () => {
      if (profile.role === 'SUPER_ADMIN' && profile.company_id) {
        try {
          const { data, error } = await supabase
            .from('departments')
            .select('*')
            .eq('company_id', profile.company_id)
            .order('name', { ascending: true });
          
          if (!error && data) {
            setDepartments(data);
          }
        } catch (err) {
          console.error('Failed to fetch departments:', err);
        }
      }
    };

    fetchDepartments();
  }, [isOpen, profile]);

  // Derived options based on role
  const targetOptions: TargetOption[] = useMemo(() => {
    const options: TargetOption[] = [];
    if (profile.role === 'SUPER_ADMIN') {
      options.push({ value: 'ALL', label: 'Seluruh Organisasi' });
      departments.forEach(dept => {
        options.push({ value: dept.id, label: `Bagian: ${dept.name}` });
      });
    } else if (['MANAGER', 'SENIOR_SPV', 'SPV'].includes(profile.role)) {
      options.push({ value: 'ALL', label: 'Seluruh Organisasi' });
      if (profile.department_id) {
        options.push({ value: profile.department_id, label: 'Bagian Internal' });
      }
    } else if (profile.role === 'STAFF' || profile.role === 'ADMIN') {
      if (profile.department_id) {
        options.push({ value: profile.department_id, label: 'Bagian Internal' });
      }
    }
    return options;
  }, [profile.role, profile.department_id, departments]);

  // Fallback default target based on options
  useEffect(() => {
    if (isOpen && targetOptions.length > 0 && (!target || !targetOptions.find(o => o.value === target))) {
      setTarget(targetOptions[0].value);
    }
  }, [isOpen, targetOptions, target]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Pesan tidak boleh kosong.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    const company_id = profile.company_id || profile.companies?.id;
    // JIKA target === 'ALL', payload department_id adalah null (dikirim ke semua)
    // JIKA BUKAN 'ALL', payload department_id adalah nilai target (id departemen)
    const department_id = target === 'ALL' ? null : target;
    const sender_id = profile.user_id || profile.id; // Fallback to id if user_id is somehow missing

    if (!company_id) {
      setError('Gagal membuat pengumuman: Company ID tidak ditemukan.');
      setIsSubmitting(false);
      return;
    }

    const result = await createMemo({
      company_id,
      department_id,
      sender_id,
      message: message.trim(),
      type
    });

    setIsSubmitting(false);

    if (result.success) {
      setMessage('');
      if (targetOptions.length > 0) setTarget(targetOptions[0].value);
      setType('INFO');
      onClose();
    } else {
      setError(result.error || 'Gagal membuat pengumuman.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Buat Pengumuman</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md text-sm border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              disabled={profile.role === 'STAFF' || targetOptions.length <= 1}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {targetOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="text-slate-900 dark:text-slate-200">
                  {opt.label}
                </option>
              ))}
              {targetOptions.length === 0 && (
                <option value="" disabled className="text-slate-500">Tidak ada target tersedia</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipe</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="INFO" className="text-blue-600 font-semibold">INFO</option>
              <option value="URGENT" className="text-red-600 font-semibold">URGENT</option>
              <option value="TASK" className="text-green-600 font-semibold">TASK</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pesan</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Tulis pengumuman di sini..."
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors disabled:opacity-50 border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || targetOptions.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center shadow-sm"
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
