import React, { useEffect, useState } from 'react';
import { useMemoStore } from '../store/memoStore';
import { X, Loader2 } from 'lucide-react';

interface ReadReceiptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  memoId: string;
}

export const ReadReceiptsModal: React.FC<ReadReceiptsModalProps> = ({ isOpen, onClose, memoId }) => {
  const { getMemoReaders } = useMemoStore();
  const [readers, setReaders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchReaders = async () => {
        setIsLoading(true);
        const data = await getMemoReaders(memoId);
        setReaders(data);
        setIsLoading(false);
      };
      fetchReaders();
    }
  }, [isOpen, memoId, getMemoReaders]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700/50">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Dilihat oleh</h3>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 p-1.5 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-2 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : readers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400 text-sm">Belum ada yang membaca memo ini.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {readers.map((reader, idx) => (
                <li key={idx} className="flex justify-between items-center py-3 px-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                      {reader.profiles?.full_name?.charAt(0) || '?'}
                    </div>
                    <span className="font-medium text-sm text-slate-800 dark:text-slate-200">
                      {reader.profiles?.full_name || 'Unknown User'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {new Date(reader.read_at).toLocaleString('id-ID', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
