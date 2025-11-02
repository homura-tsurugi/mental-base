'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoalForm, GoalWithProgress } from '@/types';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: GoalForm) => Promise<void>;
  editingGoal?: GoalWithProgress | null;
}

export const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose, onSubmit, editingGoal }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingGoal) {
      setTitle(editingGoal.title);
      setDescription(editingGoal.description || '');
      setDeadline(
        editingGoal.deadline
          ? new Date(editingGoal.deadline).toISOString().split('T')[0]
          : ''
      );
    } else {
      setTitle('');
      setDescription('');
      setDeadline('');
    }
  }, [editingGoal, isOpen]);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        description: description.trim() || undefined,
        deadline: deadline ? new Date(deadline) : undefined,
      });
      onClose();
    } catch (error) {
      console.error('Failed to submit goal:', error);
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
      <div data-testid="goal-modal" className="bg-[var(--bg-primary)] rounded-xl p-6 max-w-[500px] w-full max-h-[80vh] overflow-y-auto shadow-lg">
        {/* Header */}
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">
          {editingGoal ? '目標を編集' : '新規目標を作成'}
        </h2>

        {/* Form */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="goal-title" className="mb-2">
              目標タイトル
            </Label>
            <Input
              id="goal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 英語力を向上させる"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="goal-description" className="mb-2">
              説明
            </Label>
            <textarea
              id="goal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="目標の詳細を入力..."
              className="w-full min-h-[80px] p-3 border border-[var(--border-color)] rounded-lg text-sm resize-vertical focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            />
          </div>

          {/* Deadline */}
          <div>
            <Label htmlFor="goal-deadline" className="mb-2">
              期限
            </Label>
            <Input
              id="goal-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-6 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || isSubmitting}>
            {isSubmitting ? '保存中...' : editingGoal ? '更新' : '作成'}
          </Button>
        </div>
      </div>
    </div>
  );
};
