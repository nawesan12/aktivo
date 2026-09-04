import { create } from "zustand";

/**
 * What is left of the UI store after the redesign.
 *
 * `sidebarOpen` / `toggleSidebar` were never read anywhere; `sidebarCollapsed`
 * went with the collapse toggle, which the 212px sidebar no longer needs; and
 * `mobileNavOpen` drove the panel's left drawer, replaced by a bottom bar. Only
 * the admin shell still opens a sheet.
 */
interface UIStore {
  adminMobileNavOpen: boolean;
  setAdminMobileNavOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  adminMobileNavOpen: false,
  setAdminMobileNavOpen: (open) => set({ adminMobileNavOpen: open }),
}));
