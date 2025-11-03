/**
 * 管理者レイアウト
 *
 * メンター/管理者機能用のレイアウト:
 * - サイドバーナビゲーション（固定240px、左配置）
 * - フルスクリーン表示
 * - デスクトップファースト設計
 */
import { AdminSidebar } from '@/components/layout/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* サイドナビゲーション */}
      <AdminSidebar />

      {/* メインコンテンツ */}
      <main className="ml-[240px] flex-1" style={{ backgroundColor: '#f5f7fa' }}>
        {children}
      </main>
    </div>
  );
}
