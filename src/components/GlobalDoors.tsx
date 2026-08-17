import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';

export const GlobalDoors: React.FC = () => {
  const { showLoginAnimation, setShowLoginAnimation } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (showLoginAnimation) {
      setIsOpen(false);
      
      const openTimer = setTimeout(() => {
        setIsOpen(true);
      }, 100);

      const closeTimer = setTimeout(() => {
        setShowLoginAnimation(false);
      }, 1200);

      return () => {
        clearTimeout(openTimer);
        clearTimeout(closeTimer);
      };
    }
  }, [showLoginAnimation, setShowLoginAnimation]);

  if (!showLoginAnimation) return null;
  
  return (
    <div className="fixed inset-0 z-[99999] pointer-events-none flex overflow-hidden">
      {/* Pintu Kiri */}
      <div className={`w-1/2 h-full bg-blue-600 flex justify-end items-center p-2 md:p-8 transition-transform duration-1000 ease-in-out ${isOpen ? '-translate-x-full' : 'translate-x-0'}`}>
        <h1 className="text-white text-5xl md:text-7xl font-bold">Ping</h1>
      </div>
      {/* Pintu Kanan */}
      <div className={`w-1/2 h-full bg-white dark:bg-slate-900 flex justify-start items-center p-2 md:p-8 transition-transform duration-1000 ease-in-out ${isOpen ? 'translate-x-full' : 'translate-x-0'}`}>
        <h1 className="text-blue-600 text-5xl md:text-7xl font-bold">HQ</h1>
      </div>
    </div>
  );
};
