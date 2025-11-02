// GET /api/ai-assistant/modes - AIアシスタントモード情報取得

import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/dal';

// GET /api/ai-assistant/modes
export async function GET() {
  try {
    // 認証チェック
    await verifySession();

    // 4つのモード情報（静的データ）
    const modes = [
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

    return NextResponse.json(modes, { status: 200 });
  } catch (error) {
    console.error('AI Assistant modes GET error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
