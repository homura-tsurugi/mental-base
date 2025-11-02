/// <reference types="vite/client" />

/**
 * Vite環境変数の型定義
 * プロジェクト: Mental-Base MVP
 *
 * E2Eテスト環境用の環境変数型を定義
 */

interface ImportMetaEnv {
  /**
   * 認証スキップモード（E2Eテスト用）
   * true: 認証をスキップしてモックユーザーを使用
   * false: 通常の認証フロー（デフォルト）
   * 警告: 本番環境では絶対にtrueにしないこと！
   */
  readonly VITE_SKIP_AUTH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Node.js環境変数の拡張
 * Next.js Server Componentsで使用される環境変数の型定義
 */
declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * 認証スキップモード（E2Eテスト用）
     * DAL (Data Access Layer)で参照される
     */
    VITE_SKIP_AUTH?: string;

    /**
     * 既存の環境変数（参考）
     */
    NEXTAUTH_SECRET: string;
    NEXTAUTH_URL: string;
    DATABASE_URL: string;
    DIRECT_DATABASE_URL: string;
    ANTHROPIC_API_KEY: string;
    OPENAI_API_KEY: string;
    NODE_ENV: 'development' | 'production' | 'test';
    FRONTEND_URL: string;
    BACKEND_URL: string;
    CORS_ORIGIN: string;
    NEXT_PUBLIC_API_URL: string;
  }
}
