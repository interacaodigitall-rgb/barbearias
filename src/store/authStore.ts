import { create } from 'zustand';
import { User } from '../models';

interface AuthState {
  user: User | null;
  isDemo: boolean;
  setUser: (user: User | null, isDemo?: boolean) => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isDemo: false,
  setUser: (user, isDemo = false) => set({ user, isDemo }),
  isLoading: true,
  setLoading: (loading) => set({ isLoading: loading }),
}));
