// PATCH /api/tasks/{id}/toggle - タスク完了状態切り替え

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';

// PATCH /api/tasks/{id}/toggle - タスク完了状態切り替え
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const session = await verifySession();
    const userId = session.userId;

    const { id } = await params;

    // タスクの存在確認と権限チェック
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'タスクが見つかりません' },
        { status: 404 }
      );
    }

    if (existingTask.userId !== userId) {
      return NextResponse.json(
        { error: 'このタスクを編集する権限がありません' },
        { status: 403 }
      );
    }

    // 完了状態の切り替え
    const isCompleted = existingTask.status === 'completed';
    const newStatus = isCompleted ? 'pending' : 'completed';
    const completedAt = isCompleted ? null : new Date();

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: newStatus,
        completedAt,
      },
    });

    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    console.error('Task toggle error:', error);

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
