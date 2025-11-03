/**
 * クライアントレイアウト
 *
 * クライアント機能用のレイアウト:
 * - ボトムナビゲーション（MainLayoutが提供）
 * - 最大幅600px（MainLayoutが提供）
 * - スマホファースト設計
 */
export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
