'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordResetRequest, AuthValidationError, AUTH_CONSTANTS } from '@/types';
import { validatePasswordResetForm } from '@/lib/validation';

interface PasswordResetFormProps {
  onSubmit: (data: PasswordResetRequest) => Promise<void>;
  onSwitchToLogin: () => void;
}

export const PasswordResetForm: React.FC<PasswordResetFormProps> = ({
  onSubmit,
  onSwitchToLogin,
}) => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<AuthValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // バリデーション
    const validationErrors = validatePasswordResetForm(email);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // @MOCK_TO_API: 実装時はAPI呼び出しに置き換え
    // エンドポイント: POST /api/auth/password-reset
    // リクエスト: { email }
    // レスポンス: { success: boolean, message?: string, error?: string }
    setIsSubmitting(true);
    try {
      await onSubmit({ email });
    } catch (error) {
      setErrors([{ field: 'email', message: 'リセットリンクの送信に失敗しました' }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (field: string): string | undefined => {
    return errors.find((err) => err.field === field)?.message;
  };

  return (
    <div>
      <h2 className="text-[var(--font-xl)] font-semibold text-[var(--text-primary)] mb-6 text-center" data-testid="password-reset-title">
        パスワードリセット
      </h2>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-6">
          <Label htmlFor="reset-email" className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">
            メールアドレス
          </Label>
          <Input
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={AUTH_CONSTANTS.EMAIL_PLACEHOLDER}
            className="w-full"
            disabled={isSubmitting}
            data-testid="password-reset-email-input"
          />
          {getFieldError('email') && (
            <p className="text-sm text-[var(--danger)] mt-1" data-testid="password-reset-email-error">{getFieldError('email')}</p>
          )}
        </div>

        <Button type="submit" className="w-full mt-2" disabled={isSubmitting} data-testid="password-reset-send-button">
          {isSubmitting ? '送信中...' : 'リセットリンクを送信'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-[var(--text-secondary)]">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-[var(--primary)] font-medium hover:text-[var(--primary-light)] hover:underline transition-colors"
            data-testid="password-reset-back-to-login-link"
          >
            ログイン画面に戻る
          </button>
        </p>
      </div>
    </div>
  );
};
