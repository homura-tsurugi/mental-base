// POST /api/ai-assistant/chat/send - メッセージ送信とAI応答取得

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';

// POST /api/ai-assistant/chat/send
export async function POST(request: Request) {
  try {
    // リクエストボディ取得
    const body = await request.json();
    const { content, mode } = body;

    // E2Eテスト用: 認証スキップモード
    if (process.env.VITE_SKIP_AUTH === 'true') {
      console.log('[API] 認証スキップモード: モックAIメッセージ送信');

      // 簡単なバリデーション
      if (!content?.trim()) {
        return NextResponse.json(
          { error: 'メッセージを入力してください' },
          { status: 400 }
        );
      }

      // Mock AI応答を返却
      const mockResponse = {
        userMessage: {
          id: `msg-user-${Date.now()}`,
          userId: 'test-user',
          mode: mode || 'problem_solving',
          role: 'user',
          content: content.trim(),
          createdAt: new Date().toISOString(),
        },
        assistantMessage: {
          id: `msg-ai-${Date.now()}`,
          userId: 'test-user',
          mode: mode || 'problem_solving',
          role: 'assistant',
          content: `Mock AI応答: ${content.trim()}に対する返答です。`,
          createdAt: new Date().toISOString(),
        },
      };

      return NextResponse.json(mockResponse, { status: 200 });
    }

    // 認証チェック
    const session = await verifySession();
    const userId = session.userId;

    // バリデーション: content
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'メッセージを入力してください' },
        { status: 400 }
      );
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return NextResponse.json(
        { error: 'メッセージを入力してください' },
        { status: 400 }
      );
    }

    if (trimmedContent.length > 2000) {
      return NextResponse.json(
        { error: 'メッセージは2000文字以内で入力してください' },
        { status: 400 }
      );
    }

    // バリデーション: mode
    const validModes = ['problem_solving', 'learning_support', 'planning', 'mentoring'];
    if (!mode || !validModes.includes(mode)) {
      return NextResponse.json(
        { error: '無効なモードです' },
        { status: 400 }
      );
    }

    // 1. ユーザーメッセージを保存
    const userMessage = await prisma.chatMessage.create({
      data: {
        userId,
        role: 'user',
        content: trimmedContent,
        mode,
      },
    });

    // 2. コンテキスト情報取得（AI APIに渡すため）
    const [goals, tasks, logs, reflections] = await Promise.all([
      // 最新の目標（最大5件）
      prisma.goal.findMany({
        where: { userId, status: 'active' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // 最新のタスク（最大10件）
      prisma.task.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // 最新のログ（最大10件）
      prisma.log.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // 最新の振り返り（最大5件）
      prisma.reflection.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // 3. AI APIプロンプト生成
    // TODO: モード別のシステムプロンプトを定義
    const systemPrompts: Record<string, string> = {
      problem_solving: '課題解決モードとして、ユーザーの問題を分析し、具体的な解決策を提案してください。',
      learning_support: '学習支援モードとして、COMPASS教材の内容を説明し、学習をサポートしてください。',
      planning: '計画立案モードとして、SMART目標の設定とアクションプランの作成を支援してください。',
      mentoring: '伴走補助モードとして、ユーザーのログデータを分析し、継続的なサポートを提供してください。',
    };

    const systemPrompt = systemPrompts[mode];

    // コンテキスト情報を文字列化
    const contextInfo = {
      goals: goals.map(g => ({ title: g.title, status: g.status })),
      tasks: tasks.map(t => ({ title: t.title, status: t.status })),
      logs: logs.map(l => ({ content: l.content, createdAt: l.createdAt })),
      reflections: reflections.map(r => ({ period: r.period, achievements: r.achievements, challenges: r.challenges })),
    };

    // 4. AI API呼び出し
    // TODO: Phase 8でAI API統合を実装
    // - 開発環境: Anthropic Claude 3.5 Sonnet
    // - 本番環境: OpenAI GPT-4o mini
    // - タイムアウト: 30秒
    // - リトライ: 最大3回（exponential backoff）
    //
    // const aiResponse = await callAIAPI({
    //   systemPrompt,
    //   context: contextInfo,
    //   userMessage: trimmedContent,
    //   mode,
    // });

    // 暫定: プレースホルダーAI応答
    const aiResponseContent = `[AI API統合保留] ${mode}モードでのメッセージ受信を確認しました。Phase 8でAI APIを統合します。\n\nユーザーメッセージ: ${trimmedContent}\n\nコンテキスト情報:\n- 目標: ${goals.length}件\n- タスク: ${tasks.length}件\n- ログ: ${logs.length}件\n- 振り返り: ${reflections.length}件`;

    // 5. AI応答を保存
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        userId,
        role: 'assistant',
        content: aiResponseContent,
        mode,
        context: contextInfo, // コンテキスト情報を保存（JSON型）
      },
    });

    // 6. レスポンス返却
    return NextResponse.json(
      {
        messageId: assistantMessage.id,
        content: assistantMessage.content,
        mode: assistantMessage.mode,
        timestamp: assistantMessage.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('AI Assistant chat send POST error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // AI API Rate Limit エラーハンドリング（Phase 8で実装）
    // if (error.code === 'rate_limit_exceeded') {
    //   return NextResponse.json(
    //     { error: 'AI APIのRate Limitを超過しました。しばらくしてから再度お試しください。' },
    //     { status: 429 }
    //   );
    // }

    // AI API タイムアウトエラーハンドリング（Phase 8で実装）
    // if (error.code === 'timeout') {
    //   return NextResponse.json(
    //     { error: 'AI APIの応答がタイムアウトしました。' },
    //     { status: 504 }
    //   );
    // }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
