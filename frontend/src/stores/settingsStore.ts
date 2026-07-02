import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  privilegeCategories: string[]
  addPrivilegeCategory: (category: string) => void
  removePrivilegeCategory: (category: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      privilegeCategories: ['VIP', 'HNW', 'Employee'],
      addPrivilegeCategory: (category) =>
        set((state) => ({
          privilegeCategories: state.privilegeCategories.includes(category)
            ? state.privilegeCategories
            : [...state.privilegeCategories, category],
        })),
      removePrivilegeCategory: (category) =>
        set((state) => ({
          privilegeCategories: state.privilegeCategories.filter((c) => c !== category),
        })),
    }),
    {
      name: 'settings-storage', // name of item in the storage (must be unique)
    }
  )
)
