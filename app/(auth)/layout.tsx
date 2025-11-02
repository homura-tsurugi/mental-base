import React from 'react';

/**
 * Auth Group Layout
 *
 * 認証不要のページ用のレイアウト
 * ヘッダーやナビゲーションは含まない
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
