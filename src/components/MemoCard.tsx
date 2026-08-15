import React from 'react';
import type { Memo } from '../store/memoStore';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface MemoCardProps {
  memo: Memo;
}

export const MemoCard: React.FC<MemoCardProps> = ({ memo }) => {
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
        return <AlertCircle className="w-4 h-4 mr-1.5" />;
      case 'TASK':
        return <CheckCircle2 className="w-4 h-4 mr-1.5" />;
      case 'INFO':
      default:
        return <Info className="w-4 h-4 mr-1.5" />;
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
    <div className="bg-white dark:bg-[#131926] rounded-lg p-4 shadow-sm border border-gray-100 dark:border-[#1E293B] mb-4 transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold mr-3">
            {memo.profiles?.full_name?.charAt(0) || '?'}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              {memo.profiles?.full_name || 'Unknown User'}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(memo.created_at)}
            </p>
          </div>
        </div>
        <div className={`flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getBadgeStyle(memo.type)}`}>
          {getIcon(memo.type)}
          {memo.type}
        </div>
      </div>
      
      <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
        {memo.message}
      </div>
    </div>
  );
};
