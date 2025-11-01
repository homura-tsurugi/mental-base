# プロジェクト設定

## 基本設定

```yaml
プロジェクト名: ライフ・ワークガバナンス プラットフォーム（Mental-Base MVP）
開始日: 2025-11-01
プロジェクトタイプ: MVP（Minimum Viable Product）
技術スタック:
  frontend: React 18 + Next.js 15 + TypeScript 5 + TailwindCSS + shadcn/ui
  backend: Python 3.12 + FastAPI
  database: PostgreSQL 16 (Supabase)
  ai: Claude 3.5 Sonnet / OpenAI GPT-4o mini
```

## 開発環境

```yaml
ポート設定:
  # 複数プロジェクト並行開発のため、一般的でないポートを使用
  frontend: 3247
  backend: 8432
  database: 5433

環境変数:
  設定ファイル: .env.local（ルートディレクトリ）
  必須項目:
    # 認証
    - NEXTAUTH_SECRET
    - NEXTAUTH_URL
    # データベース
    - DATABASE_URL
    # AI API
    - ANTHROPIC_API_KEY
    - OPENAI_API_KEY
    # メール送信（オプション）
    - RESEND_API_KEY
```

## テスト認証情報

```yaml
開発用アカウント:
  email: test@mentalbase.local
  password: MentalBase2025!Dev

外部サービス:
  Claude API: 開発・テスト用（$10無料枠）
  OpenAI API: 本番用（GPT-4o mini）
  Supabase: 無料枠利用
```

## コーディング規約

### 命名規則

```yaml
ファイル名:
  - コンポーネント: PascalCase.tsx (例: UserProfile.tsx)
  - ページ: kebab-case.tsx (例: plan-do.tsx)
  - ユーティリティ: camelCase.ts (例: formatDate.ts)
  - 定数: UPPER_SNAKE_CASE.ts (例: API_ENDPOINTS.ts)
  - 型定義: types.ts または index.ts

変数・関数:
  - 変数: camelCase (例: userData, isLoading)
  - 関数: camelCase (例: getUserData, handleSubmit)
  - 定数: UPPER_SNAKE_CASE (例: MAX_RETRIES, API_BASE_URL)
  - 型/インターフェース: PascalCase (例: User, GoalData)
  - Enum: PascalCase (例: UserRole, TaskStatus)
```

### コード品質

```yaml
必須ルール:
  - TypeScript: strictモード有効
  - 未使用の変数/import禁止
  - console.log本番環境禁止（開発時のみ使用）
  - エラーハンドリング必須（try-catch、Error Boundary）
  - 非同期処理は必ずasync/await使用
  - プロップス型定義必須

フォーマット:
  - インデント: スペース2つ
  - セミコロン: あり
  - クォート: シングル（'）
  - 行末カンマ: あり（trailing comma）
  - 改行コード: LF
```

### React/Next.js 規約

```yaml
コンポーネント:
  - 関数コンポーネントを使用（クラスコンポーネント禁止）
  - Server ComponentsとClient Componentsを明確に分離
  - "use client"ディレクティブは必要最小限
  - カスタムフックは必ずuseプレフィックス（例: useGoals, useAuth）

ディレクトリ構成:
  app/: Next.js App Router（ページ、レイアウト）
  components/: 再利用可能なUIコンポーネント
  lib/: ユーティリティ関数、ヘルパー
  types/: 型定義
  hooks/: カスタムフック
  stores/: Zustand状態管理
  styles/: グローバルスタイル
```

### コミットメッセージ

```yaml
形式: [type]: [description]

type:
  - feat: 新機能追加
  - fix: バグ修正
  - docs: ドキュメント更新
  - style: コードフォーマット（機能変更なし）
  - refactor: リファクタリング
  - test: テスト追加・修正
  - chore: ビルド、設定ファイル等の変更

例:
  - "feat: ユーザー認証機能を追加"
  - "fix: ダッシュボードの進捗率計算エラーを修正"
  - "docs: README.mdにセットアップ手順を追加"
```

## プロジェクト固有ルール

### APIエンドポイント

```yaml
命名規則:
  - RESTful形式を厳守
  - 複数形を使用 (/users, /goals, /tasks)
  - ケバブケース使用 (/user-profiles, /ai-analysis)
  - バージョニング: /api/v1/...（将来的に）

エンドポイント構成:
  認証: /api/auth/*
  ユーザー: /api/users/*
  目標: /api/goals/*
  タスク: /api/tasks/*
  ログ: /api/logs/*
  振り返り: /api/reflections/*
  AI分析: /api/analysis/*
  AIチャット: /api/chat/*
```

