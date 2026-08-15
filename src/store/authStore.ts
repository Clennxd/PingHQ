import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  role: string;
  companies?: any;
  departments?: any;
  [key: string]: any;
}

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  checkSession: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  isLoading: true,

  checkSession: async () => {
    set({ isLoading: true });
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log("Session Check Result:", session);

      if (sessionError) throw sessionError;

      if (session) {
        // Ambil data profile beserta relasinya jika ada
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select(`
            *,
            companies (*),
            departments (*)
          `)
          .eq('id', session.user.id)
          .maybeSingle();

        console.log("Profile Fetch Result:", profileData, profileError);

        if (profileError) {
          console.error("Supabase Query Error:", profileError.message, profileError.details, profileError.hint);
        }

        set({ session, profile: profileData as Profile | null });
      } else {
        set({ session: null, profile: null });
      }
    } catch (error) {
      console.error('Error checking session:', error);
      set({ session: null, profile: null });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut();
      set({ session: null, profile: null });
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
