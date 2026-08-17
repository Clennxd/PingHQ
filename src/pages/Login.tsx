import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export const Login: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const navigate = useNavigate();
  const { checkSession } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const email = `${userId}@pinghq.local`;
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      await checkSession();
      
      setIsAnimating(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
      
    } catch (err: any) {
      setError('User ID atau Password yang Anda masukkan salah');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
      
      {/* PINTU KIRI (Branding) */}
      <div className={`fixed top-0 left-0 w-full md:w-1/2 h-full z-50 flex flex-col justify-center p-8 md:p-16 bg-blue-600 text-white transition-transform duration-1000 ease-in-out ${isAnimating ? '-translate-x-full' : 'translate-x-0'}`}>
        <div className="max-w-md mx-auto w-full text-center md:text-left">
          <h1 className="text-5xl font-bold tracking-tight mb-4 text-white">PingHQ</h1>
          <p className="text-xl text-blue-100 leading-relaxed">
            Realtime Team Broadcast & Memo Hub
          </p>
        </div>
      </div>

      {/* PINTU KANAN (Form Login) */}
      <div className={`fixed top-0 right-0 w-full md:w-1/2 h-full z-50 flex justify-center items-center p-8 bg-white dark:bg-slate-900 transition-transform duration-1000 ease-in-out ${isAnimating ? 'translate-x-full' : 'translate-x-0'}`}>
        <div className="w-full max-w-md">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="userId">
                User ID
              </label>
              <input
                id="userId"
                type="text"
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                placeholder="Enter your User ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isAnimating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-70 disabled:cursor-not-allowed mt-2 shadow-sm"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Karyawan Baru?{' '}
              <Link to="/join" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors">
                Gabung pakai Kode Undangan
              </Link>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Belum punya akun perusahaan?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors">
                Daftar di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
