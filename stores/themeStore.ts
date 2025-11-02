import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'professional' | 'warm' | 'modern' | 'calm';

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'professional', // デフォルトはテーマ1
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'mental-base-theme',
    }
  )
);
