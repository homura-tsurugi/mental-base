import { createClient } from '@supabase/supabase-js';

// 環境変数から取得（ルートの.env.localから読み込まれる）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase環境変数が設定されていません。\n' +
    'NEXT_PUBLIC_SUPABASE_URLとNEXT_PUBLIC_SUPABASE_ANON_KEYを.env.localに設定してください。'
  );
}

// Supabaseクライアントの初期化
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
});

// データベーステーブル名の定義（mental_base_*プレフィックス必須）
// Mental-BaseとRag-Baseは同じSupabaseプロジェクトを共有
export const TABLES = {
  // Mental-Base用テーブル（Prismaで管理）
  USERS: 'mental_base_users',
  GOALS: 'mental_base_goals',
  TASKS: 'mental_base_tasks',
  LOGS: 'mental_base_logs',
  REFLECTIONS: 'mental_base_reflections',
  MENTOR_CLIENT_RELATIONSHIPS: 'mental_base_mentor_client_relationships',
  CLIENT_DATA_ACCESS_PERMISSIONS: 'mental_base_client_data_access_permissions',
  CLIENT_DATA_VIEW_LOGS: 'mental_base_client_data_view_logs',
  MENTOR_NOTES: 'mental_base_mentor_notes',
  CLIENT_PROGRESS_REPORTS: 'mental_base_client_progress_reports',
} as const;

// Rag-Base用テーブル（Dify統合用）
export const RAG_TABLES = {
  USERS: 'rag_base_users',
  CONVERSATIONS: 'rag_base_conversations',
  MESSAGES: 'rag_base_messages',
  KNOWLEDGE_BASE: 'rag_base_knowledge_base',
  SUMMARIES: 'rag_base_summaries',
} as const;
