import React, { Suspense } from 'react';
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { AuthPage } from '@/components/auth/AuthPage';

/**
 * P-001: 認証ページ
 *
 * 5つのビュー状態を管理:
 * - login: ログイン
 * - register: 新規登録
 * - password-reset: パスワードリセットリクエスト
 * - password-reset-success: リセットメール送信完了
 * - new-password: 新しいパスワード設定
 *
 * ビュー切り替えはURLパラメータ `?view=<view-type>` で制御
 * パスワードリセットトークンは `?token=<token>` で渡される
 *
 * @MOCK_TO_API マーク適用済み
 */
export default function AuthPageRoute() {
  return (
    <PublicLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <AuthPage />
      </Suspense>
    </PublicLayout>
  );
}
