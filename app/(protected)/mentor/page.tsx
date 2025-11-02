// M-001: メンターダッシュボード
// フェーズ2: メンター機能

import { verifyMentor } from '@/lib/dal';
import { DashboardStats } from '@/components/mentor/DashboardStats';
import { ClientList } from '@/components/mentor/ClientList';

export default async function MentorDashboardPage() {
  // メンターロール検証（DALパターン）
  const session = await verifyMentor();

  return (
    <div className="min-h-screen p-8">
      {/* ページヘッダー */}
      <header className="mb-8">
        <h1
          className="text-[32px] font-bold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          メンターダッシュボード
        </h1>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
          担当クライアントの進捗を一目で確認
        </p>
      </header>

      {/* 統計サマリー */}
      <DashboardStats mentorId={session.userId} />

      {/* クライアント一覧 */}
      <div className="mt-8">
        <ClientList mentorId={session.userId} />
      </div>
    </div>
  );
}
