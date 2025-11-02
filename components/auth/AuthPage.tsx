'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AuthViewType,
  LoginCredentials,
  RegisterCredentials,
  PasswordResetRequest,
  PasswordResetConfirm,
} from '@/types';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { PasswordResetForm } from './PasswordResetForm';
import { PasswordResetSuccessView } from './PasswordResetSuccessView';
import { NewPasswordForm } from './NewPasswordForm';

export const AuthPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentView, setCurrentView] = useState<AuthViewType>('login');
  const [resetToken, setResetToken] = useState<string>('');

  // URLパラメータからビューとトークンを取得
  useEffect(() => {
    const viewParam = searchParams.get('view') as AuthViewType;
    const tokenParam = searchParams.get('token');

    if (viewParam && ['login', 'register', 'password-reset', 'password-reset-success', 'new-password'].includes(viewParam)) {
      setCurrentView(viewParam);
    }

    if (tokenParam && viewParam === 'new-password') {
      setResetToken(tokenParam);
    }
  }, [searchParams]);

  // ビュー切り替え
  const switchView = (view: AuthViewType) => {
    setCurrentView(view);
    // URLパラメータも更新
    const params = new URLSearchParams();
    params.set('view', view);
    router.push(`/auth?${params.toString()}`);
  };

  // ログイン処理
  const handleLogin = async (credentials: LoginCredentials) => {
    // @MOCK_TO_API: 実装時はAuth.jsのsignIn()を使用
    // import { signIn } from 'next-auth/react';
    // const result = await signIn('credentials', {
    //   redirect: false,
    //   email: credentials.email,
    //   password: credentials.password,
    // });
    // if (result?.ok) {
    //   router.push('/');
    // } else {
    //   throw new Error(result?.error || 'Login failed');
    // }

    console.log('Login:', credentials);
    // モックとして1秒待機
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // モック認証チェック: test@mentalbase.localとMentalBase2025!Devのみ成功
    if (credentials.email === 'test@mentalbase.local' && credentials.password === 'MentalBase2025!Dev') {
      // 成功したらホームにリダイレクト
      router.push('/');
    } else {
      // それ以外はエラー
      throw new Error('Invalid credentials');
    }
  };

  // 新規登録処理
  const handleRegister = async (credentials: RegisterCredentials) => {
    // @MOCK_TO_API: 実装時はAPI呼び出しに置き換え
    // const response = await fetch('/api/auth/register', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(credentials),
    // });
    // const data = await response.json();
    // if (data.success) {
    //   // 登録成功後は自動ログイン
    //   await handleLogin({ email: credentials.email, password: credentials.password });
    // } else {
    //   throw new Error(data.error || 'Registration failed');
    // }

    console.log('Register:', credentials);
    // モックとして1秒待機
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // モック: test@mentalbase.localは既に登録済みとしてエラー
    if (credentials.email === 'test@mentalbase.local') {
      throw new Error('Email already registered');
    }

    // 成功したらホームにリダイレクト
    router.push('/');
  };

  // パスワードリセットリクエスト処理
  const handlePasswordReset = async (data: PasswordResetRequest) => {
    // @MOCK_TO_API: 実装時はAPI呼び出しに置き換え
    // const response = await fetch('/api/auth/password-reset', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data),
    // });
    // const result = await response.json();
    // if (result.success) {
    //   switchView('password-reset-success');
    // } else {
    //   throw new Error(result.error || 'Password reset failed');
    // }

    console.log('Password reset request:', data);
    // モックとして1秒待機
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // モック: test@mentalbase.localのみ成功
    if (data.email === 'test@mentalbase.local') {
      // 成功したら成功画面に遷移
      switchView('password-reset-success');
    } else {
      // それ以外はエラー
      throw new Error('Email not found');
    }
  };

  // 新しいパスワード設定処理
  const handleNewPassword = async (data: PasswordResetConfirm) => {
    // @MOCK_TO_API: 実装時はAPI呼び出しに置き換え
    // const response = await fetch('/api/auth/password-reset/confirm', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data),
    // });
    // const result = await response.json();
    // if (result.success) {
    //   switchView('login');
    // } else {
    //   throw new Error(result.error || 'Password change failed');
    // }

    console.log('New password:', data);
    // モックとして1秒待機
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // モック: test-tokenのみ成功
    if (data.token === 'test-token') {
      // 成功したらログイン画面に遷移
      switchView('login');
    } else {
      // それ以外はエラー
      throw new Error('Invalid token');
    }
  };

  return (
    <div className="bg-[var(--bg-primary)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] max-w-[400px] w-full p-12 px-8" data-testid="auth-card">
      {/* ロゴ */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-2" data-testid="auth-logo">
          <span className="material-icons text-[32px] text-[var(--primary)]">hub</span>
          <h1 className="text-[var(--font-2xl)] font-bold text-[var(--primary)]">COM:PASS</h1>
        </div>
        <p className="text-sm text-[var(--text-tertiary)] mt-1" data-testid="auth-subtitle">
          ライフ・ワークガバナンス プラットフォーム
        </p>
      </div>

      {/* ビューコンテンツ */}
      {currentView === 'login' && (
        <LoginForm
          onSubmit={handleLogin}
          onSwitchToRegister={() => switchView('register')}
          onSwitchToPasswordReset={() => switchView('password-reset')}
        />
      )}

      {currentView === 'register' && (
        <RegisterForm
          onSubmit={handleRegister}
          onSwitchToLogin={() => switchView('login')}
        />
      )}

      {currentView === 'password-reset' && (
        <PasswordResetForm
          onSubmit={handlePasswordReset}
          onSwitchToLogin={() => switchView('login')}
        />
      )}

      {currentView === 'password-reset-success' && (
        <PasswordResetSuccessView onSwitchToLogin={() => switchView('login')} />
      )}

      {currentView === 'new-password' && (
        <NewPasswordForm
          token={resetToken}
          onSubmit={handleNewPassword}
          onSwitchToLogin={() => switchView('login')}
        />
      )}
    </div>
  );
};
