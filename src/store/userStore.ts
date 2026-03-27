import { create } from 'zustand';
import type { User } from '../types';

interface UserState {
  user: User | null;
  loading: boolean;
  language: 'ko' | 'en';
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setLanguage: (lang: 'ko' | 'en') => void;
  updateStats: (newStats: Partial<User['stats']>) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  loading: true,
  language: (localStorage.getItem('ql_lang') as 'ko' | 'en') || 'ko',
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  setLanguage: (lang) => {
    localStorage.setItem('ql_lang', lang);
    set({ language: lang });
  },
  updateStats: (newStats) =>
    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            stats: { ...state.user.stats, ...newStats },
          }
        : null,
    })),
}));
