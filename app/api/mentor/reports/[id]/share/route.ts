// 進捗レポート共有API
// POST /api/mentor/reports/[id]/share - クライアントと共有

import { NextRequest, NextResponse } from 'next/server';
import { verifyMentor } from '@/lib/dal';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * 進捗レポートをクライアントと共有
 * POST /api/mentor/reports/[id]/share
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // メンター認証確認
    const session = await verifyMentor();
    const mentorId = session.userId;

    const { id: reportId } = await params;

    // レポートを取得
    const report = await prisma.clientProgressReport.findUnique({
      where: { id: reportId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: 'レポートが見つかりません' },
        { status: 404 }
      );
    }

    // 本人のレポートか確認
    if (report.mentorId !== mentorId) {
      return NextResponse.json(
        { error: 'このレポートへのアクセス権限がありません' },
        { status: 403 }
      );
    }

    // 既に共有済みか確認
    if (report.isSharedWithClient) {
      return NextResponse.json(
        { error: 'このレポートは既にクライアントと共有されています' },
        { status: 400 }
      );
    }

    // レポートを共有状態に更新
    const updatedReport = await prisma.clientProgressReport.update({
      where: { id: reportId },
      data: {
        isSharedWithClient: true,
        sharedAt: new Date(),
      },
    });

    const mentorName = session.userName || 'メンター';

    // クライアントに通知を送信
    await prisma.notification.create({
      data: {
        userId: report.clientId,
        type: 'achievement',
        title: 'メンターから進捗レポートが届きました',
        message: `${mentorName}さんから進捗レポートが共有されました。レポート期間: ${report.reportPeriod}`,
        read: false,
      },
    });

    return NextResponse.json({
      data: {
        id: updatedReport.id,
        isSharedWithClient: updatedReport.isSharedWithClient,
        sharedAt: updatedReport.sharedAt,
        message: 'レポートをクライアントと共有しました',
      },
    });
  } catch (error) {
    console.error('レポート共有エラー:', error);
    return NextResponse.json(
      { error: 'レポートの共有に失敗しました', detail: error },
      { status: 500 }
    );
  }
}
