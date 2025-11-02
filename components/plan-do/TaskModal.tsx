'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TaskForm, TaskPriority, GoalWithProgress } from '@/types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: TaskForm) => Promise<void>;
  goals: GoalWithProgress[];
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSubmit, goals }) => {
  const [title, setTitle] = useState('');
  const [goalId, setGoalId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setGoalId('');
      setDueDate('');
      setPriority('medium');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        priority,
        goalId: goalId || undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });
      onClose();
    } catch (error) {
      console.error('Failed to submit task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[1000]"
      onClick={handleBackdropClick}
    >
      <div data-testid="task-modal" className="bg-[var(--bg-primary)] rounded-xl p-6 max-w-[500px] w-full max-h-[80vh] overflow-y-auto shadow-lg">
        {/* Header */}
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">新規タスクを作成</h2>

        {/* Form */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="task-title" className="mb-2">
              タスク名
            </Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 英単語30個を暗記"
            />
          </div>

          {/* Related Goal */}
          <div>
            <Label htmlFor="task-goal" className="mb-2">
              関連する目標
            </Label>
            <select
              id="task-goal"
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className="w-full p-3 border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--bg-primary)]"
            >
              <option value="">目標を選択...</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <Label htmlFor="task-due-date" className="mb-2">
              期限
            </Label>
            <Input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Priority */}
          <div>
            <Label htmlFor="task-priority" className="mb-2">
              優先度
            </Label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full p-3 border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--bg-primary)]"
            >
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-6 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || isSubmitting}>
            {isSubmitting ? '作成中...' : '作成'}
          </Button>
        </div>
      </div>
    </div>
  );
};
