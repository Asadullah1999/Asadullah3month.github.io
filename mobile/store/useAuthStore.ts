import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile, getUserProfile, createUserProfile } from '../lib/database';

type AuthState = {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  loadSession: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  loading: true,

  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),

  loadSession: async () => {
    set({ loading: true });
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    set({ session });
    if (session?.user) {
      const profile = await getUserProfile(session.user.id);
      set({ profile });
    }
    set({ loading: false });

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session });
      if (session?.user) {
        const profile = await getUserProfile(session.user.id);
        set({ profile });
      } else {
        set({ profile: null });
      }
    });
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) {
      const profile = await getUserProfile(data.user.id);
      set({ session: data.session, profile });
    }
  },

  signUp: async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      await createUserProfile(data.user.id, email, fullName);
      const profile = await getUserProfile(data.user.id);
      set({ session: data.session, profile });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null });
  },

  refreshProfile: async () => {
    const { session } = get();
    if (session?.user) {
      const profile = await getUserProfile(session.user.id);
      set({ profile });
    }
  },
}));
