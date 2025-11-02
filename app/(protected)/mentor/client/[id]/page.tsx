// M-002: クライアント詳細
// フェーズ2: メンター機能

import { verifyMentor } from '@/lib/dal';
import { MainLayout } from '@/components/layouts/MainLayout';
import { ClientDetailHeader } from '@/components/mentor/ClientDetailHeader';
import { ClientTabs } from '@/components/mentor/ClientTabs';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function ClientDetailPage({ params }: PageProps) {
  // メンターロール検証
  const session = await verifyMentor();
  const clientId = params.id;

  return (
    <MainLayout>
      {/* クライアント情報ヘッダー */}
      <ClientDetailHeader clientId={clientId} mentorId={session.userId} />

      {/* タブコンテンツ */}
      <div className="px-4 py-6">
        <ClientTabs clientId={clientId} mentorId={session.userId} />
      </div>
    </MainLayout>
  );
}
