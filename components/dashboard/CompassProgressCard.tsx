'use client';

import React from 'react';
import { CompassCard } from '@/types';

interface CompassProgressCardProps {
  card: CompassCard;
}

export const CompassProgressCard: React.FC<CompassProgressCardProps> = ({ card }) => {
  // SVG円の周囲長 (r=32の円周: 2 * π * 32 ≈ 201)
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (card.progress / 100) * circumference;

  return (
    <div className="bg-[var(--bg-primary)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] p-4 text-center transition-transform duration-150 active:scale-[0.98]" data-testid={`compass-card-${card.phase}`}>
      {/* Progress Circle */}
      <div className="w-20 h-20 mx-auto mb-2 relative" data-testid={`compass-progress-${card.phase}`}>
        <svg width="80" height="80" className="transform -rotate-90">
          {/* Background Circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="var(--bg-tertiary)"
            strokeWidth="8"
          />
          {/* Progress Circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke={card.color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        {/* Progress Text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-bold text-[var(--text-primary)]" data-testid="compass-percentage">
          {card.progress}%
        </div>
      </div>

      {/* Labels */}
      <div className="text-base font-bold mb-1 text-[var(--text-primary)]" data-testid="compass-label">
        {card.label}
      </div>
      <div className="text-xs text-[var(--text-tertiary)]" data-testid="compass-sublabel">
        {card.sublabel}
      </div>
    </div>
  );
};
