'use client';

import React from 'react';
import { TaskWithGoal } from '@/types';
import { TaskItem } from './TaskItem';

interface TodayTasksProps {
  tasks: TaskWithGoal[];
  onToggleComplete: (taskId: string, completed: boolean) => void;
}

export const TodayTasks: React.FC<TodayTasksProps> = ({ tasks, onToggleComplete }) => {
  return (
    <section className="px-6 py-6">
      <h2 className="text-lg font-bold mb-4 text-[var(--text-primary)]" data-testid="today-tasks-title">
        今日のタスク
      </h2>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-[var(--text-tertiary)]" data-testid="empty-tasks-message">
          今日のタスクはありません
        </div>
      ) : (
        <div>
          {tasks.map((task, index) => (
            <TaskItem
              key={task.id}
              task={task}
              index={index}
              onToggleComplete={onToggleComplete}
            />
          ))}
        </div>
      )}
    </section>
  );
};
