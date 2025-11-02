// (protected)グループレイアウト
// サイドナビゲーション付きレイアウト（メンターページ用）

import { Sidebar } from '@/components/layout/Sidebar';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* サイドナビゲーション */}
      <Sidebar />

      {/* メインコンテンツ */}
      <main className="ml-[240px] flex-1" style={{ backgroundColor: '#f5f7fa' }}>
        {children}
      </main>
    </div>
  );
}
