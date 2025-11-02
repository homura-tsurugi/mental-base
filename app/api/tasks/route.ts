// POST /api/tasks - タスク作成

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';

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
