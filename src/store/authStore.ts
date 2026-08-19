import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'SENIOR_SPV' | 'SPV' | 'STAFF';
  companies?: any;
  departments?: any;
  [key: string]: any;
}

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  showLoginAnimation: boolean;
  setShowLoginAnimation: (val: boolean) => void;
  checkSession: () => Promise<void>;
  logout: () => Promise<void>;
  register: (companyName: string, fullName: string, username: string, password: string) => Promise<void>;
  joinCompany: (inviteCode: string, fullName: string, username: string, password: string) => Promise<void>;
  updateProfileName: (newName: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  verifyOldPassword: (oldPassword: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  isLoading: true,
  showLoginAnimation: false,
  setShowLoginAnimation: (val) => set({ showLoginAnimation: val }),

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

  register: async (companyName, fullName, username, password) => {
    set({ isLoading: true });
    try {
      console.log("1. Memulai SignUp...");
      const safeUsername = username.toLowerCase().replace(/\s+/g, '');
      const email = safeUsername + '@pinghq.local';
      
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw new Error("Auth Error: " + authError.message);
      if (!authData.user) throw new Error("User tidak berhasil dibuat oleh Supabase.");
      
      console.log("2. SignUp Sukses. ID:", authData.user.id);
      
      const newInviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data: company, error: companyError } = await supabase.from('companies').insert({ name: companyName, invite_code: newInviteCode }).select().single();
      if (companyError) throw new Error("Company Error: " + companyError.message);
      
      const { data: dept, error: deptError } = await supabase.from('departments').insert({ company_id: company.id, name: 'Pusat' }).select().single();
      if (deptError) throw new Error("Dept Error: " + deptError.message);
      
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        user_id_login: safeUsername,
        company_id: company.id,
        department_id: dept.id,
        full_name: fullName,
        role: 'ADMIN'
      });
      if (profileError) throw new Error("Profile Error: " + profileError.message);
      
      console.log("3. Semua Insert Sukses!");
      await get().checkSession();
    } catch (error: any) {
      console.error("REGISTER GAGAL:", error);
      alert("ERROR REGISTER: " + error.message); // PAKSA MUNCUL POP-UP
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  joinCompany: async (inviteCode, fullName, username, password) => {
    set({ isLoading: true });
    try {
      console.log("1. Memulai Join Company...");
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('invite_code', inviteCode.toUpperCase())
        .single();
        
      if (companyError || !company) throw new Error("Kode Undangan tidak valid!");
      
      const { data: dept } = await supabase
        .from('departments')
        .select('id')
        .eq('company_id', company.id)
        .limit(1)
        .single();
        
      const safeUsername = username.toLowerCase().replace(/\s+/g, '');
      const email = safeUsername + '@pinghq.local';
      
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw new Error("Auth Error: " + authError.message);
      if (!authData.user) throw new Error("User tidak berhasil dibuat oleh Supabase.");
      
      console.log("2. SignUp Sukses. ID:", authData.user.id);
      
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        user_id_login: safeUsername,
        company_id: company.id,
        department_id: dept?.id || null,
        full_name: fullName,
        role: 'STAFF'
      });
      if (profileError) throw new Error("Profile Error: " + profileError.message);
      
      console.log("3. Semua Insert Sukses!");
      await get().checkSession();
    } catch (error: any) {
      console.error("JOIN GAGAL:", error);
      alert("ERROR JOIN: " + error.message);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfileName: async (newName: string) => {
    const session = get().session;
    if (!session) throw new Error("No active session");
    
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: newName })
      .eq('id', session.user.id);
      
    if (error) throw error;
    await get().checkSession();
  },

  updatePassword: async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  verifyOldPassword: async (oldPassword: string) => {
    const session = get().session;
    if (!session || !session.user.email) throw new Error("Sesi tidak valid");
    
    // Coba login ulang diam-diam untuk verifikasi password lama
    const { error } = await supabase.auth.signInWithPassword({
      email: session.user.email,
      password: oldPassword
    });
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error("Password lama salah.");
      }
      throw error;
    }
    return true;
  }
}));
