// GET /api/check-action/chart - チャートデータ取得

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';

// 期間の開始日・終了日を計算（stats/route.tsと同じロジック）
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
    const dayOfWeek = now.getDay();
    start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);
    end = new Date(now);
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
}

// GET /api/check-action/chart
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

    // 期間内の完了タスクを日別に集計
    const completedTasks = await prisma.task.findMany({
      where: {
        userId,
        status: 'completed',
        completedAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        completedAt: true,
      },
    });

    // 日別にグループ化
    const tasksByDate: { [date: string]: number } = {};

    // 期間内の全日付を初期化
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateKey = currentDate.toISOString().split('T')[0];
      tasksByDate[dateKey] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 完了タスク数をカウント
    completedTasks.forEach((task) => {
      if (task.completedAt) {
        const dateKey = task.completedAt.toISOString().split('T')[0];
        if (tasksByDate[dateKey] !== undefined) {
          tasksByDate[dateKey]++;
        }
      }
    });

    // ChartDataPoint配列に変換
    const dataPoints = Object.entries(tasksByDate)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, value]) => {
        const d = new Date(date);
        const dayLabels = ['日', '月', '火', '水', '木', '金', '土'];
        const label = `${d.getMonth() + 1}/${d.getDate()}(${dayLabels[d.getDay()]})`;

        return {
          date,
          value,
          label,
        };
      });

    const chartData = {
      title: 'タスク完了推移',
      type: 'line' as const,
      dataPoints,
      yAxisLabel: '完了タスク数',
      xAxisLabel: '日付',
    };

    return NextResponse.json(chartData, { status: 200 });
  } catch (error) {
    console.error('Check-action chart GET error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
