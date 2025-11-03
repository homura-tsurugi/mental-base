'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('無効なリセットリンクです');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // バリデーション
    if (!newPassword || !confirmPassword) {
      setError('全てのフィールドを入力してください');
      return;
    }

    if (newPassword.length < 8) {
      setError('パスワードは8文字以上である必要があります');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/password-reset/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'パスワードの更新に失敗しました');
        return;
      }

      // 成功
      setSuccess(true);

      // 3秒後にログインページへリダイレクト
      setTimeout(() => {
        router.push('/auth');
      }, 3000);
    } catch (err) {
      setError('パスワードの更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f7fa' }}>
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg text-center">
          <div className="mb-6">
            <span className="material-icons text-6xl text-green-500">check_circle</span>
          </div>
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            パスワードを更新しました
          </h1>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            新しいパスワードでログインできます。
            <br />
            3秒後にログインページへ移動します...
          </p>
          <Link
            href="/auth"
            className="inline-block px-6 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            今すぐログインする
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f7fa' }}>
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="material-icons text-3xl" style={{ color: 'var(--primary)' }}>
              lock_reset
            </span>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            新しいパスワードを設定
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            8文字以上のパスワードを入力してください
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              新しいパスワード
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="新しいパスワード"
                disabled={isSubmitting || !token}
                data-testid="new-password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                tabIndex={-1}
              >
                <span className="material-icons text-gray-400 text-xl">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              パスワード確認
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="パスワードを再入力"
              disabled={isSubmitting || !token}
              data-testid="confirm-password-input"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !token}
            className="w-full py-3 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--primary)' }}
            data-testid="reset-password-button"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin material-icons">refresh</span>
                <span>更新中...</span>
              </>
            ) : (
              <>
                <span className="material-icons">check</span>
                <span>パスワードを更新</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/auth"
            className="text-sm hover:underline"
            style={{ color: 'var(--secondary)' }}
          >
            ログインページに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f7fa' }}>
          <div className="text-center">
            <span className="material-icons text-4xl animate-spin" style={{ color: 'var(--primary)' }}>
              refresh
            </span>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
