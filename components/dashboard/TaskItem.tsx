'use client';

import React, { useState } from 'react';
import { TaskWithGoal } from '@/types';

interface TaskItemProps {
  task: TaskWithGoal;
  index: number;
  onToggleComplete: (taskId: string, completed: boolean) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, index, onToggleComplete }) => {
  const [isCompleted, setIsCompleted] = useState(task.status === 'completed');

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const completed = e.target.checked;
    setIsCompleted(completed);
    onToggleComplete(task.id, completed);
  };

  return (
    <div
      className={`
        flex items-start gap-4 p-4 bg-[var(--bg-primary)] rounded-[var(--radius-md)]
        mb-2 shadow-[var(--shadow-sm)] transition-[box-shadow,transform] duration-150 cursor-pointer
        hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5
        ${isCompleted ? 'opacity-60' : ''}
      `}
      data-testid={`task-item-${index}`}
      data-priority={task.priority}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isCompleted}
        onChange={handleCheckboxChange}
        onClick={(e) => e.stopPropagation()}
        className="
          w-5 h-5 mt-0.5 border-2 border-[var(--border-dark)] rounded-[var(--radius-sm)]
          cursor-pointer flex-shrink-0
          checked:bg-[var(--success)] checked:border-[var(--success)]
          transition-colors
        "
        data-testid="task-checkbox"
      />

      {/* Task Content */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          {/* Priority Indicator */}
          <div
            className={`
              w-2 h-2 rounded-full flex-shrink-0
              ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}
            `}
            data-testid="task-priority-indicator"
            data-priority={task.priority}
          />
          <div
            className={`
              text-base font-medium
              ${isCompleted ? 'line-through text-[var(--text-disabled)]' : 'text-[var(--text-primary)]'}
            `}
            data-testid="task-title"
          >
            {task.title}
          </div>
        </div>

        {/* Task Meta */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Goal Badge */}
          {task.goalName && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)]" data-testid="task-goal-badge">
              <span className="material-icons md-18 mr-1">flag</span>
              {task.goalName}
            </span>
          )}

          {/* Scheduled Time Badge */}
          {task.scheduledTime && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)]" data-testid="task-time-badge">
              <span className="material-icons md-18 mr-1">schedule</span>
              {task.scheduledTime}
            </span>
          )}
        </div>
      </div>

      {/* Task Actions */}
      <div className="flex gap-1 flex-shrink-0">
        <button
          className="
            w-8 h-8 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)]
            text-[var(--text-secondary)] flex items-center justify-center
            hover:bg-[var(--primary)] hover:text-white transition-all
          "
          onClickCapture={(e) => {
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            // タスク実行機能（将来実装）
          }}
          data-testid="task-play-button"
        >
          <span className="material-icons md-18">play_arrow</span>
        </button>
        <button
          className="
            w-8 h-8 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)]
            text-[var(--text-secondary)] flex items-center justify-center
            hover:bg-[var(--primary)] hover:text-white transition-all
          "
          onClickCapture={(e) => {
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            // タスク編集機能（将来実装）
          }}
          data-testid="task-edit-button"
        >
          <span className="material-icons md-18">edit</span>
        </button>
      </div>
    </div>
  );
};
