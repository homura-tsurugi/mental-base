// GET /api/ai-assistant/page-data - AIアシスタントページ初期データ取得

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';

// GET /api/ai-assistant/page-data
export async function GET(request: Request) {
  try {
    // Query Parameters取得
    const { searchParams } = new URL(request.url);
    const skipAuth = searchParams.get('skipAuth') === 'true';
    const mode = searchParams.get('mode') || 'problem_solving';

    // E2Eテストモード: モックデータを返却
    if (skipAuth || process.env.VITE_SKIP_AUTH === 'true') {
      const mockData = {
        selectedMode: mode,
        modeOptions: [
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
        ],
        chatHistory: [
          {
            id: 'msg-1',
            userId: 'test-user',
            mode: 'problem_solving',
            role: 'user',
            content: '朝のルーティンをもっと効率化したいのですが、どうすればいいですか？',
            createdAt: new Date('2025-11-02T08:00:00Z'),
            updatedAt: new Date('2025-11-02T08:00:00Z'),
          },
          {
            id: 'msg-2',
            userId: 'test-user',
            mode: 'problem_solving',
            role: 'assistant',
            content: '朝のルーティンの効率化について考えましょう。現在の朝の流れを教えていただけますか？何時に起きて、どのような活動をされていますか？',
            createdAt: new Date('2025-11-02T08:00:30Z'),
            updatedAt: new Date('2025-11-02T08:00:30Z'),
          },
          {
            id: 'msg-3',
            userId: 'test-user',
            mode: 'problem_solving',
            role: 'user',
            content: '6時に起きて、シャワー、朝食、着替え、出勤準備をしています。でも時間がかかりすぎていて...',
            createdAt: new Date('2025-11-02T08:01:00Z'),
            updatedAt: new Date('2025-11-02T08:01:00Z'),
          },
          {
            id: 'msg-4',
            userId: 'test-user',
            mode: 'problem_solving',
            role: 'assistant',
            content: 'なるほど、理解しました。6時起床で、シャワー・朝食・着替え・出勤準備をされているんですね。\n\nいくつか提案があります：\n1. 前日夜に翌日の服を準備する\n2. 朝食の準備時間を短縮する（前日に作り置き）\n3. シャワーと朝食の順番を見直す\n\nどの部分が一番時間がかかっていますか？',
            createdAt: new Date('2025-11-02T08:01:30Z'),
            updatedAt: new Date('2025-11-02T08:01:30Z'),
          },
          {
            id: 'msg-5',
            userId: 'test-user',
            mode: 'problem_solving',
            role: 'user',
            content: '朝食の準備に30分もかかってしまいます。',
            createdAt: new Date('2025-11-02T08:02:00Z'),
            updatedAt: new Date('2025-11-02T08:02:00Z'),
          },
        ],
        isLoading: false,
      };
      return NextResponse.json(mockData, { status: 200 });
    }

    // 認証チェック
    const session = await verifySession();
    const userId = session.userId;

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
