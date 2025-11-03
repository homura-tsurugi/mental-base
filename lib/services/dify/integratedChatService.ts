// ============================================
// 統合チャットサービス
// ============================================
// DifyとSupabaseを統合し、会話をSupabaseに保存しながらDifyのAI応答を利用

import type { ChatMessageRequest, ChatMessageResponse, Conversation, Message, GenerateSummaryRequest } from '@/types/index';
import * as difyService from './difyService';
import * as supabaseService from './ragSupabaseService';
import * as conversationSummaryService from './conversationSummaryService';

// --------------------------------------------
// メッセージ送信（Dify + Supabase統合）
// --------------------------------------------

/**
 * メッセージ送信（DifyとSupabaseに同時保存）
 * @param request メッセージリクエスト
 * @returns メッセージレスポンス
 */
export const sendMessage = async (
  request: ChatMessageRequest
): Promise<ChatMessageResponse> => {
  try {
    console.log('🔄 統合チャットサービス: メッセージ送信開始');

    // 1. ユーザーメッセージをSupabaseに保存
    const userMessage: Message = {
      message_id: crypto.randomUUID(),
      session_id: request.session_id || '',
      role: 'user',
      content: request.content,
      created_at: new Date().toISOString(),
    };

    // 2. Difyにメッセージ送信してAI応答を取得
    console.log('📤 Dify APIにメッセージ送信中...');
    const difyRequest: difyService.DifyChatRequest = {
      session_id: request.session_id,
      content: request.content,
      user_id: request.user_id || 'anonymous',
    };
    const difyResponse = await difyService.sendMessage(difyRequest);

    // 3. 会話IDが新しく生成された場合、Supabaseに会話を保存
    if (difyResponse.session_id && difyResponse.session_id !== request.session_id) {
      console.log('💾 新しい会話をSupabaseに保存中...');
      const newConversation: Conversation = {
        session_id: difyResponse.session_id,
        user_id: request.user_id || 'anonymous',
        title: request.content.substring(0, 50), // 最初のメッセージを会話タイトルに
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        message_count: 2, // ユーザー + AI
      };
      await supabaseService.saveConversation(newConversation);
    }

    // 4. ユーザーメッセージをSupabaseに保存
    userMessage.session_id = difyResponse.session_id || request.session_id || '';
    console.log('💾 ユーザーメッセージをSupabaseに保存中...');
    await supabaseService.saveMessage(userMessage);

    // 5. AIアシスタントの応答をSupabaseに保存
    console.log('💾 AIメッセージをSupabaseに保存中...');
    const aiMessage: Message = {
      message_id: difyResponse.message.message_id,
      session_id: difyResponse.message.session_id,
      role: difyResponse.message.role,
      content: difyResponse.message.content,
      created_at: difyResponse.message.created_at,
      tokens_used: difyResponse.message.tokens_used,
    };
    await supabaseService.saveMessage(aiMessage);

    console.log('✅ 統合チャットサービス: メッセージ送信完了');

    return difyResponse;
  } catch (error) {
    console.error('❌ 統合チャットサービスエラー:', error);
    throw error;
  }
};

// --------------------------------------------
// 会話一覧取得（Supabase優先、Difyはフォールバック）
// --------------------------------------------

/**
 * 会話一覧取得（Supabaseから取得）
 * @param userId ユーザーID
 * @returns 会話一覧
 */
export const getConversations = async (userId: string): Promise<Conversation[]> => {
  try {
    console.log('🔄 統合チャットサービス: 会話一覧取得開始');

    // Supabaseから会話一覧を取得
    const conversations = await supabaseService.getConversationsFromSupabase(userId);

    console.log(`✅ 統合チャットサービス: ${conversations.length}件の会話を取得`);

    return conversations;
  } catch (error) {
    console.error('❌ Supabaseから会話取得エラー、Difyから取得を試みます:', error);

    // Supabaseエラー時はDifyから取得
    return difyService.getConversations(userId);
  }
};

// --------------------------------------------
// メッセージ履歴取得（Supabase優先、Difyはフォールバック）
// --------------------------------------------

/**
 * メッセージ履歴取得（Supabaseから取得）
 * @param sessionId セッションID
 * @returns メッセージ一覧
 */
export const getMessages = async (sessionId: string): Promise<Message[]> => {
  try {
    console.log('🔄 統合チャットサービス: メッセージ履歴取得開始');

    // Supabaseからメッセージ履歴を取得
    const messages = await supabaseService.getMessagesFromSupabase(sessionId);

    console.log(`✅ 統合チャットサービス: ${messages.length}件のメッセージを取得`);

    return messages;
  } catch (error) {
    console.error('❌ Supabaseからメッセージ取得エラー、Difyから取得を試みます:', error);

    // Supabaseエラー時はDifyから取得
    return difyService.getMessages(sessionId);
  }
};

