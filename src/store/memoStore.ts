import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export interface Memo {
  id: string;
  company_id: string;
  department_id: string | null;
  sender_id: string;
  message: string;
  type: 'URGENT' | 'TASK' | 'INFO';
  created_at: string;
  profiles?: { full_name: string } | null;
}

interface MemoState {
  memos: Memo[];
  isLoading: boolean;
  error: string | null;
  subscription: any;
  fetchMemos: (companyId: string, departmentId: string | null) => Promise<void>;
  subscribeToMemos: (companyId: string, departmentId: string | null) => void;
  unsubscribeMemos: () => void;
  createMemo: (payload: { company_id: string, department_id: string | null, sender_id: string, message: string, type: string }) => Promise<{ success: boolean; error?: string }>;
}

export const useMemoStore = create<MemoState>((set, get) => ({
  memos: [],
  isLoading: false,
  error: null,
  subscription: null,

  createMemo: async (payload) => {
    try {
      const { error } = await supabase.from('memos').insert(payload);
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error creating memo:', error);
      return { success: false, error: error.message };
    }
  },

  fetchMemos: async (companyId, departmentId) => {
    set({ isLoading: true, error: null });
    try {
      let query = supabase
        .from('memos')
        .select('*, profiles(full_name)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (departmentId) {
        query = query.or(`department_id.eq.${departmentId},department_id.is.null`);
      } else {
        query = query.is('department_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      set({ memos: data as Memo[], isLoading: false });
    } catch (error: any) {
      console.error('Error fetching memos:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  subscribeToMemos: (companyId, departmentId) => {
    // Prevent multiple subscriptions
    if (get().subscription) {
      get().unsubscribeMemos();
    }

    const channel = supabase.channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'memos' },
        async (payload) => {
          const newMemo = payload.new as Memo;
          
          // Check if it belongs to this company and department
          if (newMemo.company_id === companyId && 
              (newMemo.department_id === departmentId || newMemo.department_id === null)) {
            
            // Play notification sound
            const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg'); 
            audio.play().catch(e => console.log("Audio play blocked by browser", e));

            // Show toast notification
            if (newMemo.type === 'URGENT') {
              toast.error('🚨 URGENT: ' + newMemo.message);
            } else if (newMemo.type === 'TASK') {
              toast.success('✅ TASK: ' + newMemo.message);
            } else {
              toast.info('ℹ️ INFO: ' + newMemo.message);
            }

            // Fetch profile for this memo to get full_name
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', newMemo.sender_id)
              .single();
              
            const memoWithProfile = {
              ...newMemo,
              profiles: profileData
            };
            
            set((state) => ({
              memos: [memoWithProfile as Memo, ...state.memos]
            }));
          }
        }
      )
      .subscribe();
      
    set({ subscription: channel });
  },

  unsubscribeMemos: () => {
    const { subscription } = get();
    if (subscription) {
      supabase.removeChannel(subscription);
      set({ subscription: null });
    }
  }
}));