### 型定義

```yaml
配置:
  frontend: types/index.ts
  backend: app/models/ または app/schemas/

同期ルール:
  - フロントエンドとバックエンドで共通の型定義を使用
  - backend側で型を定義し、frontend側にコピー
  - 型の変更時は必ず両方を更新

重要な型:
  - User: ユーザー情報
  - Goal: 目標
  - Task: タスク
  - Log: ログ記録
  - Reflection: 振り返り
  - AIAnalysisReport: AI分析レポート
  - ChatMessage: AIチャット
```

### エラーハンドリング

```yaml
フロントエンド:
  - React Query の error handling 活用
  - Error Boundary でコンポーネントレベルのエラーをキャッチ
  - ユーザーフレンドリーなエラーメッセージ表示

バックエンド:
  - FastAPIの例外ハンドラー使用
  - HTTPステータスコード適切に設定
  - エラーレスポンス形式統一: { error: "message", detail: {...} }

共通:
  - AI API呼び出しのタイムアウト設定（30秒）
  - Rate Limit超過時のリトライロジック（exponential backoff）
  - ネットワークエラー時のフォールバック
```

## 🆕 最新技術情報（知識カットオフ対応）

```yaml
破壊的変更・重要な更新:
  - Auth.js v5はまだbeta版（2025年1月時点）
    - beta.25が最新、安定版ではない
    - Middlewareでの認証は非推奨（CVE-2025-29927対応）
    - Data Access Layer (DAL)パターンを使用

  - Next.js 15の変更点:
    - App Routerがデフォルト
    - PWA公式サポート開始
    - React Server Components標準化

  - iOS Safari PWA制約:
    - プッシュ通知非対応
    - ストレージ制限あり（Safari終了時にクリアされる可能性）
    - インストール方法がAndroidと異なる

AI API最新情報:
  - Claude 3.5 Sonnet: 200K context、$3/1M input tokens
  - GPT-4o mini: 128K context、$0.15/1M input tokens
  - Rate Limit: Claude Free Tier 5 req/min、OpenAI Tier 1 500 req/min
```

## ⚠️ プロジェクト固有の注意事項

```yaml
セキュリティ:
  - .env.localファイルは絶対にGitにコミットしない
  - APIキーは環境変数で管理
  - NEXTAUTH_SECRETは本番環境で必ず変更
  - HTTPS必須（本番環境）
  - パスワードは必ずbcryptでハッシュ化（ソルトラウンド10）

パフォーマンス:
  - AI API呼び出しは非同期処理
  - 画像は必ずNext.js Imageコンポーネント使用
  - Dynamic Importsでコード分割
  - Lighthouseモバイルスコア90+目標

AI API制約:
  - Claude Free Tier: 5リクエスト/分、$10上限
  - OpenAI Tier 1: 500リクエスト/分、30,000トークン/分
  - タイムアウト: 30秒
  - エラー時のリトライ: 最大3回、exponential backoff

データベース:
  - Supabase無料枠: 500MB、50,000 MAU/月
  - コネクション数制限: 60同時接続
  - Prismaのコネクションプーリング推奨

モバイルPWA:
  - iOS Safariではプッシュ通知不可
  - オフライン対応は段階的に実装
  - Service Workerキャッシュ戦略を慎重に設計
```

## 📝 実装パターン

### 認証パターン

```typescript
// Server Component内での認証チェック（推奨）
import { auth } from "@/auth"

export default async function ProtectedPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth")
  }

  return <div>Protected Content</div>
}

// Data Access Layer パターン（CVE-2025-29927対応）
// lib/dal.ts
import { auth } from "@/auth"
import { cache } from "react"

export const verifySession = cache(async () => {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  return { userId: session.user.id }
})
```

### AI API呼び出しパターン

```python
# バックエンド: FastAPI
from anthropic import Anthropic
import openai
from fastapi import HTTPException
import asyncio

async def call_ai_with_retry(prompt: str, max_retries: int = 3):
    """AI APIをリトライロジック付きで呼び出し"""
    for attempt in range(max_retries):
        try:
            # Claude API例
            client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text
        except Exception as e:
            if attempt == max_retries - 1:
                raise HTTPException(status_code=500, detail=str(e))
            await asyncio.sleep(2 ** attempt)  # exponential backoff
```

### React Query パターン

