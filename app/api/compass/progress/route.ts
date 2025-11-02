// GET /api/compass/progress - COM:PASS進捗サマリー取得

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';

// GET /api/compass/progress - COM:PASS進捗計算
export async function GET() {
  try {
    // 認証チェック
    const session = await verifySession();
    const userId = session.userId;

    // 各フェーズの進捗率を計算
    const [goals, tasks, logs, actionPlans] = await Promise.all([
      // PLAN: 目標数
      prisma.goal.count({
        where: {
          userId,
          status: 'active',
        },
      }),
      // DO: タスク完了率
      prisma.task.findMany({
        where: {
          userId,
        },
        select: {
          status: true,
        },
      }),
      // CHECK: ログ記録数
      prisma.log.count({
        where: {
          userId,
        },
      }),
      // ACTION: アクションプラン
      prisma.actionPlan.findMany({
        where: {
          userId,
        },
        select: {
          status: true,
        },
      }),
    ]);

    // DO進捗率: 完了タスク数 / 総タスク数 * 100
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const totalTasks = tasks.length;
    const doProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // PLAN進捗率: 目標が1つ以上あれば進捗ありと判定
    // より詳細な計算: 目標数が多いほど進捗率が高い（最大100%）
    const planProgress = Math.min(goals * 20, 100); // 5目標で100%

    // CHECK進捗率: ログ記録数に応じた進捗
    // より詳細な計算: ログ数が多いほど進捗率が高い（最大100%）
    const checkProgress = Math.min(logs * 10, 100); // 10ログで100%

    // ACTION進捗率: 完了アクションプラン数 / 総アクションプラン数 * 100
    const completedActionPlans = actionPlans.filter((ap) => ap.status === 'completed').length;
    const totalActionPlans = actionPlans.length;
    const actionProgress =
      totalActionPlans > 0 ? Math.round((completedActionPlans / totalActionPlans) * 100) : 0;

    return NextResponse.json(
      {
        planProgress,
        doProgress,
        checkProgress,
        actionProgress,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Compass progress GET error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
