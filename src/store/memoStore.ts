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
  departments?: { name: string } | null;
}

interface MemoState {
  memos: Memo[];
  isLoading: boolean;
  error: string | null;
  subscription: any;
  fetchMemos: (companyId: string, departmentId: string | null, userId: string) => Promise<void>;
  subscribeToMemos: (companyId: string, departmentId: string | null, userId: string) => void;
  unsubscribeMemos: () => void;
  createMemo: (payload: { company_id: string, department_id: string | null, sender_id: string, message: string, type: string }) => Promise<{ success: boolean; error?: string }>;
  markMemoAsRead: (memoId: string, userId: string) => Promise<void>;
  getMemoReaders: (memoId: string) => Promise<any[]>;
  unreadCount: number;
  resetUnreadCount: () => void;
}

export const useMemoStore = create<MemoState>((set, get) => ({
  memos: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  subscription: null,

  resetUnreadCount: () => set({ unreadCount: 0 }),

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

  markMemoAsRead: async (memoId, userId) => {
    try {
      const { error } = await supabase.from('memo_reads').upsert(
        { memo_id: memoId, user_id: userId },
        { onConflict: 'memo_id,user_id' }
      );
      if (error) throw error;
    } catch (error) {
      console.error('Error marking memo as read:', error);
    }
  },

  getMemoReaders: async (memoId) => {
    try {
      const { data, error } = await supabase
        .from('memo_reads')
        .select('read_at, profiles(full_name)')
        .eq('memo_id', memoId)
        .order('read_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching memo readers:', error);
      return [];
    }
  },

  fetchMemos: async (companyId, departmentId, userId) => {
    set({ isLoading: true, error: null });
    try {
      let orQuery = `department_id.is.null,sender_id.eq.${userId}`;
      if (departmentId) {
        orQuery += `,department_id.eq.${departmentId}`;
      }

      const { data, error } = await supabase
        .from('memos')
        .select('*, profiles(full_name), departments(name)')
        .eq('company_id', companyId)
        .or(orQuery)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      set({ memos: data as Memo[], isLoading: false });
    } catch (error: any) {
      console.error('Error fetching memos:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  subscribeToMemos: (companyId, departmentId, userId) => {
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
          if (
            newMemo.company_id === companyId && 
            (newMemo.department_id === null || 
             newMemo.department_id === departmentId || 
             newMemo.sender_id === userId)
          ) {
            
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

            // Fetch full memo details including relations
            const { data: memoDetails } = await supabase
              .from('memos')
              .select('*, profiles(full_name), departments(name)')
              .eq('id', newMemo.id)
              .single();
              
            if (memoDetails) {
              set((state) => ({
                memos: [memoDetails as Memo, ...state.memos],
                unreadCount: state.unreadCount + 1
              }));
            }
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
