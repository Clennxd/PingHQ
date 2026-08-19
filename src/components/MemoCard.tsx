import React, { useEffect, useState } from 'react';
import type { Memo } from '../store/memoStore';
import { MoreVertical, Bookmark, Eye } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useMemoStore } from '../store/memoStore';
import { ReadReceiptsModal } from './ReadReceiptsModal';

interface MemoCardProps {
  memo: Memo;
}

export const MemoCard: React.FC<MemoCardProps> = ({ memo }) => {
  const { profile } = useAuthStore();
  const { markMemoAsRead, getMemoReaders } = useMemoStore();
  const [isReceiptsOpen, setIsReceiptsOpen] = useState(false);
  const [readCount, setReadCount] = useState<number | null>(null);

  useEffect(() => {
    if (profile?.id) {
      markMemoAsRead(memo.id, profile.id);
    }
  }, [memo.id, profile?.id, markMemoAsRead]);

  useEffect(() => {
    // Optionally fetch read count
    const fetchReaders = async () => {
      const readers = await getMemoReaders(memo.id);
      setReadCount(readers.length);
    };
    fetchReaders();
  }, [memo.id, getMemoReaders]);

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'URGENT':
        return 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400';
      case 'TASK':
        return 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400';
      case 'INFO':
      default:
        return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 mb-4 shadow-sm transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
            {memo.profiles?.full_name?.charAt(0) || '?'}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-900 dark:text-white leading-tight">
                {memo.profiles?.full_name || 'Unknown User'}
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold tracking-wide border border-transparent ${getBadgeStyle(memo.type)}`}>
                {memo.type}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {formatDate(memo.created_at)}
            </p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800">
          <MoreVertical size={18} />
        </button>
      </div>
      
      {/* Body */}
      <div className="text-slate-700 dark:text-slate-300 mt-3 leading-relaxed break-words whitespace-pre-wrap text-sm md:text-base">
        {memo.message}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <div className="text-xs text-slate-400 dark:text-slate-500">
          {/* Ruang opsional untuk footer kiri */}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsReceiptsOpen(true)}
            className="flex items-center gap-1.5 text-xs md:text-sm text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors font-medium"
          >
            <Eye size={16} />
            <span>{readCount !== null ? `${readCount} Dilihat` : 'Dilihat'}</span>
          </button>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>
          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <Bookmark size={16} />
          </button>
        </div>
      </div>

      <ReadReceiptsModal 
        isOpen={isReceiptsOpen} 
        onClose={() => setIsReceiptsOpen(false)} 
        memoId={memo.id} 
      />
    </div>
  );
};
