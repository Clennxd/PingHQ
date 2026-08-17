import React, { useEffect, useState } from 'react';
import type { Memo } from '../store/memoStore';
import { AlertCircle, CheckCircle2, Info, Eye } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useMemoStore } from '../store/memoStore';
import { ReadReceiptsModal } from './ReadReceiptsModal';

interface MemoCardProps {
  memo: Memo;
}

export const MemoCard: React.FC<MemoCardProps> = ({ memo }) => {
  const { profile } = useAuthStore();
  const { markMemoAsRead } = useMemoStore();
  const [isReceiptsOpen, setIsReceiptsOpen] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      markMemoAsRead(memo.id, profile.id);
    }
  }, [memo.id, profile?.id, markMemoAsRead]);

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'URGENT':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'TASK':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'INFO':
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'URGENT':
        return <AlertCircle className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1" />;
      case 'TASK':
        return <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1" />;
      case 'INFO':
      default:
        return <Info className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1" />;
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
    <div className="bg-white dark:bg-[#131926] rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-[#1E293B] mb-4 transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-3 md:mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold mr-3 md:mr-4 shrink-0 text-sm md:text-base">
            {memo.profiles?.full_name?.charAt(0) || '?'}
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm md:text-base leading-tight">
              {memo.profiles?.full_name || 'Unknown User'}
            </h4>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {formatDate(memo.created_at)}
            </p>
          </div>
        </div>
        <div className={`flex items-center px-2 py-0.5 rounded-full text-[10px] md:text-xs font-semibold border shrink-0 ml-2 uppercase tracking-wide ${getBadgeStyle(memo.type)}`}>
          {getIcon(memo.type)}
          {memo.type}
        </div>
      </div>
      
      <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-sm md:text-base leading-relaxed md:leading-normal mt-2 md:mt-3 break-words">
        {memo.message}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-end">
        <button 
          onClick={() => setIsReceiptsOpen(true)}
          className="flex items-center gap-1.5 text-xs md:text-sm text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors font-medium"
        >
          <Eye size={14} />
          Riwayat Dilihat
        </button>
      </div>

      <ReadReceiptsModal 
        isOpen={isReceiptsOpen} 
        onClose={() => setIsReceiptsOpen(false)} 
        memoId={memo.id} 
      />
    </div>
  );
};
