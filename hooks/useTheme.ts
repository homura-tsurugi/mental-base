'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/stores/themeStore';

export function useTheme() {
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    // テーマをHTMLのdata属性に適用
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return { theme, setTheme };
}

// テーマ情報の定義
export const themes = [
  {
    id: 'professional' as const,
    name: 'Professional & Clean',
    description: '洗練されたビジネス向けデザイン',
    color: '#3b82f6',
  },
  {
    id: 'warm' as const,
    name: 'Warm & Motivational',
    description: '温かみのあるモチベーション重視',
    color: '#fb923c',
  },
  {
    id: 'modern' as const,
    name: 'Modern & Vibrant',
    description: '活気あるモダンなデザイン',
    color: '#c084fc',
  },
  {
    id: 'calm' as const,
    name: 'Calm & Focused',
    description: '集中力を高める落ち着いたデザイン',
    color: '#4ade80',
  },
] as const;
