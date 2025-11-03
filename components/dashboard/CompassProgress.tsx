'use client';

import React from 'react';
import { CompassProgress as CompassProgressType, CompassCard } from '@/types';
import { CompassProgressCard } from './CompassProgressCard';

interface CompassProgressProps {
  progress: CompassProgressType;
}

export const CompassProgress: React.FC<CompassProgressProps> = ({ progress }) => {
  const compassCards: CompassCard[] = [
    {
      phase: 'plan',
      label: 'PLAN',
      sublabel: '計画',
      progress: progress.planProgress,
      color: 'var(--plan-color)',
    },
    {
      phase: 'do',
      label: 'DO',
      sublabel: '実行',
      progress: progress.doProgress,
      color: 'var(--do-color)',
    },
    {
      phase: 'check',
      label: 'Check',
      sublabel: '振り返り',
      progress: progress.checkProgress,
      color: 'var(--check-color)',
    },
    {
      phase: 'action',
      label: 'Action',
      sublabel: '改善',
      progress: progress.actionProgress,
      color: 'var(--action-color)',
    },
  ];

  return (
    <section className="mb-6">
      <h2 className="text-lg font-bold mb-4 text-[var(--text-primary)]" data-testid="compass-summary-title">
        COM:PASS進捗サマリー
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {compassCards.map((card) => (
          <CompassProgressCard key={card.phase} card={card} />
        ))}
      </div>
    </section>
  );
};
