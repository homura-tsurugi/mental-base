// GET /api/check-action - Check/Actionページ統合データ取得

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
    const dayOfWeek = now.getDay();
    start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);
    end = new Date(now);
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
}

// GET /api/check-action
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

    // すべてのデータを並列取得
    const [
      completedTasks,
      totalTasks,
      logDays,
      activeGoals,
      tasksByDateData,
      reflections,
      latestReport,
      actionPlans,
    ] = await Promise.all([
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
      // 総タスク数
      prisma.task.count({
        where: {
          userId,
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      }),
      // ログ記録日数
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
      // チャートデータ用：完了タスク
      prisma.task.findMany({
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
      }),
      // 振り返り記録
      prisma.reflection.findMany({
        where: {
          userId,
          startDate: {
            gte: start,
          },
          endDate: {
            lte: end,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),
      // 最新AI分析レポート
      prisma.aIAnalysisReport.findFirst({
        where: {
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      // アクションプラン
      prisma.actionPlan.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
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

    // 進捗統計
    const stats = {
      achievementRate,
      completedTasks,
      logDays: uniqueDays.size,
      activeGoals,
    };

    // チャートデータ作成
    const tasksByDate: { [date: string]: number } = {};
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateKey = currentDate.toISOString().split('T')[0];
      tasksByDate[dateKey] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    tasksByDateData.forEach((task) => {
      if (task.completedAt) {
        const dateKey = task.completedAt.toISOString().split('T')[0];
        if (tasksByDate[dateKey] !== undefined) {
          tasksByDate[dateKey]++;
        }
      }
    });

    const dataPoints = Object.entries(tasksByDate)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, value]) => {
        const d = new Date(date);
        const dayLabels = ['日', '月', '火', '水', '木', '金', '土'];
        const label = `${d.getMonth() + 1}/${d.getDate()}(${dayLabels[d.getDay()]})`;
        return { date, value, label };
      });

    const chartData = {
      title: 'タスク完了推移',
      type: 'line' as const,
      dataPoints,
      yAxisLabel: '完了タスク数',
      xAxisLabel: '日付',
    };

    // AI分析レポートを変換
    const latestReportDetailed = latestReport
      ? {
          ...latestReport,
          insights: Array.isArray(latestReport.insights) ? latestReport.insights : [],
          recommendations: Array.isArray(latestReport.recommendations) ? latestReport.recommendations : [],
          summary: '',
          confidencePercentage: Math.round(latestReport.confidence * 100),
        }
      : null;

    // アクションプランを変換
    const actionPlansDetailed = actionPlans.map((plan) => {
      const actionItems = Array.isArray(plan.actionItems) ? (plan.actionItems as string[]) : [];
      const totalItems = actionItems.length;
      const completedItems = 0;
      const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      return {
        ...plan,
        actionItems: actionItems.map((item, index) => ({
          id: `${plan.id}_${index}`,
          order: index + 1,
          description: item,
          completed: false,
          dueDate: undefined,
        })),
        progress,
        completedItems,
        totalItems,
      };
    });

    // 期間情報
    const periodOption = {
      label: period === 'today' ? '今日' : period === 'this_week' ? '今週' : period === 'last_week' ? '先週' : period === 'this_month' ? '今月' : period === 'last_month' ? '先月' : 'カスタム',
      value: period,
      startDate: start,
      endDate: end,
    };

    // 統合データを返却
    const checkActionPageData = {
      period: periodOption,
      stats,
      chartData,
      reflections,
      latestReport: latestReportDetailed,
      actionPlans: actionPlansDetailed,
    };

    return NextResponse.json(checkActionPageData, { status: 200 });
  } catch (error) {
    console.error('Check-action GET error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
