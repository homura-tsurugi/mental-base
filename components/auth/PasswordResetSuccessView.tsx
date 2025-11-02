'use client';

import React from 'react';

interface PasswordResetSuccessViewProps {
  onSwitchToLogin: () => void;
}

export const PasswordResetSuccessView: React.FC<PasswordResetSuccessViewProps> = ({
  onSwitchToLogin,
}) => {
  return (
    <div>
      <h2 className="text-[var(--font-xl)] font-semibold text-[var(--text-primary)] mb-6 text-center" data-testid="password-reset-success-title">
        メール送信完了
      </h2>

      <div className="bg-[var(--success-light)] border-2 border-[var(--success)] text-[var(--success-dark)] p-4 rounded-[var(--radius-md)] text-sm mb-6 flex items-center justify-center gap-2">
        <span className="material-icons text-xl" data-testid="password-reset-success-icon">check_circle</span>
        <span data-testid="password-reset-success-message">
          パスワードリセット用のリンクをメールで送信しました。<br />
          メールをご確認ください。
        </span>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-[var(--text-secondary)]">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-[var(--primary)] font-medium hover:text-[var(--primary-light)] hover:underline transition-colors"
            data-testid="password-reset-success-back-to-login-link"
          >
            ログイン画面に戻る
          </button>
        </p>
      </div>
    </div>
  );
};
