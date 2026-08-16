import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';

interface Option {
  id: string;
  name: string;
}

interface CustomDropdownProps {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  isLoading = false,
  placeholder = 'Pilih Opsi',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left min-w-[130px] md:min-w-[150px]" ref={dropdownRef}>
      <button
        type="button"
        disabled={isLoading}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-70 transition-all shadow-sm"
      >
        <span className="truncate mr-2 font-medium">
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-blue-500" />
        ) : (
          <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && !isLoading && (
        <div className="absolute z-50 mt-1 w-full min-w-[150px] bg-white dark:bg-slate-800 shadow-lg rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden right-0 animate-in fade-in zoom-in-95 duration-100">
          <ul className="max-h-48 overflow-y-auto py-1">
            {options.map((opt) => (
              <li
                key={opt.id}
                onClick={() => {
                  onChange(opt.id);
                  setIsOpen(false);
                }}
                className={`px-3 py-2 text-xs cursor-pointer transition-colors ${
                  opt.id === value
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`}
              >
                {opt.name}
              </li>
            ))}
            {options.length === 0 && (
              <li className="px-3 py-2 text-xs text-slate-500 italic text-center">
                Tidak ada opsi
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
