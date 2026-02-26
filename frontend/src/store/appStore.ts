import { create } from 'zustand';
import { User, Role } from '../types';

interface AppState {
  sidebarOpen: boolean;
  selectedUsers: User[];
  selectedRoles: Role[];
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSelectedUsers: (users: User[]) => void;
  setSelectedRoles: (roles: Role[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  selectedUsers: [],
  selectedRoles: [],
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  setSelectedUsers: (users: User[]) => set({ selectedUsers: users }),
  setSelectedRoles: (roles: Role[]) => set({ selectedRoles: roles }),
}));
