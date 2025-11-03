'use client';

import React, { useState } from 'react';
import { ActionPlanForm as ActionPlanFormType } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ActionPlanFormProps {
  reportId?: string;
  onSubmit: (data: ActionPlanFormType) => Promise<void>;
}

export const ActionPlanForm: React.FC<ActionPlanFormProps> = ({
  reportId,
  onSubmit,
}) => {
  const [title, setTitle] = useState('週末運動習慣の改善プラン');
  const [description, setDescription] = useState(
    'AI分析の推奨事項に基づき、週末の運動習慣を改善するための具体的なアクションプランを実行します。'
  );
  const [actionItems, setActionItems] = useState<string[]>([
    '土曜朝8時にリマインダーを設定する',
    '30分の軽いウォーキングから始める',
    '運動後にログを記録して達成感を得る',
  ]);
  const [newActionItem, setNewActionItem] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAddActionItem = () => {
    if (newActionItem.trim()) {
      setActionItems([...actionItems, newActionItem.trim()]);
      setNewActionItem('');
    }
  };

  const handleRemoveActionItem = (index: number) => {
    setActionItems(actionItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[ActionPlanForm] Submit started', { title, description, actionItems: actionItems.length });

    if (!title.trim()) {
      setErrorMessage('計画タイトルを入力してください');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    if (actionItems.length === 0) {
      setErrorMessage('少なくとも1つのアクション項目を追加してください');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    setIsSubmitting(true);
    console.log('[ActionPlanForm] Calling onSubmit...');

    try {
      await onSubmit({
        title,
        description,
        actionItems,
        reportId,
      });

      console.log('[ActionPlanForm] onSubmit succeeded, showing success alert');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // フォームをリセット（任意）
      // setTitle('');
      // setDescription('');
      // setActionItems([]);
    } catch (error) {
      console.error('[ActionPlanForm] Submission error:', error);
      setErrorMessage('改善計画の作成に失敗しました');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    } finally {
      setIsSubmitting(false);
      console.log('[ActionPlanForm] Submit finished, showSuccess=', showSuccess);
    }
  };

  return (
    <div className="bg-[var(--bg-primary)] rounded-lg p-4 mb-6 shadow-sm">
      {/* Success Alert */}
      {showSuccess && (
        <Alert variant="success" data-testid="alert-success" className="mb-4">
          <AlertDescription className="flex items-center gap-2">
            <span className="material-icons">check_circle</span>
            <span className="font-medium">改善計画を作成しました</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {showError && (
        <Alert variant="error" data-testid="alert-error" className="mb-4">
          <AlertDescription className="flex items-center gap-2">
            <span className="material-icons">error</span>
            <span className="font-medium">{errorMessage}</span>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-2 mb-4">
        <span className="material-icons text-[var(--text-secondary)]">assignment</span>
        <h3 className="text-base font-semibold text-[var(--text-primary)]">
          改善計画を作成
        </h3>
      </div>

      <form data-testid="action-plan-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* 計画タイトル */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            計画タイトル
          </label>
          <input
            data-testid="action-plan-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: 週末運動習慣の改善プラン"
            className="w-full px-4 py-3 border border-[var(--border-color)] rounded-lg transition-colors focus:outline-none focus:border-[var(--action-color)] text-[var(--text-primary)] bg-[var(--bg-primary)]"
            required
          />
        </div>

        {/* 計画の説明 */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            計画の説明
          </label>
          <textarea
            data-testid="action-plan-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="AI提案を参考に、具体的な改善内容を記載しましょう"
            className="w-full min-h-[80px] px-4 py-3 border border-[var(--border-color)] rounded-lg resize-y transition-colors focus:outline-none focus:border-[var(--action-color)] text-[var(--text-primary)] bg-[var(--bg-primary)]"
            required
          />
        </div>

        {/* アクション項目 */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            アクション項目
          </label>

          {/* 既存のアクション項目リスト */}
          <div data-testid="action-items-list" className="space-y-2 mb-3">
            {actionItems.map((item, index) => (
              <div
                key={index}
                data-testid="action-item"
                className="flex items-center gap-2 p-3 bg-[var(--bg-tertiary)] rounded-lg"
              >
                <div data-testid="action-item-number" className="w-6 h-6 rounded-full bg-[var(--action-color)] text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 text-sm text-[var(--text-primary)]">
                  {item}
                </div>
                <button
                  data-testid="btn-delete-action-item"
                  type="button"
                  onClick={() => handleRemoveActionItem(index)}
                  className="text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors"
                >
                  <span className="material-icons text-xl">close</span>
                </button>
              </div>
            ))}
          </div>

          {/* 新しいアクション項目追加フォーム */}
          <div className="flex gap-2">
            <input
              data-testid="action-item-input"
              type="text"
              value={newActionItem}
              onChange={(e) => setNewActionItem(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddActionItem();
                }
              }}
              placeholder="新しいアクション項目を入力"
              className="flex-1 px-4 py-2 border border-[var(--border-color)] rounded-lg transition-colors focus:outline-none focus:border-[var(--action-color)] text-[var(--text-primary)] bg-[var(--bg-primary)] text-sm"
            />
            <button
              data-testid="btn-add-action-item"
              type="button"
              onClick={handleAddActionItem}
              className="px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-2 border-dashed border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-secondary)] hover:border-[var(--action-color)] transition-all flex items-center gap-1"
            >
              <span className="material-icons text-sm">add_circle_outline</span>
              <span className="text-sm font-medium">追加</span>
            </button>
          </div>
        </div>

        {/* 作成ボタン */}
        <button
          data-testid="btn-create-action-plan"
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-3 bg-[var(--action-color)] text-white rounded-lg font-semibold shadow-md hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-icons">done</span>
          {isSubmitting ? '作成中...' : '改善計画を作成'}
        </button>
      </form>
    </div>
  );
};
