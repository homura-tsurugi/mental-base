'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { CompassProgress } from '@/components/dashboard/CompassProgress';
import { TodayTasks } from '@/components/dashboard/TodayTasks';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { useDashboardData } from '@/hooks/useDashboardData';
import { UserDisplay } from '@/types';

export default function Home() {
  const { data: session, status } = useSession();
  const { data, loading, error, toggleTaskComplete } = useDashboardData();

  // セッションからユーザー情報を取得
  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return parts.map(part => part[0]).join('').substring(0, 2).toUpperCase();
  };

  const user: UserDisplay | null = session?.user
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
    : null;

  // セッション読み込み中またはユーザー情報がない場合
  if (status === 'loading' || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
          <p className="text-[var(--text-tertiary)]">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <MainLayout user={user}>
        <div className="flex items-center justify-center min-h-[50vh]" data-testid="dashboard-loading">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4" data-testid="dashboard-loading-spinner"></div>
            <p className="text-[var(--text-tertiary)]" data-testid="dashboard-loading-text">読み込み中...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout user={user}>
        <div className="px-6 py-6">
          <div
            className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800"
            data-testid="dashboard-error"
          >
            <div data-testid="api-error" style={{ display: 'none' }}></div>
            <p className="font-medium" data-testid="error-message">エラーが発生しました</p>
            <p className="text-sm mt-1" data-testid="error-detail">{error.message}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!data) {
    return (
      <MainLayout user={user}>
        <div className="px-6 py-6">
          <p className="text-[var(--text-tertiary)]" data-testid="no-data-message">データがありません</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout user={user}>
      <div className="px-6 py-6" data-testid="dashboard-container">
        {/* COM:PASS Progress Summary */}
        <CompassProgress progress={data.compassSummary} />

        {/* Today's Tasks */}
        <TodayTasks tasks={data.todayTasks} onToggleComplete={toggleTaskComplete} />

        {/* Recent Activities */}
        <RecentActivities activities={data.recentActivities} />
      </div>
    </MainLayout>
  );
}
