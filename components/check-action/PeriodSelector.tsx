'use client';

import React from 'react';
import { PeriodType } from '@/types';

interface PeriodSelectorProps {
  currentPeriod: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
}

const periodOptions: Array<{ label: string; value: PeriodType }> = [
  { label: '今日', value: 'today' },
  { label: '今週', value: 'this_week' },
  { label: '先週', value: 'last_week' },
  { label: '今月', value: 'this_month' },
];

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  currentPeriod,
  onPeriodChange,
}) => {
  // data-testid用のマッピング
  const getTestId = (value: PeriodType): string => {
    const mapping: Record<PeriodType, string> = {
      today: 'period-today',
      this_week: 'period-thisweek',
      last_week: 'period-lastweek',
      this_month: 'period-thismonth',
      last_month: 'period-lastmonth',
      custom: 'period-custom',
    };
    return mapping[value];
  };

  return (
    <div className="bg-[var(--bg-primary)] rounded-lg p-4 mb-6 shadow-sm">
      <div className="text-sm font-medium text-[var(--text-secondary)] mb-2">
        振り返り期間
      </div>
      <div className="grid grid-cols-4 gap-2">
        {periodOptions.map((option) => (
          <button
            key={option.value}
            data-testid={getTestId(option.value)}
            data-active={currentPeriod === option.value}
            onClick={() => onPeriodChange(option.value)}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium transition-all
              ${
                currentPeriod === option.value
                  ? 'bg-[var(--check-color)] text-white shadow-sm'
                  : 'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)] hover:border-[var(--check-color)]'
              }
            `}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};
