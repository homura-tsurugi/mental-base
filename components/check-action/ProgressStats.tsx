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
      testId: 'stat-achievement-rate',
    },
    {
      value: stats.completedTasks,
      label: '完了タスク',
      color: 'var(--do-color)',
      testId: 'stat-completed-tasks',
    },
    {
      value: stats.logDays,
      label: 'ログ記録日数',
      color: 'var(--primary)',
      testId: 'stat-log-days',
    },
    {
      value: stats.activeGoals,
      label: '目標進行中',
      color: 'var(--action-color)',
      testId: 'stat-active-goals',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {statItems.map((item, index) => (
        <div
          key={index}
          data-testid="stats-card"
          className="bg-[var(--bg-primary)] rounded-lg p-4 shadow-sm text-center"
        >
          <div
            data-testid={item.testId}
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
