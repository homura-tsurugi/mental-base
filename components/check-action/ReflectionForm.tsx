'use client';

import React, { useState } from 'react';
import { ReflectionForm as ReflectionFormType, PeriodOption } from '@/types';

interface ReflectionFormProps {
  period: PeriodOption;
  onSubmit: (data: ReflectionFormType) => Promise<void>;
  onAIAnalyzeClick: () => void;
}

export const ReflectionForm: React.FC<ReflectionFormProps> = ({
  period,
  onSubmit,
  onAIAnalyzeClick,
}) => {
  const [content, setContent] = useState('');
  const [achievements, setAchievements] = useState('');
  const [challenges, setChallenges] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      alert('振り返り内容を入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        period: 'weekly',
        startDate: period.startDate,
        endDate: period.endDate,
        content,
        achievements: achievements || undefined,
        challenges: challenges || undefined,
      });

      // フォームをクリア
      setContent('');
      setAchievements('');
      setChallenges('');
    } catch (error) {
      console.error('Reflection submission error:', error);
      alert('振り返りの保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div data-testid="reflection-form" className="bg-[var(--bg-primary)] rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-icons text-[var(--text-secondary)]">edit_note</span>
        <h3 className="text-base font-semibold text-[var(--text-primary)]">
          振り返りを記録
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 振り返り内容 */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            {period.label}の振り返り内容
          </label>
          <textarea
            data-testid="reflection-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="今週の活動を振り返って、気づいたことや学びを記録しましょう"
            className="w-full min-h-[80px] px-4 py-3 border border-[var(--border-color)] rounded-lg resize-y transition-colors focus:outline-none focus:border-[var(--check-color)] text-[var(--text-primary)] bg-[var(--bg-primary)]"
            required
          />
        </div>

        {/* 達成したこと */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            達成したこと（成功体験）
          </label>
          <textarea
            data-testid="reflection-achievement"
            value={achievements}
            onChange={(e) => setAchievements(e.target.value)}
            placeholder="うまくいったこと、達成できたことを記録しましょう"
            className="w-full min-h-[80px] px-4 py-3 border border-[var(--border-color)] rounded-lg resize-y transition-colors focus:outline-none focus:border-[var(--check-color)] text-[var(--text-primary)] bg-[var(--bg-primary)]"
          />
        </div>

        {/* 課題・困難だったこと */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            課題・困難だったこと
          </label>
          <textarea
            data-testid="reflection-challenge"
            value={challenges}
            onChange={(e) => setChallenges(e.target.value)}
            placeholder="うまくいかなかったこと、難しかったことを記録しましょう"
            className="w-full min-h-[80px] px-4 py-3 border border-[var(--border-color)] rounded-lg resize-y transition-colors focus:outline-none focus:border-[var(--check-color)] text-[var(--text-primary)] bg-[var(--bg-primary)]"
          />
        </div>

        {/* AI分析ボタン */}
        <button
          data-testid="btn-ai-analyze"
          type="button"
          onClick={onAIAnalyzeClick}
          disabled={isSubmitting}
          className="w-full px-4 py-3 bg-gradient-to-r from-[var(--check-color)] to-[var(--action-color)] text-white rounded-lg font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-icons">psychology</span>
          AI分析を見る
        </button>
      </form>
    </div>
  );
};
