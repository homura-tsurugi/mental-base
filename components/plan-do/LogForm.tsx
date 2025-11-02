'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { EmotionOption, Emotion } from '@/types';

interface LogFormProps {
  emotionOptions: EmotionOption[];
  onSubmit: (content: string, emotion?: Emotion) => Promise<void>;
}

export const LogForm: React.FC<LogFormProps> = ({ emotionOptions, onSubmit }) => {
  const [content, setContent] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | undefined>('neutral');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content, selectedEmotion);
      setContent('');
      setSelectedEmotion('neutral');
    } catch (error) {
      console.error('Failed to submit log:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card data-testid="log-form" className="p-4 mb-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="material-icons text-[var(--primary)]">edit_note</span>
        <h3 data-testid="log-form-title" className="text-base font-semibold text-[var(--text-primary)]">今日のログを記録</h3>
      </div>

      {/* Textarea */}
      <div className="mb-4">
        <Label htmlFor="log-content" className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">
          今日の振り返り
        </Label>
        <textarea
          data-testid="log-textarea"
          id="log-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="今日の振り返りや学んだことを記録しましょう..."
          className="w-full min-h-[100px] p-3 border border-[var(--border-color)] rounded-lg text-sm resize-vertical focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
        />
      </div>

      {/* Emotion Selector */}
      <div data-testid="emotion-selector" className="mb-4">
        <Label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">
          今日の気分
        </Label>
        <div className="grid grid-cols-4 gap-2">
          {emotionOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              data-testid={`emotion-button-${option.value}`}
              onClick={() => setSelectedEmotion(option.value)}
              className={`p-3 border-2 rounded-lg text-2xl transition-all hover:border-[var(--text-tertiary)] hover:scale-105 ${
                selectedEmotion === option.value
                  ? 'border-[var(--primary)] bg-[var(--primary-light)] shadow-sm'
                  : 'border-[var(--border-color)] bg-[var(--bg-primary)]'
              }`}
              title={option.label}
            >
              {option.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <Button
        data-testid="log-submit-button"
        onClick={handleSubmit}
        disabled={!content.trim() || isSubmitting}
        className="w-full"
      >
        <span className="material-icons text-lg mr-2">save</span>
        {isSubmitting ? 'ログを保存中...' : 'ログを保存'}
      </Button>
    </Card>
  );
};
