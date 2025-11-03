'use client';

import React from 'react';

interface PublicLayoutProps {
  children: React.ReactNode;
}

/**
 * PublicLayout - 認証不要の公開ページ用レイアウト
 *
 * 認証ページなど、ヘッダーやナビゲーションを必要としないページに使用
 */
export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return <>{children}</>;
};
