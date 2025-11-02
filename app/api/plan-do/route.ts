// GET /api/plan-do - Plan/Doページ統合データ取得

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';

// 感情選択肢の定数
const EMOTION_OPTIONS = [
  { value: 'happy', emoji: '😊', label: '嬉しい' },
  { value: 'neutral', emoji: '😐', label: '普通' },
  { value: 'sad', emoji: '😢', label: '悲しい' },
  { value: 'anxious', emoji: '😰', label: '不安' },
  { value: 'excited', emoji: '😆', label: 'ワクワク' },
  { value: 'tired', emoji: '😴', label: '疲れた' },
];

// GET /api/plan-do - Plan/Doページ統合データ取得
export async function GET(request: NextRequest) {
  try {
    // E2Eテスト用: 認証スキップモード
    if (process.env.VITE_SKIP_AUTH === 'true') {
      console.log('[API] 認証スキップモード: モックPlan-Doデータを返却');
      const today = new Date();
      const { searchParams } = new URL(request.url);
      const activeTab = searchParams.get('activeTab') || 'plan';

      return NextResponse.json({
        activeTab,
        goals: [
          {
            id: 'goal-1',
            userId: 'test-user-id',
            title: 'プログラミングスキル向上',
            description: 'TypeScriptとReactを使った開発スキルを向上させる',
            deadline: new Date('2025-12-31'),
            status: 'active',
            createdAt: new Date('2025-01-01'),
            updatedAt: new Date(),
            completedTasks: 3,
            totalTasks: 10,
            progressPercentage: 30,
          },
          {
            id: 'goal-2',
            userId: 'test-user-id',
            title: '健康的な生活習慣の確立',
            description: '毎日30分の運動と規則正しい睡眠を実践する',
            deadline: new Date('2025-06-30'),
            status: 'active',
            createdAt: new Date('2025-01-15'),
            updatedAt: new Date(),
            completedTasks: 15,
            totalTasks: 20,
            progressPercentage: 75,
          },
        ],
        todayTasks: [
          {
            id: 'task-1',
            userId: 'test-user-id',
            goalId: 'goal-1',
            title: 'TypeScript基礎学習',
            description: '型定義とジェネリクスについて学習する',
            status: 'pending',
            priority: 'high',
            dueDate: today,
            scheduledTime: '09:00',
            estimatedMinutes: 60,
            createdAt: new Date('2025-01-01'),
            updatedAt: new Date(),
            goalName: 'プログラミングスキル向上',
          },
          {
            id: 'task-2',
            userId: 'test-user-id',
            goalId: 'goal-2',
            title: '朝の運動',
            description: '30分間のジョギング',
            status: 'completed',
            priority: 'high',
            dueDate: today,
            scheduledTime: '07:00',
            estimatedMinutes: 30,
            createdAt: new Date('2025-01-15'),
            updatedAt: new Date(),
            goalName: '健康的な生活習慣の確立',
          },
          {
            id: 'task-3',
            userId: 'test-user-id',
            goalId: 'goal-1',
            title: 'React hooksの復習',
            description: 'useState, useEffect, useContextを復習',
            status: 'pending',
            priority: 'medium',
            dueDate: today,
            scheduledTime: '14:00',
            estimatedMinutes: 90,
            createdAt: new Date('2025-01-02'),
            updatedAt: new Date(),
            goalName: 'プログラミングスキル向上',
          },
        ],
        emotionOptions: EMOTION_OPTIONS,
      }, { status: 200 });
    }

    // 認証チェック
    const session = await verifySession();
    const userId = session.userId;

    // クエリパラメータからactiveTabを取得（デフォルトは'plan'）
    const { searchParams } = new URL(request.url);
    const activeTab = searchParams.get('activeTab') || 'plan';

    // 目標一覧を取得（進捗率付き）
    const goals = await prisma.goal.findMany({
      where: {
        userId,
        status: {
          not: 'archived',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 各目標の進捗率を計算
    const goalsWithProgress = await Promise.all(
      goals.map(async (goal) => {
        const totalTasks = await prisma.task.count({
          where: { goalId: goal.id },
        });

        const completedTasks = await prisma.task.count({
          where: {
            goalId: goal.id,
            status: 'completed',
          },
        });

        const progressPercentage =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          ...goal,
          completedTasks,
          totalTasks,
          progressPercentage,
        };
      })
    );

    // 今日のタスク一覧を取得（目標名付き）
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await prisma.task.findMany({
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
      orderBy: [
        { scheduledTime: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    // 優先度のソート順を定義
    const priorityOrder: { [key: string]: number } = {
      high: 0,
      medium: 1,
      low: 2,
    };

    const todayTasks = tasks
      .map((task) => {
        const { goal, ...taskData } = task;
        return {
          ...taskData,
          goalName: goal?.title,
        };
      })
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

    // レスポンスデータを構築
    const pageData = {
      activeTab,
      goals: goalsWithProgress,
      todayTasks,
      emotionOptions: EMOTION_OPTIONS,
    };

    return NextResponse.json(pageData, { status: 200 });
  } catch (error) {
    console.error('Plan-Do page data GET error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
