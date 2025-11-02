// GET /api/goals - 目標一覧取得（進捗率付き）
// POST /api/goals - 目標作成

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';

// GET /api/goals - 目標一覧取得（進捗率付き）
export async function GET() {
  try {
    // E2Eテスト用: 認証スキップモード
    if (process.env.VITE_SKIP_AUTH === 'true') {
      console.log('[API] 認証スキップモード: モック目標データを返却');
      return NextResponse.json([
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
      ], { status: 200 });
    }

    // 認証チェック
    const session = await verifySession();
    const userId = session.userId;

    // ユーザーの目標一覧を取得
    const goals = await prisma.goal.findMany({
      where: {
        userId,
        status: {
          not: 'archived', // アーカイブされた目標は除外
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 各目標の進捗率を計算
    const goalsWithProgress = await Promise.all(
      goals.map(async (goal) => {
        // 目標に紐づくタスク数を取得
        const totalTasks = await prisma.task.count({
          where: { goalId: goal.id },
        });

        // 完了タスク数を取得
        const completedTasks = await prisma.task.count({
          where: {
            goalId: goal.id,
            status: 'completed',
          },
        });

        // 進捗率を計算（0-100）
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

    return NextResponse.json(goalsWithProgress, { status: 200 });
  } catch (error) {
    console.error('Goals GET error:', error);

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

// POST /api/goals - 目標作成
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await verifySession();
    const userId = session.userId;

    const body = await request.json();
    const { title, description, deadline } = body;

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

    // 目標作成
    const goal = await prisma.goal.create({
      data: {
        userId,
        title,
        description: description || null,
        deadline: deadline ? new Date(deadline) : null,
        status: 'active',
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('Goal POST error:', error);

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
