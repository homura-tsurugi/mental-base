// GET /api/notifications - 通知一覧取得

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';

// GET /api/notifications - 通知一覧取得
export async function GET(request: Request) {
  try {
    // 認証チェック
    const session = await verifySession();
    const userId = session.userId;

    // Query Parametersから unreadOnly を取得
    const { searchParams } = new URL(request.url);
    const unreadOnlyParam = searchParams.get('unreadOnly');
    const unreadOnly = unreadOnlyParam !== 'false'; // デフォルトはtrue

    // 通知一覧を取得
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly && { read: false }), // unreadOnlyがtrueの場合のみ未読フィルタ
      },
      orderBy: {
        createdAt: 'desc', // 新しい順
      },
    });

    return NextResponse.json(notifications, { status: 200 });
  } catch (error) {
    console.error('Notifications GET error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
