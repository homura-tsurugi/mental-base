'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoginCredentials, AuthValidationError, AUTH_CONSTANTS } from '@/types';
import { validateLoginForm } from '@/lib/validation';

interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  onSwitchToRegister: () => void;
  onSwitchToPasswordReset: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onSwitchToRegister,
  onSwitchToPasswordReset,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<AuthValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // バリデーション
    const validationErrors = validateLoginForm(email, password);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // @MOCK_TO_API: 実装時はAPI呼び出しに置き換え
    // エンドポイント: POST /api/auth/login
    // リクエスト: { email, password }
    // レスポンス: { success: boolean, sessionToken?: string, user?: User, error?: string }
    setIsSubmitting(true);
    try {
      await onSubmit({ email, password });
    } catch (error) {
      setErrors([{ field: 'email', message: 'ログインに失敗しました' }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (field: string): string | undefined => {
    return errors.find((err) => err.field === field)?.message;
  };

  return (
    <div>
      <h2 className="text-[var(--font-xl)] font-semibold text-[var(--text-primary)] mb-6 text-center" data-testid="login-title">
        ログイン
      </h2>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-6">
          <Label htmlFor="login-email" className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">
            メールアドレス
          </Label>
          <Input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={AUTH_CONSTANTS.EMAIL_PLACEHOLDER}
            className="w-full"
            disabled={isSubmitting}
            data-testid="login-email-input"
          />
          {getFieldError('email') && (
            <p className="text-sm text-[var(--danger)] mt-1" data-testid="login-email-error">{getFieldError('email')}</p>
          )}
        </div>

        <div className="mb-6">
          <Label htmlFor="login-password" className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">
            パスワード
          </Label>
          <Input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={AUTH_CONSTANTS.PASSWORD_PLACEHOLDER}
            className="w-full"
            disabled={isSubmitting}
            data-testid="login-password-input"
          />
          {getFieldError('password') && (
            <p className="text-sm text-[var(--danger)] mt-1" data-testid="login-password-error">{getFieldError('password')}</p>
          )}
        </div>

        <Button type="submit" className="w-full mt-2" disabled={isSubmitting} data-testid="login-button">
          {isSubmitting ? 'ログイン中...' : 'ログイン'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-[var(--text-secondary)] mb-2">
          <button
            type="button"
            onClick={onSwitchToPasswordReset}
            className="text-[var(--primary)] font-medium hover:text-[var(--primary-light)] hover:underline transition-colors"
            data-testid="login-forgot-password-link"
          >
            パスワードを忘れた場合
          </button>
        </p>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border-color)]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-[var(--bg-primary)] px-4 text-[var(--text-tertiary)]">または</span>
          </div>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          アカウントをお持ちでない方は<br />
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-[var(--primary)] font-medium hover:text-[var(--primary-light)] hover:underline transition-colors"
            data-testid="login-register-link"
          >
            新規登録
          </button>
        </p>
      </div>
    </div>
  );
};
