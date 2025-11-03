// ============================================
// Dify Dataset API サービス（ユーザーRAG構築）
// ============================================
// Supabaseの会話履歴をDifyのDatasetにアップロードしてユーザーRAGを構築

import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { exportConversationsForRAG } from './ragSupabaseService';

// --------------------------------------------
// Dify Dataset API クライアント設定
// --------------------------------------------

const DIFY_API_KEY = process.env.NEXT_PUBLIC_DIFY_API_KEY;
const DIFY_API_URL = process.env.NEXT_PUBLIC_DIFY_API_URL || 'https://api.dify.ai/v1';

if (!DIFY_API_KEY) {
  console.warn(
    '⚠️ NEXT_PUBLIC_DIFY_API_KEY が設定されていません。.env.local ファイルを確認してください。'
  );
}

/**
 * Dify Dataset API クライアントの作成
 */
const createDifyDatasetClient = (): AxiosInstance => {
  return axios.create({
    baseURL: DIFY_API_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DIFY_API_KEY}`,
    },
    timeout: 60000, // 60秒（ベクトル化処理を考慮）
  });
};

const difyDatasetClient = createDifyDatasetClient();

// --------------------------------------------
// Dataset API 型定義
// --------------------------------------------

interface CreateDatasetRequest {
  name: string;
}

interface CreateDatasetResponse {
  id: string;
  name: string;
  description?: string;
  permission: string;
  data_source_type: string;
  indexing_technique: string;
  created_at: number;
}

interface CreateDocumentRequest {
  indexing_technique: 'high_quality' | 'economy';
  process_rule: {
    mode: 'automatic' | 'custom';
    rules?: {
      pre_processing_rules?: Array<{
        id: string;
        enabled: boolean;
      }>;
      segmentation?: {
        separator: string;
        max_tokens: number;
      };
    };
  };
  data_source: {
    type: 'upload_file' | 'text';
    info?: string; // テキストの場合の内容
    info_list?: {
      text: string;
      name: string;
    };
  };
}

interface CreateDocumentResponse {
  document: {
    id: string;
    position: number;
    data_source_type: string;
    name: string;
    created_at: number;
  };
  batch: string;
}

// --------------------------------------------
// Dataset管理
// --------------------------------------------

/**
 * ユーザー専用のDatasetを作成
 * @param userId ユーザーID
 * @returns Dataset ID
 */
export const createUserDataset = async (userId: string): Promise<string> => {
  try {
    const datasetName = `ユーザーRAG_${userId}`;

    console.log('📤 Dify Dataset作成リクエスト送信:', datasetName);

    const response = await difyDatasetClient.post<CreateDatasetResponse>('/datasets', {
      name: datasetName,
    } as CreateDatasetRequest);

    const datasetId = response.data.id;

    console.log('✅ Dify Dataset作成成功:', datasetId);

    return datasetId;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Dify Dataset作成エラー:', error.response?.data);
      throw new Error(`Dataset作成に失敗しました: ${error.message}`);
    }
    throw error;
  }
};

/**
 * Datasetの一覧を取得
 * @returns Dataset一覧
 */
export const listDatasets = async (): Promise<CreateDatasetResponse[]> => {
  try {
    const response = await difyDatasetClient.get<{ data: CreateDatasetResponse[] }>('/datasets', {
      params: {
        page: 1,
        limit: 100,
      },
    });

    console.log(`✅ Dify Dataset一覧取得成功: ${response.data.data?.length || 0}件`);

    return response.data.data || [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Dify Dataset一覧取得エラー:', error.response?.data);
      throw new Error(`Dataset一覧の取得に失敗しました: ${error.message}`);
    }
    throw error;
  }
};

/**
 * ユーザー専用のDataset IDを取得（存在しない場合は作成）
 * @param userId ユーザーID
 * @returns Dataset ID
 */
export const getUserDatasetId = async (userId: string): Promise<string> => {
  try {
    const datasetName = `ユーザーRAG_${userId}`;

    // 既存のDatasetを検索
    const datasets = await listDatasets();
    const existingDataset = datasets.find((ds) => ds.name === datasetName);

    if (existingDataset) {
      console.log('✅ 既存のDatasetを使用:', existingDataset.id);
      return existingDataset.id;
    }

    // 存在しない場合は新規作成
    console.log('📝 新規Datasetを作成します...');
    return await createUserDataset(userId);
  } catch (error) {
    console.error('❌ Dataset ID取得エラー:', error);
    throw error;
  }
};

// --------------------------------------------
// ドキュメント管理
// --------------------------------------------

/**
 * ユーザーRAG用ドキュメントをアップロード
 * @param datasetId Dataset ID
 * @param content ドキュメント内容（会話履歴テキスト）
 * @param documentName ドキュメント名
 * @returns Document ID
 */
export const uploadDocument = async (
  datasetId: string,
  content: string,
  documentName: string
): Promise<string> => {
  try {
    console.log('📤 Dify ドキュメントアップロード開始:', {
      datasetId,
      documentName,
      contentLength: content.length,
    });

    const response = await difyDatasetClient.post<CreateDocumentResponse>(
      `/datasets/${datasetId}/document/create_by_text`,
      {
        name: documentName,
        text: content,
        indexing_technique: 'high_quality', // 高品質ベクトル化
        process_rule: {
          mode: 'automatic', // 自動処理
          rules: {
            segmentation: {
              separator: '\n\n', // 会話単位で分割
              max_tokens: 500, // チャンクサイズ
            },
          },
        },
      }
    );

    const documentId = response.data.document.id;

    console.log('✅ Dify ドキュメントアップロード成功:', documentId);

    return documentId;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Dify ドキュメントアップロードエラー:', error.response?.data);
      throw new Error(`ドキュメントのアップロードに失敗しました: ${error.message}`);
    }
    throw error;
  }
};

// --------------------------------------------
// ユーザーRAG構築（統合フロー）
// --------------------------------------------

/**
 * ユーザーRAGを構築（Supabase → Dify Dataset）
 * @param userId ユーザーID
 * @param startDate 開始日（オプション）
 * @param endDate 終了日（オプション）
 * @returns 構築されたDocument ID
 */
export const buildUserRAG = async (
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<{
  datasetId: string;
  documentId: string;
  conversationCount: number;
}> => {
  try {
    console.log('🚀 ユーザーRAG構築開始:', { userId, startDate, endDate });

    // 1. Supabaseから会話履歴をエクスポート
    console.log('📥 Supabaseから会話履歴をエクスポート中...');
    const exportedText = await exportConversationsForRAG(userId, startDate, endDate);

    if (!exportedText || exportedText.trim().length === 0) {
      throw new Error('エクスポートする会話データがありません');
    }

    // 会話数をカウント
    const conversationCount = (exportedText.match(/=== 会話:/g) || []).length;

    console.log(`✅ エクスポート完了: ${conversationCount}件の会話`);

    // 2. ユーザー専用のDataset IDを取得（なければ作成）
    console.log('📝 Dataset IDを取得中...');
    const datasetId = await getUserDatasetId(userId);

    // 3. ドキュメントをアップロード
    const documentName = `会話履歴_${startDate || '全期間'}_${endDate || new Date().toISOString().split('T')[0]}`;
    console.log('📤 ドキュメントをDifyにアップロード中...');
    const documentId = await uploadDocument(datasetId, exportedText, documentName);

    console.log('✅ ユーザーRAG構築完了:', {
      datasetId,
      documentId,
      conversationCount,
    });

    return {
      datasetId,
      documentId,
      conversationCount,
    };
  } catch (error) {
    console.error('❌ ユーザーRAG構築エラー:', error);
    throw error;
  }
};

/**
 * 週次ユーザーRAG更新（既存ドキュメント削除 + 新規アップロード）
 * @param userId ユーザーID
 * @returns 更新されたDocument ID
 */
export const updateUserRAGWeekly = async (userId: string): Promise<{
  datasetId: string;
  documentId: string;
  conversationCount: number;
}> => {
  try {
    console.log('🔄 週次ユーザーRAG更新開始:', userId);

    // 過去7日間の会話をエクスポート
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // ユーザーRAGを構築（既存データに追加）
    const result = await buildUserRAG(userId, startDate, endDate);

    console.log('✅ 週次ユーザーRAG更新完了');

    return result;
  } catch (error) {
    console.error('❌ 週次ユーザーRAG更新エラー:', error);
    throw error;
  }
};
