// GET /api/ai-assistant/page-data - AIアシスタントページ初期データ取得

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';

// GET /api/ai-assistant/page-data
export async function GET(request: Request) {
  try {
    // 認証チェック
    const session = await verifySession();
    const userId = session.userId;

    // Query Parameters取得
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'problem_solving';

    // modeの検証
    const validModes = ['problem_solving', 'learning_support', 'planning', 'mentoring'];
    if (!validModes.includes(mode)) {
      return NextResponse.json(
        { error: '無効なモードです' },
        { status: 400 }
      );
    }

    // モード情報（静的データ）
    const modeOptions = [
      {
        mode: 'problem_solving',
        label: '課題解決モード',
        description: '抱えている問題について相談してください。一緒に解決策を考えましょう。',
        icon: 'psychology',
        welcomeMessage: 'こんにちは！課題解決モードです。抱えている問題について相談してください。一緒に解決策を考えましょう。',
      },
      {
        mode: 'learning_support',
        label: '学習支援モード',
        description: 'COMPASS教材の学習をサポートします。どの部分について学びたいですか？',
        icon: 'school',
        welcomeMessage: 'こんにちは！学習支援モードです。COMPASS教材の学習をサポートします。どの部分について学びたいですか？',
      },
      {
        mode: 'planning',
        label: '計画立案モード',
        description: '目標設定や計画づくりをアシストします。どんな目標を立てたいですか？',
        icon: 'assignment',
        welcomeMessage: 'こんにちは！計画立案モードです。目標設定や計画づくりをアシストします。どんな目標を立てたいですか？',
      },
      {
        mode: 'mentoring',
        label: '伴走補助モード',
        description: 'あなたのログを分析して、継続的なサポートをします。進捗状況を確認しましょう。',
        icon: 'support_agent',
        welcomeMessage: 'こんにちは！伴走補助モードです。あなたのログを分析して、継続的なサポートをします。進捗状況を確認しましょう。',
      },
    ];

    // 選択モードのチャット履歴取得（最新50件）
    const chatHistory = await prisma.chatMessage.findMany({
      where: {
        userId,
        mode,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    // ページデータを返却
    const pageData = {
      selectedMode: mode,
      modeOptions,
      chatHistory,
      isLoading: false,
    };

    return NextResponse.json(pageData, { status: 200 });
  } catch (error) {
    console.error('AI Assistant page-data GET error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
