// ============================================
// ConversationSummaryService - 会話要約生成サービス
// ============================================
// Dify API経由でClaude APIを使用して会話を自動要約

import axios from 'axios';
import type {
  Message,
  ConversationSummary,
  GenerateSummaryRequest,
  GenerateSummaryResponse,
} from '@/types/index';

const DIFY_API_URL = process.env.NEXT_PUBLIC_DIFY_API_URL;
const DIFY_API_KEY = process.env.NEXT_PUBLIC_DIFY_API_KEY;

// Dify Completionクライアント（要約専用）
const difyCompletionClient = axios.create({
  baseURL: DIFY_API_URL,
  headers: {
    'Authorization': `Bearer ${DIFY_API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 要約生成は時間がかかる可能性があるため30秒
});

// --------------------------------------------
// 会話要約生成（Dify API実装）
// --------------------------------------------

export const generateConversationSummary = async (
  request: GenerateSummaryRequest
): Promise<GenerateSummaryResponse> => {
  try {
    console.log(`📝 会話要約生成開始: ${request.messages.length}件のメッセージ`);

    const { session_id, user_id, messages } = request;

    // メッセージを会話形式に整形
    const conversationText = messages
      .map((msg) => {
        const role = msg.role === 'user' ? 'クライアント' : 'AIコーチ';
        return `${role}: ${msg.content}`;
      })
      .join('\n\n');

    // 要約生成プロンプト
    const summaryPrompt = `以下のコーチングセッションの会話を詳細に分析し、JSON形式で要約してください。

【会話内容】
${conversationText}

【出力形式】
以下のJSON形式で出力してください：
{
  "topics": ["主要なテーマ1", "主要なテーマ2"],
  "problems": ["クライアントの課題1", "クライアントの課題2"],
  "advice": ["提供したアドバイス1", "提供したアドバイス2"],
  "insights": ["クライアントの気づき1", "クライアントの気づき2"],
  "next_steps": ["次のステップ1", "次のステップ2"],
  "crisis_flags": []
}

注意: 危機的なキーワード（自殺、死にたい等）が含まれる場合は、crisis_flagsに記録してください。`;

    // Dify Completion APIで要約生成
    const response = await difyCompletionClient.post('/completion-messages', {
      inputs: {},
      query: summaryPrompt,
      response_mode: 'blocking',
      user: `user-${user_id}`,
    });

    const summaryText = response.data.answer?.trim() || '';

    // JSON形式のレスポンスをパース
    let parsedSummary;
    try {
      // JSON部分を抽出（マークダウンコードブロックを除去）
      const jsonMatch = summaryText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : summaryText;
      parsedSummary = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('❌ JSON解析エラー、フォールバック使用:', parseError);
      parsedSummary = generateFallbackSummary(messages);
    }

    // ConversationSummary形式に変換
    const summary: ConversationSummary = {
      summary_id: crypto.randomUUID(),
      session_id,
      user_id,
      topics: parsedSummary.topics || [],
      problems: parsedSummary.problems || [],
      advice: parsedSummary.advice || [],
      insights: parsedSummary.insights || [],
      next_steps: parsedSummary.next_steps || [],
      mentor_notes: '',
      crisis_flags: parsedSummary.crisis_flags || [],
      created_at: new Date().toISOString(),
    };

    console.log('✅ 会話要約生成完了');

    return {
      summary,
      success: true,
      message: '会話要約が正常に生成されました',
    };
  } catch (error) {
    console.error('❌ 会話要約生成エラー:', error);

    // エラー時はフォールバック要約を返す
    const fallbackSummary = generateFallbackSummary(request.messages);
    const summary: ConversationSummary = {
      summary_id: crypto.randomUUID(),
      session_id: request.session_id,
      user_id: request.user_id,
      ...fallbackSummary,
      mentor_notes: '',
      created_at: new Date().toISOString(),
    };

    return {
      summary,
      success: false,
      message: 'AI要約生成に失敗したため、簡易要約を使用しました',
    };
  }
};

/**
 * フォールバック要約生成（API失敗時）
 */
const generateFallbackSummary = (messages: Message[]) => {
  const userMessages = messages.filter((m) => m.role === 'user');
  const aiMessages = messages.filter((m) => m.role === 'assistant');

  return {
    topics: extractTopics(userMessages),
    problems: extractProblems(userMessages),
    advice: extractAdvice(aiMessages),
    insights: extractInsights(userMessages, aiMessages),
    next_steps: extractNextSteps(aiMessages),
    crisis_flags: detectCrisisFlags(userMessages),
  };
};

// --------------------------------------------
// 要約取得（モック実装）
// --------------------------------------------

export const getConversationSummaries = async (
  _userId: string
): Promise<ConversationSummary[]> => {
  // TODO: 本番実装時はバックエンドAPI呼び出し
  // GET /api/v1/users/{user_id}/summaries

  await new Promise((resolve) => setTimeout(resolve, 500));

  // モックデータ（空配列）
  return [];
};

// --------------------------------------------
// 特定の会話要約を取得（モック実装）
// --------------------------------------------

export const getConversationSummary = async (
  _sessionId: string
): Promise<ConversationSummary | null> => {
  // TODO: 本番実装時はバックエンドAPI呼び出し
  // GET /api/v1/conversations/{session_id}/summary

  await new Promise((resolve) => setTimeout(resolve, 500));

  return null;
};

// --------------------------------------------
// ヘルパー関数（簡易的なキーワード抽出）
// --------------------------------------------

const extractTopics = (userMessages: Message[]): string[] => {
  // 簡易実装: メッセージ内容からトピックキーワードを抽出
  const topicKeywords = [
    '目標',
    'キャリア',
    '人間関係',
    '転職',
    'スキル',
    '学習',
    '計画',
    '問題',
    '課題',
  ];

  const topics = new Set<string>();
  userMessages.forEach((msg) => {
    topicKeywords.forEach((keyword) => {
      if (msg.content.includes(keyword)) {
        topics.add(keyword);
      }
    });
  });

  return Array.from(topics).slice(0, 5); // 最大5件
};

const extractProblems = (userMessages: Message[]): string[] => {
  // 簡易実装: 問題・課題に関連するメッセージを抽出
  const problemKeywords = ['困っ', '悩み', '問題', '課題', 'うまくいかない', '不安'];

  const problems: string[] = [];
  userMessages.forEach((msg) => {
    if (problemKeywords.some((kw) => msg.content.includes(kw))) {
      problems.push(msg.content.substring(0, 100)); // 最初の100文字
    }
  });

  return problems.slice(0, 3); // 最大3件
};

const extractAdvice = (aiMessages: Message[]): string[] => {
  // 簡易実装: AIアドバイスから主要なポイントを抽出
  const adviceKeywords = ['おすすめ', '試し', '方法', 'ステップ', '重要', 'ポイント'];

  const advice: string[] = [];
  aiMessages.forEach((msg) => {
    if (adviceKeywords.some((kw) => msg.content.includes(kw))) {
      advice.push(msg.content.substring(0, 150)); // 最初の150文字
    }
  });

  return advice.slice(0, 3); // 最大3件
};

const extractInsights = (userMessages: Message[], _aiMessages: Message[]): string[] => {
  // 簡易実装: クライアントの気づきを抽出
  const insightKeywords = ['わかりました', '理解', '納得', '気づき', 'なるほど', 'そうか'];

  const insights: string[] = [];
  userMessages.forEach((msg) => {
    if (insightKeywords.some((kw) => msg.content.includes(kw))) {
      insights.push(msg.content.substring(0, 100));
    }
  });

  return insights.slice(0, 3); // 最大3件
};

const extractNextSteps = (aiMessages: Message[]): string[] => {
  // 簡易実装: 次のステップを抽出
  const nextStepKeywords = ['次', 'これから', '明日', '今週', '取り組', '始め'];

  const nextSteps: string[] = [];
  aiMessages.forEach((msg) => {
    if (nextStepKeywords.some((kw) => msg.content.includes(kw))) {
      nextSteps.push(msg.content.substring(0, 100));
    }
  });

  return nextSteps.slice(0, 3); // 最大3件
};

const detectCrisisFlags = (userMessages: Message[]): string[] => {
  // 簡易実装: 危機キーワード検出
  const crisisKeywords = [
    '死にたい',
    '消えたい',
    '辛すぎる',
    '限界',
    '助けて',
    'もうダメ',
    '自殺',
  ];

  const detectedFlags: string[] = [];
  userMessages.forEach((msg) => {
    crisisKeywords.forEach((kw) => {
      if (msg.content.includes(kw)) {
        detectedFlags.push(`危機キーワード検出: "${kw}"`);
      }
    });
  });

  return detectedFlags;
};
