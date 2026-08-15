import React, { useState } from 'react';
import { useMemoStore } from '../store/memoStore';
import type { Profile } from '../store/authStore';

interface CreateMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
}

export const CreateMemoModal: React.FC<CreateMemoModalProps> = ({ isOpen, onClose, profile }) => {
  const [target, setTarget] = useState<string>('DEPARTMENT');
  const [type, setType] = useState<string>('INFO');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { createMemo } = useMemoStore();

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
    const department_id = target === 'DEPARTMENT' ? (profile.department_id || profile.departments?.id || null) : null;
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
      setTarget('DEPARTMENT');
      setType('INFO');
      onClose();
    } else {
      setError(result.error || 'Gagal membuat pengumuman.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131926] rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-[#1E293B]">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Buat Pengumuman</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md text-sm border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-3 py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="DEPARTMENT" className="text-gray-900">Departemen Internal</option>
              <option value="COMPANY" className="text-gray-900">Seluruh Perusahaan</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipe</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="INFO" className="text-blue-600 font-semibold">INFO</option>
              <option value="URGENT" className="text-red-600 font-semibold">URGENT</option>
              <option value="TASK" className="text-green-600 font-semibold">TASK</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pesan</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="Tulis pengumuman di sini..."
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
