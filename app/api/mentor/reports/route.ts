// 進捗レポートAPI
// GET /api/mentor/reports - レポート一覧取得

import { NextRequest, NextResponse } from 'next/server';
import { verifyMentor } from '@/lib/dal';
import { prisma } from '@/lib/prisma';

/**
 * メンターの進捗レポート一覧取得
 * GET /api/mentor/reports?clientId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    // メンター認証確認
    const session = await verifyMentor();
    const mentorId = session.userId;

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    // クエリパラメータでクライアントIDが指定されている場合
    if (clientId) {
      // メンター-クライアント関係を確認
      const relationship = await prisma.mentorClientRelationship.findFirst({
        where: {
          mentorId,
          clientId,
          status: 'active',
        },
      });

      if (!relationship) {
        return NextResponse.json(
          { error: 'アクティブなメンター-クライアント関係が見つかりません' },
          { status: 404 }
        );
      }

      // 特定クライアントのレポート一覧を取得
      const reports = await prisma.clientProgressReport.findMany({
        where: {
          mentorId,
          clientId,
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json({ data: reports });
    }

    // clientIdが指定されていない場合は全クライアントのレポート一覧を取得
    const reports = await prisma.clientProgressReport.findMany({
      where: {
        mentorId,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ data: reports });
  } catch (error) {
    console.error('進捗レポート一覧取得エラー:', error);
    return NextResponse.json(
      { error: 'レポートの取得に失敗しました', detail: error },
      { status: 500 }
    );
  }
}
