'use client';

import React from 'react';
import { ProgressStats as ProgressStatsType } from '@/types';

interface ProgressStatsProps {
  stats: ProgressStatsType;
}

export const ProgressStats: React.FC<ProgressStatsProps> = ({ stats }) => {
  const statItems = [
    {
      value: `${stats.achievementRate}%`,
      label: '達成率',
      color: 'var(--check-color)',
    },
    {
      value: stats.completedTasks,
      label: '完了タスク',
      color: 'var(--do-color)',
    },
    {
      value: stats.logDays,
      label: 'ログ記録日数',
      color: 'var(--primary)',
    },
    {
      value: stats.activeGoals,
      label: '目標進行中',
      color: 'var(--action-color)',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {statItems.map((item, index) => (
        <div
          key={index}
          className="bg-[var(--bg-primary)] rounded-lg p-4 shadow-sm text-center"
        >
          <div
            className="text-3xl font-bold mb-1"
            style={{ color: item.color }}
          >
            {item.value}
          </div>
          <div className="text-sm text-[var(--text-secondary)]">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
};
