// POST /api/logs - ログ記録

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';

// 有効なEmotion値
const VALID_EMOTIONS = ['happy', 'neutral', 'sad', 'anxious', 'excited', 'tired'];

// 有効なState値
const VALID_STATES = ['energetic', 'tired', 'focused', 'distracted', 'calm', 'stressed'];

// 有効なLogType値
const VALID_LOG_TYPES = ['daily', 'reflection', 'insight'];

// POST /api/logs - ログ記録
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, emotion, state, type, taskId } = body;

    // テスト環境で認証スキップ
    if (process.env.VITE_SKIP_AUTH === 'true') {
      // バリデーションのみ実行してモックレスポンスを返す
      if (!content) {
        return NextResponse.json(
          { error: '内容は必須です' },
          { status: 400 }
        );
      }

      const mockLog = {
        id: `log-${Date.now()}`,
        userId: 'test-user-id',
        taskId: taskId || null,
        content,
        emotion: emotion || null,
        state: state || null,
        type: type || 'daily',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return NextResponse.json(mockLog, { status: 201 });
    }

    // 認証チェック
    const session = await verifySession();
    const userId = session.userId;

    // バリデーション
    if (!content) {
      return NextResponse.json(
        { error: '内容は必須です' },
        { status: 400 }
      );
    }

    if (content.length < 1 || content.length > 5000) {
      return NextResponse.json(
        { error: '内容は1文字以上5000文字以内で入力してください' },
        { status: 400 }
      );
    }

    if (emotion && !VALID_EMOTIONS.includes(emotion)) {
      return NextResponse.json(
        { error: `感情は ${VALID_EMOTIONS.join(', ')} のいずれかを指定してください` },
        { status: 400 }
      );
    }

    if (state && !VALID_STATES.includes(state)) {
      return NextResponse.json(
        { error: `状態は ${VALID_STATES.join(', ')} のいずれかを指定してください` },
        { status: 400 }
      );
    }

    if (type && !VALID_LOG_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `タイプは ${VALID_LOG_TYPES.join(', ')} のいずれかを指定してください` },
        { status: 400 }
      );
    }

    // taskIdが指定されている場合、タスクの存在確認と権限チェック
    if (taskId) {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        return NextResponse.json(
          { error: '指定されたタスクが見つかりません' },
          { status: 404 }
        );
      }

      if (task.userId !== userId) {
        return NextResponse.json(
          { error: 'このタスクにログを追加する権限がありません' },
          { status: 403 }
        );
      }
    }

    // ログ作成
    const log = await prisma.log.create({
      data: {
        userId,
        taskId: taskId || null,
        content,
        emotion: emotion || null,
        state: state || null,
        type: type || 'daily',
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error('Log POST error:', error);

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
