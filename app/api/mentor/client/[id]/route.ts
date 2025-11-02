// クライアント詳細API
// GET /api/mentor/client/[id]

import { NextRequest, NextResponse } from 'next/server';
import { verifyMentor } from '@/lib/dal';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // メンター認証確認
    await verifyMentor();

    const { id: clientId } = await params;

    // TODO: 実際のデータベースからデータ取得（マイグレーション後）
    // TODO: データアクセス権限確認（Week 3で実装）
    // 現在はモックデータを返す

    const mockData = {
      clientInfo: {
        id: clientId,
        name: getClientName(clientId),
        email: `${clientId}@example.com`,
        registeredAt: new Date(2024, 9, 1).toISOString(),
        relationshipStartDate: new Date(2024, 10, 1).toISOString(),
        overallProgress: Math.floor(Math.random() * 100),
      },
      permissions: {
        allowGoals: false,
        allowTasks: false,
        allowLogs: false,
        allowReflections: false,
        allowAiReports: false,
      },
      progressData: {
        goals: [],
        tasks: [],
        logs: [],
        reflections: [],
        aiReports: [],
      },
      mentorNotes: [],
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('クライアント詳細データ取得エラー:', error);
    return NextResponse.json(
      { error: 'データの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// クライアントIDから名前を生成（モック用）
function getClientName(clientId: string): string {
  const names: { [key: string]: string } = {
    'client-001': '田中 太郎',
    'client-002': '佐藤 花子',
    'client-003': '鈴木 一郎',
    'client-004': '高橋 美咲',
    'client-005': '伊藤 健太',
    'client-006': '渡辺 由美',
    'client-007': '山本 大輔',
    'client-008': '中村 真理子',
  };

  return names[clientId] || 'テストユーザー';
}
