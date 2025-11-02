'use client';

import React from 'react';
import { GoalWithProgress } from '@/types';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface GoalCardProps {
  goal: GoalWithProgress;
  onEdit: (goal: GoalWithProgress) => void;
  onDelete: (id: string) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onEdit, onDelete }) => {
  const formatDate = (date?: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <Card className="p-4 mb-4 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] flex-1">
          {goal.title}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(goal)}
            className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors"
            title="編集"
          >
            <span className="material-icons text-[var(--text-secondary)] text-lg">edit</span>
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors"
            title="削除"
          >
            <span className="material-icons text-[var(--text-secondary)] text-lg">delete</span>
          </button>
        </div>
      </div>

      {/* Description */}
      {goal.description && (
        <p className="text-sm text-[var(--text-secondary)] mb-2 leading-relaxed">
          {goal.description}
        </p>
      )}

      {/* Meta Info */}
      <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] mb-3">
        <span className="material-icons text-base">event</span>
        <span>期限: {formatDate(goal.deadline)}</span>
      </div>

      {/* Progress Bar */}
      <Progress value={goal.progressPercentage} className="h-2 mb-2" />

      {/* Progress Text */}
      <p className="text-xs text-[var(--text-secondary)]">
        進捗: {goal.progressPercentage}% ({goal.completedTasks}/{goal.totalTasks} タスク完了)
      </p>
    </Card>
  );
};
