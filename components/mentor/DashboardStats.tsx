'use client';

// 統計サマリーコンポーネント
// M-001: メンターダッシュボード
// デザインシステム準拠

import { useEffect, useState } from 'react';
import type { DashboardStatistics } from '@/types';

interface DashboardStatsProps {
  mentorId: string;
}

export function DashboardStats({ mentorId }: DashboardStatsProps) {
  const [stats, setStats] = useState<DashboardStatistics>({
    totalClients: 0,
    activeClients: 0,
    needsFollowUp: 0,
    averageProgress: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // @MOCK_TO_API: メンターダッシュボード統計データ取得
    // 本番: /api/mentor/dashboard から取得
    async function fetchStats() {
      try {
        const response = await fetch(`/api/mentor/dashboard?mentorId=${mentorId}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data.statistics);
        }
      } catch (error) {
        console.error('統計データの取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [mentorId]);

  const statCards = [
    {
      label: '担当クライアント総数',
      value: stats.totalClients,
      suffix: '人',
    },
    {
      label: 'アクティブクライアント',
      value: stats.activeClients,
      suffix: '人',
    },
    {
      label: '要フォロー',
      value: stats.needsFollowUp,
      suffix: '人',
    },
    {
      label: '平均進捗率',
      value: Math.round(stats.averageProgress),
      suffix: '%',
    },
  ];

  if (loading) {
    return (
      <section className="grid grid-cols-2 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg p-6 animate-pulse"
            style={{
              backgroundColor: 'var(--background)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </section>
    );
  }

  return (
    <section className="grid grid-cols-2 gap-4 mb-8">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="rounded-lg p-6"
          style={{
            backgroundColor: 'var(--background)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            className="text-sm mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            {stat.label}
          </div>
          <div className="text-[32px] font-bold" style={{ color: 'var(--primary)' }}>
            {stat.value}
            <span className="text-base ml-1" style={{ color: 'var(--text-secondary)' }}>
              {stat.suffix}
            </span>
          </div>
        </div>
      ))}
    </section>
  );
}

