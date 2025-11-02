// メンターダッシュボードAPI
// GET /api/mentor/dashboard

import { NextRequest, NextResponse } from 'next/server';
import { verifyMentor } from '@/lib/dal';

export async function GET(request: NextRequest) {
  try {
    // メンター認証確認
    await verifyMentor();

    // TODO: 実際のデータベースからデータ取得（マイグレーション後）
    // 現在はモックデータを返す

    const mockData = {
      statistics: {
        totalClients: 8,
        activeClients: 6,
        needsFollowUp: 2,
        averageProgress: 68.5,
      },
      clients: [
        {
          clientId: 'client-001',
          name: '田中 太郎',
          email: 'tanaka@example.com',
          avatarUrl: null,
          overallProgress: 85,
          lastActivityDate: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2時間前
          status: 'on_track',
          relationshipId: 'rel-001',
        },
        {
          clientId: 'client-002',
          name: '佐藤 花子',
          email: 'sato@example.com',
          avatarUrl: null,
          overallProgress: 42,
          lastActivityDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3日前
          status: 'stagnant',
          relationshipId: 'rel-002',
        },
        {
          clientId: 'client-003',
          name: '鈴木 一郎',
          email: 'suzuki@example.com',
          avatarUrl: null,
          overallProgress: 25,
          lastActivityDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10日前
          status: 'needs_followup',
          relationshipId: 'rel-003',
        },
        {
          clientId: 'client-004',
          name: '高橋 美咲',
          email: 'takahashi@example.com',
          avatarUrl: null,
          overallProgress: 73,
          lastActivityDate: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12時間前
          status: 'on_track',
          relationshipId: 'rel-004',
        },
        {
          clientId: 'client-005',
          name: '伊藤 健太',
          email: 'ito@example.com',
          avatarUrl: null,
          overallProgress: 90,
          lastActivityDate: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30分前
          status: 'on_track',
          relationshipId: 'rel-005',
        },
        {
          clientId: 'client-006',
          name: '渡辺 由美',
          email: 'watanabe@example.com',
          avatarUrl: null,
          overallProgress: 58,
          lastActivityDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // 1日前
          status: 'on_track',
          relationshipId: 'rel-006',
        },
        {
          clientId: 'client-007',
          name: '山本 大輔',
          email: 'yamamoto@example.com',
          avatarUrl: null,
          overallProgress: 35,
          lastActivityDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5日前
          status: 'stagnant',
          relationshipId: 'rel-007',
        },
        {
          clientId: 'client-008',
          name: '中村 真理子',
          email: 'nakamura@example.com',
          avatarUrl: null,
          overallProgress: 15,
          lastActivityDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), // 14日前
          status: 'needs_followup',
          relationshipId: 'rel-008',
        },
      ],
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('メンターダッシュボードデータ取得エラー:', error);
    return NextResponse.json(
      { error: 'データの取得に失敗しました' },
      { status: 500 }
    );
  }
}
