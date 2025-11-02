// GET /api/tasks/today - 今日のタスク取得（目標名付き）

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';

// GET /api/tasks/today - 今日のタスク取得（目標名付き）
export async function GET() {
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

    // 今日のタスク一覧を取得（目標情報を含む）
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
        { scheduledTime: 'asc' }, // 時間順
        { createdAt: 'asc' },
      ],
    });

    // 優先度のソート順を定義
    const priorityOrder: { [key: string]: number } = {
      high: 0,
      medium: 1,
      low: 2,
    };

    // TaskWithGoal型に変換（goalNameを追加）し、優先度でソート
    const tasksWithGoal = tasks
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

    return NextResponse.json(tasksWithGoal, { status: 200 });
  } catch (error) {
    console.error('Today tasks GET error:', error);

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
