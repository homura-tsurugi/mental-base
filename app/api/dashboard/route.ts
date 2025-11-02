// GET /api/dashboard - ダッシュボード統合データ取得

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';
import type { DashboardData, Activity, ActivityType, ActivityIcon, TaskWithGoal, Notification } from '@/types';

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

// GET /api/dashboard - ダッシュボード統合データ取得
export async function GET(request: Request) {
  // @E2E_MOCK: E2Eテスト用にクエリパラメータをチェック
  const { searchParams } = new URL(request.url);
  const mockType = searchParams.get('mock');

  // Mock: no-tasks
  if (mockType === 'no-tasks') {
    return NextResponse.json({
      compassSummary: { planProgress: 75, doProgress: 60, checkProgress: 50, actionProgress: 40 },
      todayTasks: [],
      recentActivities: [
        {
          id: 'activity1',
          type: 'task_completed',
          description: '<strong>タスク完了:</strong> 朝のストレッチを10分間行う',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          icon: 'check_circle',
          iconColor: '#059669',
          backgroundColor: 'rgb(220, 252, 231)',
        },
      ],
      notifications: [],
    });
  }

  // Mock: no-activities
  if (mockType === 'no-activities') {
    return NextResponse.json({
      compassSummary: { planProgress: 75, doProgress: 60, checkProgress: 50, actionProgress: 40 },
      todayTasks: [
        {
          id: 'task1',
          title: '朝のストレッチを10分間行う',
          status: 'pending',
          priority: 'high',
          goalName: '健康管理',
          scheduledTime: '09:00',
          dueDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'user1',
          goalId: 'goal1',
        },
      ],
      recentActivities: [],
      notifications: [],
    });
  }

  // Mock: api-error
  if (mockType === 'api-error') {
    return NextResponse.json(
      { error: 'API接続エラーが発生しました', detail: 'サーバーに接続できません' },
      { status: 500 }
    );
  }

  // Mock: no-data
  if (mockType === 'no-data') {
    return NextResponse.json(null);
  }

  // Mock: invalid-data
  if (mockType === 'invalid-data') {
    return NextResponse.json({ invalid: 'data', broken: true });
  }

  // Mock: slow-api (simulate slow response)
  if (mockType === 'slow-api') {
    await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 second delay
  }

  // Mock: xss-attack (XSS対策テスト用)
  if (mockType === 'xss-attack') {
    return NextResponse.json({
      compassSummary: { planProgress: 75, doProgress: 60, checkProgress: 50, actionProgress: 40 },
      todayTasks: [],
      recentActivities: [
        {
          id: 'xss-activity-1',
          type: 'task_completed',
          description: '<script>console.log("XSS Attack Executed")</script><strong>XSSテスト:</strong> スクリプトタグを含むアクティビティ',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          icon: 'check_circle',
          iconColor: '#059669',
          backgroundColor: 'rgb(220, 252, 231)',
        },
      ],
      notifications: [],
    });
  }

  // Mock: long-title (長いタスクタイトルテスト用)
  if (mockType === 'long-title') {
    return NextResponse.json({
      compassSummary: { planProgress: 75, doProgress: 60, checkProgress: 50, actionProgress: 40 },
      todayTasks: [
        {
          id: 'task-long-1',
          title: 'これは非常に長いタスクタイトルのテストです。タスクタイトルが長い場合でも適切に表示され、UIが崩れないことを確認するためのテストケースです。',
          status: 'pending',
          priority: 'high',
          goalName: '健康管理',
          scheduledTime: '09:00',
          dueDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'user1',
          goalId: 'goal1',
        },
      ],
      recentActivities: [],
      notifications: [],
    });
  }

  // Mock: zero-progress (進捗率0%テスト用)
  if (mockType === 'zero-progress') {
    return NextResponse.json({
      compassSummary: { planProgress: 0, doProgress: 0, checkProgress: 0, actionProgress: 0 },
      todayTasks: [],
      recentActivities: [],
      notifications: [],
    });
  }

  // Mock: full-progress (進捗率100%テスト用)
  if (mockType === 'full-progress') {
    return NextResponse.json({
      compassSummary: { planProgress: 100, doProgress: 100, checkProgress: 100, actionProgress: 100 },
      todayTasks: [],
      recentActivities: [],
      notifications: [],
    });
  }

  // @E2E_MOCK: E2Eテスト用に一時的にモックデータを返す
  // TODO: データベース接続が完了したら削除
  const mockData: DashboardData = {
    compassSummary: {
      planProgress: 75,
      doProgress: 60,
      checkProgress: 50,
      actionProgress: 40,
    },
    todayTasks: [
      {
        id: 'task1',
        title: '朝のストレッチを10分間行う',
        status: 'pending',
        priority: 'high',
        goalName: '健康管理',
        scheduledTime: '09:00',
        dueDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user1',
        goalId: 'goal1',
      },
      {
        id: 'task2',
        title: 'チーム会議準備',
        status: 'pending',
        priority: 'high',
        goalName: 'プロジェクト成功',
        scheduledTime: '14:00',
        dueDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user1',
        goalId: 'goal2',
      },
      {
        id: 'task3',
        title: 'レポート作成',
        status: 'pending',
        priority: 'medium',
        goalName: 'スキルアップ',
        scheduledTime: '16:30',
        dueDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user1',
        goalId: 'goal3',
      },
    ],
    recentActivities: [
      {
        id: 'activity1',
        type: 'task_completed',
        description: '<strong>タスク完了:</strong> 朝のストレッチを10分間行う',
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15分前
        icon: 'check_circle',
        iconColor: '#059669',
        backgroundColor: 'rgb(220, 252, 231)', // 緑背景
      },
      {
        id: 'activity2',
        type: 'log_recorded',
        description: '<strong>ログ記録:</strong> 日次振り返りを記録',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2時間前
        icon: 'edit',
        iconColor: '#d97706',
        backgroundColor: 'rgb(254, 243, 199)', // 黄背景
      },
      {
        id: 'activity3',
        type: 'task_created',
        description: '<strong>タスク作成:</strong> チーム会議準備',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3時間前
        icon: 'assignment',
        iconColor: '#2563eb',
        backgroundColor: 'rgb(219, 234, 254)', // 青背景
      },
      {
        id: 'activity4',
        type: 'improvement_suggested',
        description: '<strong>改善提案:</strong> タスクの優先順位を見直しましょう',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5時間前
        icon: 'lightbulb',
        iconColor: '#7c3aed',
        backgroundColor: 'rgb(237, 233, 254)', // 紫背景
      },
    ],
    notifications: [],
  };

  return NextResponse.json(mockData);

  /* 本番実装（データベース接続完了後に有効化）
  try {
    // 認証チェック
    const session = await verifySession();
    const userId = session.userId;

    // 今日の日付を取得（0時0分0秒）
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 明日の日付を取得（0時0分0秒）
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // すべてのデータを並列取得
    const [
      goals,
      allTasks,
      todayTasksData,
      logs,
      actionPlans,
      completedTasks,
      createdTasks,
      goalsData,
      reflections,
      actionPlansData,
      notifications,
    ] = await Promise.all([
      // COM:PASS進捗計算用: 目標数
      prisma.goal.count({
        where: {
          userId,
          status: 'active',
        },
      }),
      // COM:PASS進捗計算用: 全タスク
      prisma.task.findMany({
        where: {
          userId,
        },
        select: {
          status: true,
        },
      }),
      // 今日のタスク一覧
      prisma.task.findMany({
        where: {
          userId,
          dueDate: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: {
          goal: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: [{ scheduledTime: 'asc' }, { createdAt: 'asc' }],
      }),
      // COM:PASS進捗計算用: ログ数
      prisma.log.count({
        where: {
          userId,
        },
      }),
      // COM:PASS進捗計算用: アクションプラン
      prisma.actionPlan.findMany({
        where: {
          userId,
        },
        select: {
          status: true,
        },
      }),
      // アクティビティ用: 完了したタスク
      prisma.task.findMany({
        where: {
          userId,
          status: 'completed',
          completedAt: { not: null },
        },
        orderBy: { completedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          completedAt: true,
        },
      }),
      // アクティビティ用: 作成されたタスク
      prisma.task.findMany({
        where: {
          userId,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
      }),
      // アクティビティ用: 目標作成
      prisma.goal.findMany({
        where: {
          userId,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
      }),
      // アクティビティ用: 振り返り作成
      prisma.reflection.findMany({
        where: {
          userId,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          period: true,
          createdAt: true,
        },
      }),
      // アクティビティ用: アクションプラン
      prisma.actionPlan.findMany({
        where: {
          userId,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
      }),
      // 通知一覧（未読のみ）
      prisma.notification.findMany({
        where: {
          userId,
          read: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    // ===== COM:PASS進捗計算 =====
    const completedTasksCount = allTasks.filter((t) => t.status === 'completed').length;
    const totalTasks = allTasks.length;
    const doProgress = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

    const planProgress = Math.min(goals * 20, 100); // 5目標で100%
    const checkProgress = Math.min(logs * 10, 100); // 10ログで100%

    const completedActionPlans = actionPlans.filter((ap) => ap.status === 'completed').length;
    const totalActionPlans = actionPlans.length;
    const actionProgress =
      totalActionPlans > 0 ? Math.round((completedActionPlans / totalActionPlans) * 100) : 0;

    const compassSummary = {
      planProgress,
      doProgress,
      checkProgress,
      actionProgress,
    };

    // ===== 今日のタスク一覧（TaskWithGoal型に変換） =====
    const priorityOrder: { [key: string]: number } = {
      high: 0,
      medium: 1,
      low: 2,
    };

    const todayTasks = (todayTasksData
      .map((task) => {
        const { goal, ...taskData } = task;
        return {
          ...taskData,
          goalName: goal?.title,
          goalId: taskData.goalId ?? undefined,
          description: taskData.description ?? undefined,
          dueDate: taskData.dueDate ?? undefined,
          scheduledTime: taskData.scheduledTime ?? undefined,
          completedAt: taskData.completedAt ?? undefined,
        };
      }) as TaskWithGoal[])
      .sort((a, b) => {
        // 優先度でソート
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // 優先度が同じ場合は時間でソート
        if (a.scheduledTime && b.scheduledTime) {
          return a.scheduledTime.localeCompare(b.scheduledTime);
        }
        if (a.scheduledTime) return -1;
        if (b.scheduledTime) return 1;

        // 時間も同じ場合は作成日時でソート
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

    // ===== 最近のアクティビティ =====
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

    // 目標作成
    goalsData.forEach((goal) => {
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
    actionPlansData.forEach((plan) => {
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

    // 最新10件まで絞る
    const recentActivities = activities.slice(0, 10);

    // ===== ダッシュボードデータを統合 =====
    const dashboardData: DashboardData = {
      compassSummary,
      todayTasks,
      recentActivities,
      notifications: notifications as Notification[],
    };

    return NextResponse.json(dashboardData, { status: 200 });
  } catch (error) {
    console.error('Dashboard GET error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
  */
}
