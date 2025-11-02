// GET /api/activities/recent - 最近のアクティビティ取得

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';
import type { Activity, ActivityType, ActivityIcon } from '@/types';

// アクティビティタイプ別のアイコンと色を返す
function getActivityStyle(type: ActivityType): {
  icon: ActivityIcon;
  iconColor: string;
  backgroundColor: string;
} {
  const styles: Record<
    ActivityType,
    { icon: ActivityIcon; iconColor: string; backgroundColor: string }
  > = {
    task_completed: {
      icon: 'check_circle',
      iconColor: 'var(--success)',
      backgroundColor: '#e6f9f0',
    },
    log_recorded: {
      icon: 'edit',
      iconColor: 'var(--warning)',
      backgroundColor: '#fff5e6',
    },
    task_created: {
      icon: 'assignment',
      iconColor: 'var(--primary)',
      backgroundColor: '#e6f2ff',
    },
    improvement_suggested: {
      icon: 'lightbulb',
      iconColor: 'var(--secondary)',
      backgroundColor: '#f3e6ff',
    },
    goal_created: {
      icon: 'flag',
      iconColor: 'var(--primary)',
      backgroundColor: '#e6f2ff',
    },
    reflection_created: {
      icon: 'insights',
      iconColor: 'var(--warning)',
      backgroundColor: '#fff5e6',
    },
  };
  return styles[type];
}

// GET /api/activities/recent - 最近のアクティビティ取得
export async function GET(request: Request) {
  try {
    // 認証チェック
    const session = await verifySession();
    const userId = session.userId;

    // Query Parametersから limit を取得
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    // limitの範囲チェック（1～100）
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          error: 'limitは1～100の範囲で指定してください',
          detail: { code: 'INVALID_LIMIT', limit },
        },
        { status: 400 }
      );
    }

    // 各テーブルから最新データを取得
    const [completedTasks, createdTasks, logs, goals, reflections, actionPlans] =
      await Promise.all([
        // 完了したタスク
        prisma.task.findMany({
          where: {
            userId,
            status: 'completed',
            completedAt: { not: null },
          },
          orderBy: { completedAt: 'desc' },
          take: limit,
          select: {
            id: true,
            title: true,
            completedAt: true,
          },
        }),
        // 作成されたタスク
        prisma.task.findMany({
          where: {
            userId,
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
        }),
        // ログ記録
        prisma.log.findMany({
          where: {
            userId,
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          select: {
            id: true,
            content: true,
            createdAt: true,
          },
        }),
        // 目標作成
        prisma.goal.findMany({
          where: {
            userId,
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
        }),
        // 振り返り作成
        prisma.reflection.findMany({
          where: {
            userId,
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          select: {
            id: true,
            period: true,
            createdAt: true,
          },
        }),
        // アクションプラン（改善提案）
        prisma.actionPlan.findMany({
          where: {
            userId,
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
        }),
      ]);

    // アクティビティを統合
    const activities: Activity[] = [];

    // タスク完了
    completedTasks.forEach((task) => {
      const style = getActivityStyle('task_completed');
      activities.push({
        id: `task_completed_${task.id}`,
        type: 'task_completed',
        description: `<strong>タスク完了:</strong> ${task.title}`,
        timestamp: task.completedAt!,
        ...style,
      });
    });

    // タスク作成
    createdTasks.forEach((task) => {
      const style = getActivityStyle('task_created');
      activities.push({
        id: `task_created_${task.id}`,
        type: 'task_created',
        description: `<strong>タスク作成:</strong> ${task.title}`,
        timestamp: task.createdAt,
        ...style,
      });
    });

    // ログ記録
    logs.forEach((log) => {
      const style = getActivityStyle('log_recorded');
      const truncatedContent =
        log.content.length > 30 ? log.content.substring(0, 30) + '...' : log.content;
      activities.push({
        id: `log_recorded_${log.id}`,
        type: 'log_recorded',
        description: `<strong>ログ記録:</strong> ${truncatedContent}`,
        timestamp: log.createdAt,
        ...style,
      });
    });

    // 目標作成
    goals.forEach((goal) => {
      const style = getActivityStyle('goal_created');
      activities.push({
        id: `goal_created_${goal.id}`,
        type: 'goal_created',
        description: `<strong>目標作成:</strong> ${goal.title}`,
        timestamp: goal.createdAt,
        ...style,
      });
    });

    // 振り返り作成
    reflections.forEach((reflection) => {
      const style = getActivityStyle('reflection_created');
      const periodLabel =
        reflection.period === 'daily'
          ? '日次'
          : reflection.period === 'weekly'
            ? '週次'
            : '月次';
      activities.push({
        id: `reflection_created_${reflection.id}`,
        type: 'reflection_created',
        description: `<strong>振り返り作成:</strong> ${periodLabel}振り返りを記録`,
        timestamp: reflection.createdAt,
        ...style,
      });
    });

    // アクションプラン（改善提案）
    actionPlans.forEach((plan) => {
      const style = getActivityStyle('improvement_suggested');
      activities.push({
        id: `improvement_suggested_${plan.id}`,
        type: 'improvement_suggested',
        description: `<strong>改善提案:</strong> ${plan.title}`,
        timestamp: plan.createdAt,
        ...style,
      });
    });

    // 時間順にソート（新しい順）
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // limit件数まで絞る
    const limitedActivities = activities.slice(0, limit);

    return NextResponse.json(limitedActivities, { status: 200 });
  } catch (error) {
    console.error('Activities recent GET error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
