// 進捗レポートAPI
// POST /api/mentor/reports/generate - レポート生成

import { NextRequest, NextResponse } from 'next/server';
import { verifyMentor } from '@/lib/dal';

export async function POST(request: NextRequest) {
  try {
    // メンター認証確認
    const session = await verifyMentor();

    const body = await request.json();
    const {
      clientId,
      reportPeriod,
      startDate,
      endDate,
      mentorComments,
      mentorRating,
      areasOfImprovement,
      strengths,
      nextSteps,
      followUpDate,
      isSharedWithClient,
    } = body;

    if (!clientId || !reportPeriod || !startDate || !endDate) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      );
    }

    // TODO: 実際のデータベースから進捗データ取得・集計（マイグレーション後）
    // TODO: レポートをDBに保存（マイグレーション後）

    const mockReport = {
      id: `report-${Date.now()}`,
      clientId,
      mentorId: session.userId,
      reportPeriod,
      startDate,
      endDate,
      overallProgress: Math.floor(Math.random() * 100), // 実際は集計する
      completedGoals: Math.floor(Math.random() * 5),
      completedTasks: Math.floor(Math.random() * 20),
      logCount: Math.floor(Math.random() * 30),
      reflectionCount: Math.floor(Math.random() * 4),
      mentorComments,
      mentorRating,
      areasOfImprovement: areasOfImprovement || [],
      strengths: strengths || [],
      nextSteps,
      followUpDate,
      isSharedWithClient: isSharedWithClient || false,
      sharedAt: isSharedWithClient ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ report: mockReport }, { status: 201 });
  } catch (error) {
    console.error('レポート生成エラー:', error);
    return NextResponse.json(
      { error: 'レポートの生成に失敗しました' },
      { status: 500 }
    );
  }
}
