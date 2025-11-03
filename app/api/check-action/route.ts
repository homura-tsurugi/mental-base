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
    // E2Eテストモード検出
    const { searchParams } = new URL(request.url);
    const skipAuth = searchParams.get('skipAuth') === 'true';
    const noReport = searchParams.get('noReport') === 'true';

    // テストモード: モックデータを返却
    if (skipAuth || process.env.VITE_SKIP_AUTH === 'true') {
      const mockData = {
        period: {
          label: '今週',
          value: 'this_week',
          startDate: new Date(),
          endDate: new Date(),
        },
        stats: {
          achievementRate: 75,
          completedTasks: 15,
          logDays: 5,
          activeGoals: 3,
        },
        chartData: {
          title: 'タスク完了推移',
          type: 'line' as const,
          dataPoints: [
            { date: '2025-11-01', value: 3, label: '11/1(月)' },
            { date: '2025-11-02', value: 5, label: '11/2(火)' },
            { date: '2025-11-03', value: 2, label: '11/3(水)' },
            { date: '2025-11-04', value: 4, label: '11/4(木)' },
            { date: '2025-11-05', value: 1, label: '11/5(金)' },
            { date: '2025-11-06', value: 0, label: '11/6(土)' },
            { date: '2025-11-07', value: 0, label: '11/7(日)' },
          ],
          yAxisLabel: '完了タスク数',
          xAxisLabel: '日付',
        },
        reflections: [
          {
            id: 'refl-1',
            userId: 'test-user',
            period: 'weekly',
            startDate: new Date('2025-10-28'),
            endDate: new Date('2025-11-03'),
            content: '今週は朝のルーティンを確立できた',
            achievements: '朝の運動を7日連続で実行',
            challenges: '週末の運動実行率が低下',
            createdAt: new Date('2025-11-03'),
            updatedAt: new Date('2025-11-03'),
          },
        ],
        latestReport: noReport ? null : {
          id: 'report-1',
          userId: 'test-user',
          reflectionId: 'refl-1',
          summary: 'あなたは朝のルーティンを確立することに成功しています。特に平日は高い実行率を達成していますが、週末の継続が課題です。',
          insights: [
            {
              id: 'insight-1',
              title: '平日の高い実行率',
              description: '月曜から金曜まで一貫して朝の運動を実行できています',
              importance: 'high' as const,
              category: 'success_pattern',
            },
            {
              id: 'insight-2',
              title: '週末の実行率低下',
              description: '土日の運動実行率が平日と比べて低下しています',
              importance: 'medium' as const,
              category: 'habit_improvement',
            },
            {
              id: 'insight-3',
              title: 'ルーティン確立の成功',
              description: '朝の時間帯に運動習慣を定着させることができています',
              importance: 'high' as const,
              category: 'success_pattern',
            },
          ],
          recommendations: [
            {
              id: 'rec-1',
              priority: 1,
              title: '週末の運動時間を調整',
              description: '土日は朝8時から9時の間に軽いウォーキングを試してみましょう',
              category: 'time_optimization',
              estimatedImpact: 'high',
            },
            {
              id: 'rec-2',
              priority: 2,
              title: 'リマインダーの設定',
              description: '週末の朝にスマホのリマインダーを設定して習慣化を促進しましょう',
              category: 'habit_improvement',
              estimatedImpact: 'medium',
            },
            {
              id: 'rec-3',
              priority: 3,
              title: '達成感の可視化',
              description: '運動後にログを記録して、達成感を得られるようにしましょう',
              category: 'success_pattern',
              estimatedImpact: 'medium',
            },
          ],
          confidence: 0.85,
          confidencePercentage: 85,
          createdAt: new Date('2025-11-03'),
          updatedAt: new Date('2025-11-03'),
        },
        actionPlans: [
          {
            id: 'plan-1',
            userId: 'test-user',
            title: '週末運動習慣の改善プラン',
            description: 'AI分析の推奨事項に基づき、週末の運動習慣を改善するための具体的なアクションプランを実行します。',
            reportId: 'report-1',
            actionItems: [
              {
                id: 'item-1',
                order: 1,
                description: '土曜朝8時にリマインダーを設定する',
                completed: false,
                dueDate: undefined,
              },
              {
                id: 'item-2',
                order: 2,
                description: '30分の軽いウォーキングから始める',
                completed: false,
                dueDate: undefined,
              },
              {
                id: 'item-3',
                order: 3,
                description: '運動後にログを記録して達成感を得る',
                completed: false,
                dueDate: undefined,
              },
            ],
            progress: 0,
            completedItems: 0,
            totalItems: 3,
            status: 'active',
            startDate: new Date('2025-11-04'),
            endDate: null,
            createdAt: new Date('2025-11-03'),
            updatedAt: new Date('2025-11-03'),
          },
        ],
      };
      return NextResponse.json(mockData, { status: 200 });
    }

    // 認証チェック
    const session = await verifySession();
    const userId = session.userId;

    // Query Parameters取得
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
