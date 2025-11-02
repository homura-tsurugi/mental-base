'use client';

import React from 'react';
import { TaskWithGoal } from '@/types';

interface TaskItemProps {
  task: TaskWithGoal;
  onToggle: (id: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle }) => {
  const isCompleted = task.status === 'completed';

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-[var(--error-light)] text-[var(--error)]';
      case 'medium':
        return 'bg-[var(--warning-light)] text-[var(--warning)]';
      case 'low':
        return 'bg-[var(--success-light)] text-[var(--success)]';
      default:
        return 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return '';
    }
  };

  return (
    <div data-testid="task-item" className="flex items-start gap-3 py-4 border-b border-[var(--border-color)] last:border-b-0">
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isCompleted}
        onChange={() => onToggle(task.id)}
        data-testid="task-checkbox"
        className="w-5 h-5 mt-0.5 cursor-pointer flex-shrink-0 accent-[var(--primary)]"
      />

      {/* Task Content */}
      <div className="flex-1">
        <div
          data-testid="task-title"
          className={`text-sm font-medium mb-1 ${
            isCompleted
              ? 'line-through opacity-60 text-[var(--text-tertiary)]'
              : 'text-[var(--text-primary)]'
          }`}
        >
          {task.title}
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-[var(--text-tertiary)]">
          <span data-testid="task-priority" className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${getPriorityBadgeClass(task.priority)}`}>
            {getPriorityLabel(task.priority)}
          </span>
          {task.goalName && (
            <>
              <span>•</span>
              <span data-testid="task-goal-name">{task.goalName}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
