// GET /api/check-action/stats - 進捗統計データ取得

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';

// 期間の開始日・終了日を計算
function calculatePeriodDates(period: string, startDate?: string, endDate?: string) {
  const now = new Date();
  let start: Date;
  let end: Date;

  if (period === 'custom' && startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else if (period === 'today') {
    start = new Date(now);
    start.setHours(0, 0, 0, 0);
    end = new Date(now);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'this_week') {
    const dayOfWeek = now.getDay();
    start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);
    end = new Date(now);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'last_week') {
    const dayOfWeek = now.getDay();
    start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek - 7);
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'this_month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'last_month') {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else {
    // デフォルトは今週
    const dayOfWeek = now.getDay();
    start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);
    end = new Date(now);
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
}

// GET /api/check-action/stats
export async function GET(request: Request) {
  try {
    // 認証チェック
    const session = await verifySession();
    const userId = session.userId;

    // Query Parameters取得
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'this_week';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 期間の計算
    const { start, end } = calculatePeriodDates(period, startDate || undefined, endDate || undefined);

    // 期間内のタスク統計を取得
    const [completedTasks, totalTasks, logDays, activeGoals] = await Promise.all([
      // 完了タスク数
      prisma.task.count({
        where: {
          userId,
          status: 'completed',
          completedAt: {
            gte: start,
            lte: end,
          },
        },
      }),
      // 総タスク数（期間内に作成されたタスク）
      prisma.task.count({
        where: {
          userId,
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      }),
      // ログ記録日数（ユニークな日数を計算）
      prisma.log.groupBy({
        by: ['createdAt'],
        where: {
          userId,
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        _count: true,
      }),
      // アクティブ目標数
      prisma.goal.count({
        where: {
          userId,
          status: 'active',
        },
      }),
    ]);

    // ログ記録日数を計算（ユニークな日付）
    const uniqueDays = new Set(
      logDays.map((log) => {
        const date = new Date(log.createdAt);
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      })
    );

    // 達成率を計算
    const achievementRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const stats = {
      achievementRate,
      completedTasks,
      logDays: uniqueDays.size,
      activeGoals,
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error('Check-action stats GET error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
