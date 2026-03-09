import { create } from "zustand";

interface UIStore {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  adminMobileNavOpen: boolean;
  toggleSidebar: () => void;
  toggleSidebarCollapsed: () => void;
  setMobileNavOpen: (open: boolean) => void;
  setAdminMobileNavOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  mobileNavOpen: false,
  adminMobileNavOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleSidebarCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  setAdminMobileNavOpen: (open) => set({ adminMobileNavOpen: open }),
}));
