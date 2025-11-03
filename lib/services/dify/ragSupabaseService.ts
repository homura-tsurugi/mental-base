// ============================================
// Supabase データ保存サービス（RAG統合用）
// ============================================
// Difyから取得した会話をSupabaseに保存・管理（rag_base_*テーブル専用）

import { supabase, RAG_TABLES } from '@/lib/supabase';
import type { Conversation, Message } from '@/types/index';

// supabaseとRAG_TABLESを他のサービスからも使用できるようエクスポート
export { supabase, RAG_TABLES };

// --------------------------------------------
// 会話の保存・取得
// --------------------------------------------

/**
 * 会話をSupabaseに保存
 * @param conversation 会話データ
 */
export const saveConversation = async (
  conversation: Conversation
): Promise<void> => {
  try {
    const { error } = await supabase.from(RAG_TABLES.CONVERSATIONS).upsert(
      {
        id: conversation.session_id,
        user_id: conversation.user_id,
        title: conversation.title,
        status: 'active',
        created_at: conversation.created_at,
        updated_at: conversation.updated_at || new Date().toISOString(),
      },
      {
        onConflict: 'id',
      }
    );

    if (error) {
      console.error('❌ Supabase会話保存エラー:', error);
      throw new Error(`会話の保存に失敗しました: ${error.message}`);
    }

    console.log('✅ Supabase会話保存成功:', conversation.session_id);
  } catch (error) {
    console.error('❌ 予期しないエラー:', error);
    throw error;
  }
};

/**
 * メッセージをSupabaseに保存
 * @param message メッセージデータ
 */
export const saveMessage = async (message: Message): Promise<void> => {
  try {
    const { error } = await supabase.from(RAG_TABLES.MESSAGES).insert({
      id: message.message_id,
      conversation_id: message.session_id,
      role: message.role,
      content: message.content,
      created_at: message.created_at || new Date().toISOString(),
    });

    if (error) {
      console.error('❌ Supabaseメッセージ保存エラー:', error);
      throw new Error(`メッセージの保存に失敗しました: ${error.message}`);
    }

    console.log('✅ Supabaseメッセージ保存成功:', message.message_id);
  } catch (error) {
    console.error('❌ 予期しないエラー:', error);
    throw error;
  }
};

/**
 * 会話一覧を取得（Supabaseから）
 * @param userId ユーザーID
 */
export const getConversationsFromSupabase = async (
  userId: string
): Promise<Conversation[]> => {
  try {
    const { data, error } = await supabase
      .from(RAG_TABLES.CONVERSATIONS)
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase会話取得エラー:', error);
      throw new Error(`会話の取得に失敗しました: ${error.message}`);
    }

    console.log(`✅ Supabase会話取得成功: ${data?.length || 0}件`);

    return (
      data?.map((conv) => ({
        session_id: conv.id,
        user_id: conv.user_id,
        title: conv.title || '新しい会話',
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        message_count: 0, // メッセージ数は別途カウント
      })) || []
    );
  } catch (error) {
    console.error('❌ 予期しないエラー:', error);
    throw error;
  }
};

/**
 * メッセージ履歴を取得（Supabaseから）
 * @param sessionId セッションID
 */
export const getMessagesFromSupabase = async (
  sessionId: string
): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from(RAG_TABLES.MESSAGES)
      .select('*')
      .eq('conversation_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Supabaseメッセージ取得エラー:', error);
      throw new Error(`メッセージの取得に失敗しました: ${error.message}`);
    }

    console.log(`✅ Supabaseメッセージ取得成功: ${data?.length || 0}件`);

    return (
      data?.map((msg) => ({
        message_id: msg.id,
        session_id: msg.conversation_id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        created_at: msg.created_at,
      })) || []
    );
  } catch (error) {
    console.error('❌ 予期しないエラー:', error);
    throw error;
  }
};

/**
 * 会話を終了（ステータス更新 + 要約保存の準備）
 * @param sessionId セッションID
 * @param summary 会話要約（オプション）
 */
export const endConversation = async (
  sessionId: string,
  summary?: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from(RAG_TABLES.CONVERSATIONS)
      .update({
        status: 'ended',
        summary: summary || null,
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) {
      console.error('❌ Supabase会話終了エラー:', error);
      throw new Error(`会話の終了に失敗しました: ${error.message}`);
    }

    console.log('✅ Supabase会話終了成功:', sessionId);
  } catch (error) {
    console.error('❌ 予期しないエラー:', error);
    throw error;
  }
};

// --------------------------------------------
// メンター向け管理機能
// --------------------------------------------

/**
 * 全クライアントの会話を取得（メンター専用）
 */
export const getAllConversationsForMentor = async (): Promise<Conversation[]> => {
  try {
    const { data, error } = await supabase
      .from(RAG_TABLES.CONVERSATIONS)
      .select(
        `
        *,
        user:${RAG_TABLES.USERS}(email, full_name, role)
      `
      )
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase全会話取得エラー:', error);
      throw new Error(`会話の取得に失敗しました: ${error.message}`);
    }

    console.log(`✅ Supabase全会話取得成功: ${data?.length || 0}件`);

    return (
      data?.map((conv) => ({
        session_id: conv.id,
        user_id: conv.user_id,
        title: conv.title || '新しい会話',
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        message_count: 0,
      })) || []
    );
  } catch (error) {
    console.error('❌ 予期しないエラー:', error);
    throw error;
  }
};

/**
 * ユーザーRAG用データのエクスポート
 * @param userId ユーザーID
 * @param startDate 開始日（オプション）
 * @param endDate 終了日（オプション）
 * @returns エクスポートされた会話データ（Dify用フォーマット）
 */
export const exportConversationsForRAG = async (
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<string> => {
  try {
    let query = supabase
      .from(RAG_TABLES.CONVERSATIONS)
      .select(
        `
        id,
        title,
        created_at,
        messages:${RAG_TABLES.MESSAGES}(role, content, created_at)
      `
      )
      .eq('user_id', userId)
      .eq('status', 'ended'); // 終了した会話のみ

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Supabaseエクスポートエラー:', error);
      throw new Error(`データのエクスポートに失敗しました: ${error.message}`);
    }

    console.log(`✅ Supabaseエクスポート成功: ${data?.length || 0}件の会話`);

    // Dify用にテキスト形式でフォーマット
    let exportText = '';

    data?.forEach((conv) => {
      exportText += `\n\n=== 会話: ${conv.title} (${conv.created_at}) ===\n\n`;

      conv.messages?.forEach((msg: any) => {
        const role = msg.role === 'user' ? 'クライアント' : 'AIコーチ';
        exportText += `[${role}]: ${msg.content}\n\n`;
      });
    });

    return exportText;
  } catch (error) {
    console.error('❌ 予期しないエラー:', error);
    throw error;
  }
};
