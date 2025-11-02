// 進捗レポート個別API
// PUT /api/mentor/reports/[id] - レポート編集

import { NextRequest, NextResponse } from 'next/server';
import { verifyMentor } from '@/lib/dal';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * 進捗レポート更新
 * PUT /api/mentor/reports/[id]
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // メンター認証確認
    const session = await verifyMentor();
    const mentorId = session.userId;

    const { id: reportId } = await params;
    const body = await request.json();
    const {
      mentorComments,
      areasOfImprovement,
      strengths,
      nextSteps,
      mentorRating,
      overallProgress,
    } = body;

    // レポートを取得
    const report = await prisma.clientProgressReport.findUnique({
      where: { id: reportId },
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

    // レポートを更新
    const updateData: any = {};
    if (mentorComments !== undefined) updateData.mentorComments = mentorComments;
    if (areasOfImprovement !== undefined)
      updateData.areasOfImprovement = areasOfImprovement;
    if (strengths !== undefined) updateData.strengths = strengths;
    if (nextSteps !== undefined) updateData.nextSteps = nextSteps;
    if (mentorRating !== undefined) updateData.mentorRating = mentorRating;
    if (overallProgress !== undefined) updateData.overallProgress = overallProgress;

    const updatedReport = await prisma.clientProgressReport.update({
      where: { id: reportId },
      data: updateData,
    });

    return NextResponse.json({ data: updatedReport });
  } catch (error) {
    console.error('レポート更新エラー:', error);
    return NextResponse.json(
      { error: 'レポートの更新に失敗しました', detail: error },
      { status: 500 }
    );
  }
}
