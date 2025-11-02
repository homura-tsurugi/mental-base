// POST /api/analysis/generate - AI分析レポート生成

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';

// POST /api/analysis/generate
export async function POST(request: Request) {
  try {
    // 認証チェック
    const session = await verifySession();
    const userId = session.userId;

    // リクエストボディ取得
    const body = await request.json();
    const { reflectionId } = body;

    // バリデーション
    if (!reflectionId || typeof reflectionId !== 'string') {
      return NextResponse.json(
        { error: '振り返りIDが必要です' },
        { status: 400 }
      );
    }

    // 1. 振り返り記録を取得（権限チェック含む）
    const reflection = await prisma.reflection.findUnique({
      where: {
        id: reflectionId,
      },
    });

    if (!reflection) {
      return NextResponse.json(
        { error: '振り返り記録が見つかりません' },
        { status: 404 }
      );
    }

    if (reflection.userId !== userId) {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      );
    }

    // 2. ユーザーデータ取得（振り返り期間内）
    const [goals, tasks, logs, reflections] = await Promise.all([
      // 目標データ
      prisma.goal.findMany({
        where: {
          userId,
          createdAt: {
            gte: reflection.startDate,
            lte: reflection.endDate,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // タスクデータ
      prisma.task.findMany({
        where: {
          userId,
          createdAt: {
            gte: reflection.startDate,
            lte: reflection.endDate,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // ログデータ
      prisma.log.findMany({
        where: {
          userId,
          createdAt: {
            gte: reflection.startDate,
            lte: reflection.endDate,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // 振り返りデータ（同期間の他の振り返り）
      prisma.reflection.findMany({
        where: {
          userId,
          startDate: {
            gte: reflection.startDate,
          },
          endDate: {
            lte: reflection.endDate,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // 3. データ構造化とプロンプト生成
    // タスク完了率を計算
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // ログ記録パターンを分析
    const logDays = new Set(logs.map(log => {
      const date = new Date(log.createdAt);
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    })).size;

    // 振り返り内容を構造化
    const reflectionData = {
      period: reflection.period,
      content: reflection.content,
      achievements: reflection.achievements,
      challenges: reflection.challenges,
    };

    // AI APIに送信するコンテキスト
    const contextData = {
      period: {
        start: reflection.startDate,
        end: reflection.endDate,
      },
      statistics: {
        totalGoals: goals.length,
        activeGoals: goals.filter(g => g.status === 'active').length,
        totalTasks,
        completedTasks,
        taskCompletionRate,
        totalLogs: logs.length,
        logDays,
      },
      reflection: reflectionData,
      goals: goals.map(g => ({
        title: g.title,
        status: g.status,
        deadline: g.deadline,
      })),
      tasks: tasks.map(t => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
      })),
      logs: logs.map(l => ({
        content: l.content,
        emotion: l.emotion,
        createdAt: l.createdAt,
      })),
    };

    // システムプロンプト（AI API用）
    const systemPrompt = `あなたはライフ・ワークガバナンスの専門家です。
ユーザーの振り返り記録とタスク・ログデータを分析し、以下を提供してください：
1. 洞察（insights）: ユーザーの行動パターン、進捗、課題を特定
2. 推奨事項（recommendations）: 具体的で実行可能な改善提案
3. 全体サマリー（summary）: 分析の要約

コンテキスト情報:
${JSON.stringify(contextData, null, 2)}
`;

    // 4. AI API呼び出し
    // TODO: Phase 8でAI API統合を実装
    // - 開発環境: Anthropic Claude 3.5 Sonnet
    // - 本番環境: OpenAI GPT-4o mini
    // - タイムアウト: 30秒
    // - リトライ: 最大3回（exponential backoff: 2秒 → 4秒 → 8秒）
    //
    // try {
    //   const aiResponse = await callAIAPIWithRetry({
    //     systemPrompt,
    //     userMessage: `振り返り内容: ${reflectionData.content}`,
    //     maxRetries: 3,
    //     timeout: 30000,
    //   });
    //
    //   // Parse AI response
    //   const parsedResponse = parseAIResponse(aiResponse);
    //   const insights = parsedResponse.insights;
    //   const recommendations = parsedResponse.recommendations;
    //   const summary = parsedResponse.summary;
    //   const confidence = parsedResponse.confidence;
    // } catch (error) {
    //   if (error.code === 'timeout') {
    //     return NextResponse.json(
    //       { error: 'AI analysis generation failed', detail: { reason: 'timeout' } },
    //       { status: 504 }
    //     );
    //   }
    //   if (error.code === 'rate_limit') {
    //     return NextResponse.json(
    //       { error: 'AI analysis generation failed', detail: { reason: 'rate_limit', retryAfter: error.retryAfter } },
    //       { status: 429 }
    //     );
    //   }
    //   throw error;
    // }

    // 暫定: プレースホルダーAI分析結果
    const insights = [
      {
        type: 'progress',
        title: 'タスク完了率が高い',
        description: `期間内のタスク完了率は${taskCompletionRate}%でした。`,
        importance: 'high' as const,
      },
      {
        type: 'pattern',
        title: 'ログ記録の習慣',
        description: `${logDays}日間のログ記録を継続しています。`,
        importance: 'medium' as const,
      },
    ];

    const recommendations = [
      {
        priority: 1,
        title: '振り返りの習慣化',
        description: '定期的な振り返りを継続し、PDCAサイクルを回しましょう。',
        actionable: true,
        category: 'habit_improvement' as const,
      },
    ];

    const summary = `[AI API統合保留] ${reflection.period}の振り返り分析を完了しました。Phase 8でAI APIを統合します。`;
    const confidence = 0.85; // 暫定的な信頼度

    // 5. レポート保存
    const analysisType = taskCompletionRate >= 80 ? 'progress' : taskCompletionRate >= 50 ? 'pattern' : 'recommendation';

    const report = await prisma.aIAnalysisReport.create({
      data: {
        userId,
        reflectionId,
        analysisType,
        insights,
        recommendations,
        confidence,
      },
    });

    // 6. レスポンス返却（AIAnalysisReportDetailed形式）
    const reportDetailed = {
      ...report,
      insights: Array.isArray(report.insights) ? report.insights : [],
      recommendations: Array.isArray(report.recommendations) ? report.recommendations : [],
      summary,
      confidencePercentage: Math.round(confidence * 100),
    };

    return NextResponse.json(reportDetailed, { status: 201 });
  } catch (error) {
    console.error('Analysis generate POST error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // AI API エラーハンドリング（Phase 8で実装）
    // Rate Limit、Timeout、API Error等のハンドリング

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
