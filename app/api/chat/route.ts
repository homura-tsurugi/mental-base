import { NextResponse } from 'next/server';

/**
 * POST /api/chat - AI チャットメッセージ送信（Mock実装）
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'メッセージは必須です' },
        { status: 400 }
      );
    }

    // Mock AI response generation
    const userMessage = body.message.trim();
    const mode = body.mode || 'general';
    
    let aiResponse = '';
    
    // Simple mock responses based on message content and mode
    if (userMessage.includes('こんにちは') || userMessage.includes('hello')) {
      aiResponse = 'こんにちは！COM:PASSのAIアシスタントです。どのようなサポートが必要ですか？';
    } else if (userMessage.includes('目標')) {
      aiResponse = `目標設定についてサポートいたします。具体的で測定可能な目標を立てることで、達成への道筋が明確になります。現在、どのような目標を考えていますか？`;
    } else if (userMessage.includes('タスク') || userMessage.includes('todo')) {
      aiResponse = `タスク管理のコツは、大きな目標を小さなステップに分解することです。1日に3〜5個の実行可能なタスクに絞ることをお勧めします。`;
    } else if (userMessage.includes('振り返り') || userMessage.includes('reflection')) {
      aiResponse = `振り返りは成長の鍵です。今日の成果と学びを記録することで、明日への改善点が見えてきます。何について振り返りたいですか？`;
    } else if (mode === 'coach') {
      aiResponse = `【コーチモード】${userMessage}について、一緒に考えてみましょう。まず、現状をどのように捉えていますか？そして、理想の状態はどのようなものでしょうか？`;
    } else if (mode === 'analyze') {
      aiResponse = `【分析モード】ご質問の内容を分析しました。${userMessage}に関して、以下の観点から考えることができます：\n1. 現状の把握\n2. 課題の特定\n3. 解決策の検討\n\nどの観点から深掘りしたいですか？`;
    } else {
      // Default response
      aiResponse = `ご質問ありがとうございます。「${userMessage}」について、もう少し詳しく教えていただけますか？より具体的なアドバイスをさせていただきます。`;
    }

    return NextResponse.json({
      message: aiResponse,
      timestamp: new Date().toISOString(),
      mode: mode,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'メッセージの送信に失敗しました' },
      { status: 500 }
    );
  }
}