```typescript
// フロントエンド: React Query
import { useQuery, useMutation } from '@tanstack/react-query'

// データ取得
const { data, isLoading, error } = useQuery({
  queryKey: ['goals', userId],
  queryFn: () => fetchGoals(userId),
  staleTime: 5 * 60 * 1000, // 5分
})

// データ更新
const mutation = useMutation({
  mutationFn: createGoal,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['goals'] })
  },
})
```

## 📂 ディレクトリ構造

```
Mental-Base/
├── app/                     # Next.js App Router
│   ├── (auth)/             # 認証関連ページグループ
│   │   └── auth/           # ログイン・登録
│   ├── (protected)/        # 認証必須ページグループ
│   │   ├── page.tsx       # C-001: ホーム
│   │   ├── plan-do/       # C-002: 目標・実行
│   │   ├── check-action/  # C-003: 振り返り・改善
│   │   ├── ai-assistant/  # C-004: AIアシスタント
│   │   └── settings/      # C-005: 設定
│   ├── api/               # API Routes
│   │   └── auth/          # NextAuth endpoints
│   ├── layout.tsx         # ルートレイアウト
│   └── globals.css        # グローバルスタイル
├── components/            # UIコンポーネント
│   ├── ui/               # shadcn/uiコンポーネント
│   ├── auth/             # 認証関連コンポーネント
│   ├── dashboard/        # ダッシュボード関連
│   ├── goals/            # 目標関連
│   └── chat/             # AIチャット関連
├── lib/                  # ユーティリティ
│   ├── auth.ts          # Auth.js設定
│   ├── dal.ts           # Data Access Layer
│   ├── prisma.ts        # Prisma Client
│   └── utils.ts         # ヘルパー関数
├── types/               # 型定義
│   └── index.ts
├── hooks/               # カスタムフック
│   ├── useGoals.ts
│   ├── useTasks.ts
│   └── useChat.ts
├── stores/              # Zustand状態管理
│   └── userStore.ts
├── backend/             # FastAPI バックエンド
│   ├── app/
│   │   ├── main.py     # FastAPIアプリ
│   │   ├── models/     # データモデル
│   │   ├── routers/    # APIルーター
│   │   ├── schemas/    # Pydanticスキーマ
│   │   └── services/   # ビジネスロジック
│   ├── requirements.txt
│   └── Dockerfile
├── prisma/             # Prisma ORM
│   └── schema.prisma
├── public/             # 静的ファイル
│   ├── manifest.json   # PWA manifest
│   └── icons/
├── docs/               # ドキュメント
│   ├── requirements.md # 要件定義書
│   └── SCOPE_PROGRESS.md # 進捗管理
├── .env.local         # 環境変数（Gitにコミットしない）
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── CLAUDE.md          # このファイル
└── README.md
```

## 🚀 開発コマンド

```bash
# フロントエンド
npm install                 # 依存関係インストール
npm run dev                # 開発サーバー起動（ポート3247）
npm run build              # プロダクションビルド
npm run start              # プロダクション起動
npm run lint               # ESLint実行

# バックエンド
cd backend
pip install -r requirements.txt  # 依存関係インストール
uvicorn app.main:app --reload --port 8432  # 開発サーバー起動

# データベース
npx prisma generate        # Prisma Clientリフレッシュ
npx prisma db push         # スキーマをDBに反映
npx prisma studio          # Prisma Studio起動

# デプロイ
vercel                     # Vercelにデプロイ（フロントエンド）
gcloud run deploy          # Cloud Runにデプロイ（バックエンド）
```

## 📋 作業ログ（最新5件）

```yaml
- 2025-11-01: MVP要件定義書作成完了
- 2025-11-01: 技術スタック確定（React + Next.js 15 + FastAPI + Supabase）
- 2025-11-01: 6ページのMVP構成確定（認証1 + ユーザー5）
- 2025-11-01: AI API選定（Claude開発、OpenAI本番）
- 2025-11-01: プロジェクトセットアップ完了、開発準備完了
```

## 🎯 次のアクション

```yaml
即座に着手すべきタスク:
  1. Next.js 15 + TypeScript 5プロジェクトセットアップ
  2. Supabase PostgreSQLセットアップとDATABASE_URL取得
  3. Auth.js (NextAuth v5)セットアップ
  4. TailwindCSS + shadcn/uiセットアップ
  5. Prismaスキーマ作成（User, Goal, Task, Log）

優先度高:
  - P-001: 認証ページ実装（ログイン・登録）
  - C-001: ホーム（ダッシュボード）実装
  - FastAPIバックエンドセットアップ
```

---

**このファイルは定期的に更新してください。プロジェクトの進行に応じて作業ログと次のアクションを更新します。**
