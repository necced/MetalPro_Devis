import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Client, Materiau, Devis, AppSettings } from '../types';

interface AppState {
  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Enterprise settings (from AppSettings)
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;

  // Active selections
  activeDevisId: number | null;
  setActiveDevisId: (id: number | null) => void;
  activeClientId: number | null;
  setActiveClientId: (id: number | null) => void;

  // Offline sync status
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  pendingSyncCount: number;
  setPendingSyncCount: (count: number) => void;
  incrementPendingSync: () => void;
  decrementPendingSync: () => void;
}

const defaultSettings: AppSettings = {
  entrepriseNom: 'MetalPro SARL',
  entrepriseAdresse: '',
  entrepriseTelephone: '',
  entrepriseEmail: '',
  entrepriseNif: '',
  entrepriseRc: '',
  devise: 'FCFA',
  numeroDevisPrefix: 'DEV',
  tvaDefaultRate: 0.1925,
  tvaDefaultMode: 'avec',
  theme: 'system',
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // UI State
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      // Theme
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      // Settings
      settings: defaultSettings,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      // Active selections
      activeDevisId: null,
      setActiveDevisId: (id) => set({ activeDevisId: id }),
      activeClientId: null,
      setActiveClientId: (id) => set({ activeClientId: id }),

      // Offline sync
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      setIsOnline: (online) => set({ isOnline: online }),
      pendingSyncCount: 0,
      setPendingSyncCount: (count) => set({ pendingSyncCount: count }),
      incrementPendingSync: () =>
        set((state) => ({ pendingSyncCount: state.pendingSyncCount + 1 })),
      decrementPendingSync: () =>
        set((state) => ({ pendingSyncCount: Math.max(0, state.pendingSyncCount - 1) })),
    }),
    {
      name: 'metalpro-app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        settings: state.settings,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);

// Initialize online/offline listeners
if (typeof window !== 'undefined') {
  const store = useAppStore.getState();
  window.addEventListener('online', () => store.setIsOnline(true));
  window.addEventListener('offline', () => store.setIsOnline(false));
}
