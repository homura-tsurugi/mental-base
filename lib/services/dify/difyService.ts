// ============================================
// Dify API サービス
// ============================================
// Dify Cloud APIとの通信を管理

import axios from 'axios';
import type { AxiosInstance } from 'axios';

// --------------------------------------------
// Dify API クライアント設定
// --------------------------------------------

const DIFY_API_KEY = process.env.NEXT_PUBLIC_DIFY_API_KEY || '';
const DIFY_API_URL = process.env.NEXT_PUBLIC_DIFY_API_URL || 'https://api.dify.ai/v1';

if (!DIFY_API_KEY) {
  console.warn(
    '⚠️ NEXT_PUBLIC_DIFY_API_KEY が設定されていません。.env.local ファイルを確認してください。'
  );
}

/**
 * Dify API クライアントの作成
 */
const createDifyClient = (): AxiosInstance => {
  return axios.create({
    baseURL: DIFY_API_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DIFY_API_KEY}`,
    },
    timeout: 30000, // 30秒（AI応答待ち時間を考慮）
  });
};

const difyClient = createDifyClient();

// --------------------------------------------
// 型定義
// --------------------------------------------

export interface DifyMessage {
  message_id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  tokens_used?: number;
  citations?: Array<{
    source: string;
    content: string;
    dataset_type: 'system' | 'user';
  }>;
}

export interface DifyConversation {
  session_id: string;
  user_id: string;
  title?: string;
  created_at: string;
  updated_at?: string;
  message_count?: number;
}

export interface DifyChatRequest {
  session_id?: string;
  content: string;
  user_id: string;
}

export interface DifyChatResponse {
  message: DifyMessage;
  session_id: string;
}

// --------------------------------------------
// エラーハンドリング
// --------------------------------------------

interface DifyErrorResponse {
  code?: string;
  message?: string;
  status?: number;
}

const handleDifyError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const difyError = error.response?.data as DifyErrorResponse;
    const status = error.response?.status;
    const message = difyError?.message || error.message;

    console.error('Dify API エラー:', {
      status,
      code: difyError?.code,
      message,
    });

    if (status === 401) {
      throw new Error('APIキーが無効です。設定を確認してください。');
    } else if (status === 429) {
      throw new Error('API呼び出し制限に達しました。しばらく待ってから再試行してください。');
    } else if (status === 500) {
      throw new Error('Difyサーバーエラーが発生しました。しばらく待ってから再試行してください。');
    } else {
      throw new Error(`Dify API エラー: ${message}`);
    }
  }

  throw new Error('予期しないエラーが発生しました');
};

// --------------------------------------------
// Dify チャット API
// --------------------------------------------

/**
 * メッセージ送信
 */
export const sendMessage = async (
  request: DifyChatRequest
): Promise<DifyChatResponse> => {
  try {
    console.log('📤 Dify API リクエスト送信:', {
      url: `${DIFY_API_URL}/chat-messages`,
      user_id: request.user_id,
      session_id: request.session_id,
      content: request.content.substring(0, 50) + '...',
    });

    const response = await difyClient.post('/chat-messages', {
      inputs: {},
      query: request.content,
      user: request.user_id,
      conversation_id: request.session_id || undefined,
      response_mode: 'blocking',
    });

    console.log('📥 Dify API レスポンス受信:', {
      status: response.status,
      conversation_id: response.data.conversation_id,
      message_id: response.data.message_id,
    });

    const data = response.data;

    const assistantMessage: DifyMessage = {
      message_id: data.message_id || crypto.randomUUID(),
      session_id: data.conversation_id,
      role: 'assistant',
      content: data.answer,
      created_at: new Date().toISOString(),
      tokens_used: data.metadata?.usage?.total_tokens,
      citations: data.metadata?.retriever_resources?.map((resource: any) => ({
        source: resource.document_name || resource.segment_id,
        content: resource.content,
        dataset_type: resource.dataset_id?.includes('user') ? 'user' : 'system',
      })),
    };

    return {
      message: assistantMessage,
      session_id: data.conversation_id,
    };
  } catch (error) {
    return handleDifyError(error);
  }
};

/**
 * 会話一覧取得
 */
export const getConversations = async (userId: string): Promise<DifyConversation[]> => {
  try {
    const response = await difyClient.get('/conversations', {
      params: {
        user: userId,
        limit: 100,
      },
    });

    const data = response.data;

    return data.data.map((conv: any) => ({
      session_id: conv.id,
      user_id: userId,
      title: conv.name || '新しい会話',
      created_at: new Date(conv.created_at * 1000).toISOString(),
      updated_at: new Date(conv.updated_at * 1000).toISOString(),
      message_count: conv.message_count || 0,
    }));
  } catch (error) {
    return handleDifyError(error);
  }
};

/**
 * メッセージ履歴取得
 */
export const getMessages = async (sessionId: string): Promise<DifyMessage[]> => {
  try {
    const response = await difyClient.get(`/messages`, {
      params: {
        conversation_id: sessionId,
        limit: 100,
      },
    });

    const data = response.data;

    return data.data.map((msg: any) => ({
      message_id: msg.id,
      session_id: sessionId,
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.query || msg.answer,
      created_at: new Date(msg.created_at * 1000).toISOString(),
      tokens_used: msg.metadata?.usage?.total_tokens,
      citations: msg.metadata?.retriever_resources?.map((resource: any) => ({
        source: resource.document_name || resource.segment_id,
        content: resource.content,
        dataset_type: resource.dataset_id?.includes('user') ? 'user' : 'system',
      })),
    }));
  } catch (error) {
    return handleDifyError(error);
  }
};

/**
 * 新規会話作成
 */
export const createConversation = async (userId: string): Promise<DifyConversation> => {
  const newConversation: DifyConversation = {
    session_id: '',
    user_id: userId,
    title: '新しい会話',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    message_count: 0,
  };

  return Promise.resolve(newConversation);
};

/**
 * 会話削除
 */
export const deleteConversation = async (sessionId: string): Promise<void> => {
  try {
    await difyClient.delete(`/conversations/${sessionId}`);
  } catch (error) {
    return handleDifyError(error);
  }
};

/**
 * 会話をグループ化（今日、昨日、今週、それ以前）
 */
export const groupConversationsByDate = (
  conversations: DifyConversation[]
): Record<string, DifyConversation[]> => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: Record<string, DifyConversation[]> = {
    今日: [],
    昨日: [],
    今週: [],
    それ以前: [],
  };

  conversations.forEach((conv) => {
    const convDate = new Date(conv.updated_at || conv.created_at);
    const convDay = new Date(convDate.getFullYear(), convDate.getMonth(), convDate.getDate());

    if (convDay.getTime() === today.getTime()) {
      groups['今日'].push(conv);
    } else if (convDay.getTime() === yesterday.getTime()) {
      groups['昨日'].push(conv);
    } else if (convDay.getTime() >= weekAgo.getTime()) {
      groups['今週'].push(conv);
    } else {
      groups['それ以前'].push(conv);
    }
  });

  return groups;
};
