'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { UserDisplay } from '@/types';

interface MainLayoutProps {
  children: React.ReactNode;
  user?: UserDisplay;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, user: userProp }) => {
  const pathname = usePathname();
  const { data: session } = useSession();

  // イニシャル生成ヘルパー
  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return parts.map(part => part[0]).join('').substring(0, 2).toUpperCase();
  };

  // userPropが渡されていればそれを使用、なければセッションから取得
  const user: UserDisplay | null = userProp || (session?.user
    ? {
        id: session.user.id || 'unknown',
        email: session.user.email || '',
        name: session.user.name || 'Unknown User',
        initials: getInitials(session.user.name || 'U'),
        createdAt: new Date(),
        updatedAt: new Date(),
        role: session.user.role || 'client',
        isMentor: session.user.isMentor || false,
        expertise: [],
      }
    : null);

  // 基本ナビゲーションアイテム
  const baseNavigationItems = [
    { id: 'home', label: 'ホーム', icon: 'home', href: '/client' },
    { id: 'plan-do', label: '計画/実行', icon: 'assignment', href: '/client/plan-do' },
    { id: 'check-action', label: '確認/改善', icon: 'analytics', href: '/client/check-action' },
    { id: 'ai-assistant', label: '学習', icon: 'school', href: '/client/ai-assistant' },
    { id: 'settings', label: '設定', icon: 'settings', href: '/client/settings' },
  ];

  // メンターロールの場合、メンターダッシュボードを追加
  const navigationItems = user?.isMentor
    ? [
        ...baseNavigationItems.slice(0, 4), // ホーム〜学習まで
        { id: 'mentor', label: 'メンター', icon: 'groups', href: '/admin' },
        baseNavigationItems[4], // 設定
      ]
    : baseNavigationItems;

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] max-w-full sm:max-w-[600px] mx-auto">
      {/* Header */}
      <header className="sticky top-0 bg-[var(--bg-primary)] border-b border-[var(--border-color)] px-4 py-3 flex items-center justify-between shadow-sm z-[100]">
        <div className="flex items-center gap-2">
          <span className="material-icons text-[var(--primary)] text-xl">hub</span>
          <span className="text-xl font-bold text-[var(--primary)]">COM:PASS</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full hover:bg-[var(--bg-tertiary)] transition-colors">
            <span className="material-icons text-[var(--text-secondary)]">notifications</span>
          </button>
          {user && (
            <Link
              href="/client/settings"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
              data-testid="user-account-link"
            >
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium text-[var(--text-primary)]" data-testid="user-name">
                  {user.name}
                </div>
                <div className="text-xs text-[var(--text-tertiary)]" data-testid="user-email">
                  {user.email}
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white text-sm font-medium" data-testid="user-initials">
                {user.initials}
              </div>
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full md:max-w-[600px] bg-[var(--bg-primary)] border-t border-[var(--border-color)] shadow-[0_-2px_10px_rgba(0,0,0,0.05)] flex justify-around py-2 z-[100]">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-2 py-1 min-w-[60px] transition-colors ${
                isActive ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)] hover:text-[var(--primary-light)]'
              }`}
            >
              <span className="material-icons text-2xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* FAB Button */}
      <button className="fixed bottom-20 right-5 w-14 h-14 rounded-full bg-[var(--primary)] text-white shadow-lg hover:bg-[var(--primary-light)] hover:scale-110 active:scale-95 transition-all z-[50] flex items-center justify-center">
        <span className="material-icons">add</span>
      </button>
    </div>
  );
};
