'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordResetConfirm, AuthValidationError, AUTH_CONSTANTS } from '@/types';
import { validateNewPasswordForm } from '@/lib/validation';

interface NewPasswordFormProps {
  token: string; // URLパラメータから取得したトークン
  onSubmit: (data: PasswordResetConfirm) => Promise<void>;
  onSwitchToLogin: () => void;
}

export const NewPasswordForm: React.FC<NewPasswordFormProps> = ({
  token,
  onSubmit,
  onSwitchToLogin,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<AuthValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // バリデーション
    const validationErrors = validateNewPasswordForm(newPassword, confirmPassword);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // @MOCK_TO_API: 実装時はAPI呼び出しに置き換え
    // エンドポイント: POST /api/auth/password-reset/confirm
    // リクエスト: { token, newPassword, confirmPassword }
    // レスポンス: { success: boolean, message?: string, error?: string }
    setIsSubmitting(true);
    try {
      await onSubmit({ token, newPassword, confirmPassword });
    } catch (error) {
      setErrors([{ field: 'password', message: 'パスワードの変更に失敗しました' }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (field: string): string | undefined => {
    return errors.find((err) => err.field === field)?.message;
  };

  return (
    <div>
      <h2 className="text-[var(--font-xl)] font-semibold text-[var(--text-primary)] mb-6 text-center" data-testid="new-password-title">
        新しいパスワード設定
      </h2>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-6">
          <Label htmlFor="new-password" className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">
            新しいパスワード
          </Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={AUTH_CONSTANTS.PASSWORD_REGISTER_PLACEHOLDER}
            className="w-full"
            disabled={isSubmitting}
            data-testid="new-password-input"
          />
          {getFieldError('password') && (
            <p className="text-sm text-[var(--danger)] mt-1" data-testid="new-password-error">{getFieldError('password')}</p>
          )}
        </div>

        <div className="mb-6">
          <Label htmlFor="confirm-password" className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">
            パスワード確認
          </Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="もう一度入力してください"
            className="w-full"
            disabled={isSubmitting}
            data-testid="new-password-confirm-input"
          />
          {getFieldError('confirmPassword') && (
            <p className="text-sm text-[var(--danger)] mt-1" data-testid="new-password-confirm-error">{getFieldError('confirmPassword')}</p>
          )}
        </div>

        <Button type="submit" className="w-full mt-2" disabled={isSubmitting} data-testid="new-password-change-button">
          {isSubmitting ? '変更中...' : 'パスワードを変更'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-[var(--text-secondary)]">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-[var(--primary)] font-medium hover:text-[var(--primary-light)] hover:underline transition-colors"
            data-testid="new-password-back-to-login-link"
          >
            ログイン画面に戻る
          </button>
        </p>
      </div>
    </div>
  );
};
