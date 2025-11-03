// GET /api/ai-assistant/chat/history - チャット履歴取得
// DELETE /api/ai-assistant/chat/history - チャット履歴クリア

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';

// GET /api/ai-assistant/chat/history
export async function GET(request: Request) {
  try {
    // E2Eテスト用: 認証スキップモード
    if (process.env.VITE_SKIP_AUTH === 'true') {
      console.log('[API] 認証スキップモード: モックAIチャット履歴を返却');

      const { searchParams } = new URL(request.url);
      const mode = searchParams.get('mode') || 'problem_solving';

      // 5件のモックメッセージ
      const mockMessages = [
        {
          id: `${mode}-msg-0`,
          userId: 'test-user',
          mode: mode,
          role: 'assistant',
          content: `こんにちは！${mode}モードのAIアシスタントです。`,
          createdAt: new Date(Date.now() - 10000).toISOString(),
        },
        {
          id: `${mode}-msg-1`,
          userId: 'test-user',
          mode: mode,
          role: 'user',
          content: `テストメッセージ1`,
          createdAt: new Date(Date.now() - 8000).toISOString(),
        },
        {
          id: `${mode}-msg-2`,
          userId: 'test-user',
          mode: mode,
          role: 'assistant',
          content: `承知しました。お手伝いします。`,
          createdAt: new Date(Date.now() - 6000).toISOString(),
        },
        {
          id: `${mode}-msg-3`,
          userId: 'test-user',
          mode: mode,
          role: 'user',
          content: `テストメッセージ2`,
          createdAt: new Date(Date.now() - 4000).toISOString(),
        },
        {
          id: `${mode}-msg-4`,
          userId: 'test-user',
          mode: mode,
          role: 'assistant',
          content: `はい、どうぞお気軽にご質問ください。`,
          createdAt: new Date(Date.now() - 2000).toISOString(),
        },
      ];

      return NextResponse.json({
        messages: mockMessages,
        hasMore: false,
        nextCursor: undefined,
      });
    }

    // 認証チェック
    const session = await verifySession();
    const userId = session.userId;

    // Query Parameters取得
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');
    const limitParam = searchParams.get('limit');
    const cursor = searchParams.get('cursor');

    // limitの検証（1-100、デフォルト50）
    let limit = 50;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return NextResponse.json(
          { error: 'limitは1から100の範囲で指定してください' },
          { status: 400 }
        );
      }
      limit = parsedLimit;
    }

    // modeの検証（任意）
    const validModes = ['problem_solving', 'learning_support', 'planning', 'mentoring'];
    if (mode && !validModes.includes(mode)) {
      return NextResponse.json(
        { error: '無効なモードです' },
        { status: 400 }
      );
    }

    // クエリ条件構築
    const where: any = { userId };
    if (mode) {
      where.mode = mode;
    }

    // カーソルベースページネーション
    const queryOptions: any = {
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit + 1, // hasMoreを判定するために+1件取得
    };

    if (cursor) {
      queryOptions.cursor = {
        id: cursor,
      };
      queryOptions.skip = 1; // カーソル自体をスキップ
    }

    // チャット履歴取得
    const messages = await prisma.chatMessage.findMany(queryOptions);

    // hasMoreフラグとnextCursorの計算
    const hasMore = messages.length > limit;
    const returnedMessages = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore ? returnedMessages[returnedMessages.length - 1].id : undefined;

    return NextResponse.json(
      {
        messages: returnedMessages,
        hasMore,
        nextCursor,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('AI Assistant chat history GET error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// DELETE /api/ai-assistant/chat/history - チャット履歴クリア（開発用）
export async function DELETE() {
  try {
    // 認証チェック
    const session = await verifySession();
    const userId = session.userId;

    // ユーザーのチャット履歴を全削除
    await prisma.chatMessage.deleteMany({
      where: {
        userId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('AI Assistant chat history DELETE error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
