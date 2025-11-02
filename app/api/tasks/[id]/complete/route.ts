// PATCH /api/tasks/{taskId}/complete - タスク完了状態更新

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';

// PATCH /api/tasks/{taskId}/complete - タスク完了状態更新
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const session = await verifySession();
    const userId = session.userId;

    const { id: taskId } = await params;

    // リクエストボディを取得
    const body = await request.json();
    const { completed } = body;

    // バリデーション: completedがboolean型か確認
    if (typeof completed !== 'boolean') {
      return NextResponse.json(
        {
          error: 'completedはboolean型である必要があります',
          detail: { code: 'INVALID_COMPLETED_TYPE' },
        },
        { status: 400 }
      );
    }

    // タスクが存在し、ユーザーのものか確認
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) {
      return NextResponse.json(
        {
          error: 'タスクが見つかりません',
          detail: { code: 'TASK_NOT_FOUND', taskId },
        },
        { status: 404 }
      );
    }

    if (existingTask.userId !== userId) {
      return NextResponse.json(
        {
          error: 'このタスクを更新する権限がありません',
          detail: { code: 'FORBIDDEN' },
        },
        { status: 403 }
      );
    }

    // タスクを更新
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: completed ? 'completed' : 'pending',
        completedAt: completed ? new Date() : null,
      },
    });

    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    console.error('Task complete PATCH error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
