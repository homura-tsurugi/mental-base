// GET /api/tasks - タスク一覧取得
// POST /api/tasks - タスク作成

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';

// GET /api/tasks - タスク一覧取得
export async function GET(request: NextRequest) {
  try {
    // テスト環境で認証スキップ
    if (process.env.VITE_SKIP_AUTH === 'true') {
      const mockTasks = [
        {
          id: 'task-1',
          title: '英単語30個を暗記',
          status: 'pending',
          priority: 'high',
          goalId: 'goal-1',
          goalName: '英語力向上',
          dueDate: '2025-12-31',
          description: '英語学習のためのタスク',
          scheduledTime: '09:00',
          userId: 'test-user-id',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'task-2',
          title: 'Next.js公式ドキュメント読破',
          status: 'completed',
          priority: 'medium',
          goalId: 'goal-2',
          goalName: 'プログラミング学習',
          dueDate: '2025-06-30',
          description: 'Web開発の学習',
          scheduledTime: '14:00',
          userId: 'test-user-id',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'task-3',
          title: 'ランニング30分',
          status: 'pending',
          priority: 'low',
          goalId: null,
          goalName: null,
          dueDate: '2025-11-03',
          description: '健康のための運動',
          scheduledTime: '07:00',
          userId: 'test-user-id',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      return NextResponse.json(mockTasks);
    }

    // 認証チェック
    const session = await verifySession();
    const userId = session.userId;

    // タスク一覧取得（目標情報も含める）
    const tasks = await prisma.task.findMany({
      where: { userId },
      include: {
        goal: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    });

    // レスポンス整形
    const tasksWithGoalName = tasks.map((task) => ({
      ...task,
      goalName: task.goal?.title || null,
    }));

    return NextResponse.json(tasksWithGoalName);
  } catch (error) {
    console.error('Task GET error:', error);

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

// POST /api/tasks - タスク作成
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await verifySession();
    const userId = session.userId;

    const body = await request.json();
    const { title, description, goalId, dueDate, scheduledTime, priority } = body;

    // バリデーション
    if (!title) {
      return NextResponse.json(
        { error: 'タイトルは必須です' },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        { error: 'タイトルは200文字以内で入力してください' },
        { status: 400 }
      );
    }

    if (description && description.length > 5000) {
      return NextResponse.json(
        { error: '説明は5000文字以内で入力してください' },
        { status: 400 }
      );
    }

    if (!priority || !['high', 'medium', 'low'].includes(priority)) {
      return NextResponse.json(
        { error: '優先度は high, medium, low のいずれかを指定してください' },
        { status: 400 }
      );
    }

    // scheduledTime のバリデーション（HH:mm形式）
    if (scheduledTime) {
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(scheduledTime)) {
        return NextResponse.json(
          { error: '予定時刻は HH:mm 形式で入力してください' },
          { status: 400 }
        );
      }
    }

    // goalIdが指定されている場合、目標の存在確認と権限チェック
    if (goalId) {
      const goal = await prisma.goal.findUnique({
        where: { id: goalId },
      });

      if (!goal) {
        return NextResponse.json(
          { error: '指定された目標が見つかりません' },
          { status: 404 }
        );
      }

      if (goal.userId !== userId) {
        return NextResponse.json(
          { error: 'この目標にタスクを追加する権限がありません' },
          { status: 403 }
        );
      }
    }

    // タスク作成
    const task = await prisma.task.create({
      data: {
        userId,
        goalId: goalId || null,
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        scheduledTime: scheduledTime || null,
        priority,
        status: 'pending',
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Task POST error:', error);

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
