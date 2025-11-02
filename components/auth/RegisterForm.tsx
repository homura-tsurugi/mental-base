'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RegisterCredentials, AuthValidationError, AUTH_CONSTANTS } from '@/types';
import { validateRegisterForm } from '@/lib/validation';

interface RegisterFormProps {
  onSubmit: (credentials: RegisterCredentials) => Promise<void>;
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  onSwitchToLogin,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<AuthValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // バリデーション
    const validationErrors = validateRegisterForm(name, email, password);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // @MOCK_TO_API: 実装時はAPI呼び出しに置き換え
    // エンドポイント: POST /api/auth/register
    // リクエスト: { name, email, password }
    // レスポンス: { success: boolean, user?: User, sessionToken?: string, error?: string }
    setIsSubmitting(true);
    try {
      await onSubmit({ name, email, password });
    } catch (error) {
      setErrors([{ field: 'email', message: '登録に失敗しました' }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (field: string): string | undefined => {
    return errors.find((err) => err.field === field)?.message;
  };

  return (
    <div>
      <h2 className="text-[var(--font-xl)] font-semibold text-[var(--text-primary)] mb-6 text-center" data-testid="register-title">
        新規登録
      </h2>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-6">
          <Label htmlFor="register-name" className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">
            お名前
          </Label>
          <Input
            id="register-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={AUTH_CONSTANTS.NAME_PLACEHOLDER}
            className="w-full"
            disabled={isSubmitting}
            data-testid="register-name-input"
          />
          {getFieldError('name') && (
            <p className="text-sm text-[var(--danger)] mt-1" data-testid="register-name-error">{getFieldError('name')}</p>
          )}
        </div>

        <div className="mb-6">
          <Label htmlFor="register-email" className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">
            メールアドレス
          </Label>
          <Input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={AUTH_CONSTANTS.EMAIL_PLACEHOLDER}
            className="w-full"
            disabled={isSubmitting}
            data-testid="register-email-input"
          />
          {getFieldError('email') && (
            <p className="text-sm text-[var(--danger)] mt-1" data-testid="register-email-error">{getFieldError('email')}</p>
          )}
        </div>

        <div className="mb-6">
          <Label htmlFor="register-password" className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">
            パスワード
          </Label>
          <Input
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={AUTH_CONSTANTS.PASSWORD_REGISTER_PLACEHOLDER}
            className="w-full"
            disabled={isSubmitting}
            data-testid="register-password-input"
          />
          {getFieldError('password') && (
            <p className="text-sm text-[var(--danger)] mt-1" data-testid="register-password-error">{getFieldError('password')}</p>
          )}
        </div>

        <Button type="submit" className="w-full mt-2" disabled={isSubmitting} data-testid="register-button">
          {isSubmitting ? '登録中...' : '登録してはじめる'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-[var(--text-secondary)]">
          すでにアカウントをお持ちの方は<br />
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-[var(--primary)] font-medium hover:text-[var(--primary-light)] hover:underline transition-colors"
            data-testid="register-login-link"
          >
            ログイン
          </button>
        </p>
      </div>
    </div>
  );
};