// --------------------------------------------
// 会話管理
// --------------------------------------------

/**
 * 新規会話作成
 * @param userId ユーザーID
 * @returns 新しい会話
 */
export const createConversation = async (userId: string): Promise<Conversation> => {
  // Difyでは会話の明示的な作成は不要（最初のメッセージ送信時に自動作成）
  return difyService.createConversation(userId);
};

/**
 * 会話削除
 * @param sessionId セッションID
 */
export const deleteConversation = async (sessionId: string): Promise<void> => {
  try {
    console.log('🔄 統合チャットサービス: 会話削除開始');

    // 1. Difyから削除
    await difyService.deleteConversation(sessionId);

    // 2. Supabaseからも削除（CASCADE設定により関連メッセージも自動削除）
    const { error } = await supabaseService.supabase
      .from(supabaseService.RAG_TABLES.CONVERSATIONS)
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error('❌ Supabase会話削除エラー:', error);
    }

    console.log('✅ 統合チャットサービス: 会話削除完了');
  } catch (error) {
    console.error('❌ 会話削除エラー:', error);
    throw error;
  }
};

/**
 * 会話をグループ化（日付別）
 */
export const groupConversationsByDate = difyService.groupConversationsByDate;

// --------------------------------------------
// 会話終了
// --------------------------------------------

/**
 * 会話を終了（ステータス更新）
 * @param sessionId セッションID
 * @param summary 会話要約（オプション）
 */
export const endConversation = async (
  sessionId: string,
  summary?: string
): Promise<void> => {
  return supabaseService.endConversation(sessionId, summary);
};

/**
 * 会話を終了してAI要約を生成
 * @param sessionId セッションID
 * @param userId ユーザーID
 * @returns 生成された要約
 */
export const endConversationWithSummary = async (
  sessionId: string,
  userId: string
): Promise<string> => {
  try {
    console.log('🔄 会話終了＆要約生成開始');

    // 1. 会話のメッセージを取得
    const messages = await getMessages(sessionId);

    if (messages.length === 0) {
      throw new Error('会話にメッセージがありません');
    }

    // 2. AI要約を生成
    const summaryRequest: GenerateSummaryRequest = {
      session_id: sessionId,
      user_id: userId,
      messages,
    };

    const summaryResponse = await conversationSummaryService.generateConversationSummary(summaryRequest);

    if (!summaryResponse.success) {
      console.warn('⚠️ AI要約生成は失敗しましたが、フォールバック要約を使用します');
    }

    // 3. 要約を整形（JSON形式からテキスト形式へ）
    const { summary } = summaryResponse;
    const summaryText = formatSummaryAsText(summary);

    // 4. 会話を終了して要約を保存
    await endConversation(sessionId, summaryText);

    console.log('✅ 会話終了＆要約生成完了');

    return summaryText;
  } catch (error) {
    console.error('❌ 会話終了＆要約生成エラー:', error);
    throw error;
  }
};

/**
 * 要約をテキスト形式に整形
 */
const formatSummaryAsText = (summary: any): string => {
  const sections: string[] = [];

  if (summary.topics && summary.topics.length > 0) {
    sections.push(`【主要なテーマ】\n${summary.topics.map((t: string) => `・${t}`).join('\n')}`);
  }

  if (summary.problems && summary.problems.length > 0) {
    sections.push(`【クライアントの課題】\n${summary.problems.map((p: string) => `・${p}`).join('\n')}`);
  }

  if (summary.advice && summary.advice.length > 0) {
    sections.push(`【提供したアドバイス】\n${summary.advice.map((a: string) => `・${a}`).join('\n')}`);
  }

  if (summary.insights && summary.insights.length > 0) {
    sections.push(`【クライアントの気づき】\n${summary.insights.map((i: string) => `・${i}`).join('\n')}`);
  }

  if (summary.next_steps && summary.next_steps.length > 0) {
    sections.push(`【次のステップ】\n${summary.next_steps.map((n: string) => `・${n}`).join('\n')}`);
  }

  if (summary.crisis_flags && summary.crisis_flags.length > 0) {
    sections.push(`【⚠️ 危機フラグ】\n${summary.crisis_flags.map((f: string) => `・${f}`).join('\n')}`);
  }

  return sections.join('\n\n');
};
