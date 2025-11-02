// GET /api/analysis/latest - 最新AI分析レポート取得

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';

// GET /api/analysis/latest - 最新AI分析レポート取得
export async function GET() {
  try {
    // 認証チェック
    const session = await verifySession();
    const userId = session.userId;

    // 最新のAI分析レポートを取得
    const latestReport = await prisma.aIAnalysisReport.findFirst({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc', // 最新順
      },
    });

    if (!latestReport) {
      // 分析レポートがない場合はnullを返す
      return NextResponse.json(null, { status: 200 });
    }

    // AIAnalysisReportDetailed形式に変換
    const insights = typeof latestReport.insights === 'object'
      ? latestReport.insights
      : [];
    const recommendations = typeof latestReport.recommendations === 'object'
      ? latestReport.recommendations
      : [];

    const reportDetailed = {
      ...latestReport,
      insights: Array.isArray(insights) ? insights : [],
      recommendations: Array.isArray(recommendations) ? recommendations : [],
      summary: '', // TODO: 実装時にサマリーを生成
      confidencePercentage: Math.round(latestReport.confidence * 100),
    };

    return NextResponse.json(reportDetailed, { status: 200 });
  } catch (error) {
    console.error('Analysis latest GET error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
