# AIアシスタントAPI仕様書

生成日: 2025-11-01
収集元: lib/services/AIAssistantService.ts
@MOCK_TO_APIマーク数: 5

---

## エンドポイント一覧

### 1. AIアシスタントモード情報取得

- **エンドポイント**: `GET /api/ai-assistant/modes`
- **説明**: 4つのAIアシスタントモード情報を取得
- **認証**: 必須

**Request**: なし

**Response**: `AIAssistantModeInfo[]`

```typescript
[
  {
    mode: 'problem_solving',
    label: '課題解決モード',
    description: '抱えている問題について相談してください。一緒に解決策を考えましょう。',
    icon: 'psychology',
    welcomeMessage: 'こんにちは！課題解決モードです。抱えている問題について相談してください。一緒に解決策を考えましょう。'
  },
  {
    mode: 'learning_support',
    label: '学習支援モード',
    description: 'COMPASS教材の学習をサポートします。どの部分について学びたいですか？',
    icon: 'school',
    welcomeMessage: 'こんにちは！学習支援モードです。COMPASS教材の学習をサポートします。どの部分について学びたいですか？'
  },
  {
    mode: 'planning',
    label: '計画立案モード',
    description: '目標設定や計画づくりをアシストします。どんな目標を立てたいですか？',
    icon: 'assignment',
    welcomeMessage: 'こんにちは！計画立案モードです。目標設定や計画づくりをアシストします。どんな目標を立てたいですか？'
  },
  {
    mode: 'mentoring',
    label: '伴走補助モード',
    description: 'あなたのログを分析して、継続的なサポートをします。進捗状況を確認しましょう。',
    icon: 'support_agent',
    welcomeMessage: 'こんにちは！伴走補助モードです。あなたのログを分析して、継続的なサポートをします。進捗状況を確認しましょう。'
  }
]
```

---

### 2. チャット履歴取得

- **エンドポイント**: `GET /api/ai-assistant/chat/history`
- **説明**: ユーザーのチャット履歴を取得（モード別フィルタリング、ページネーション対応）
- **認証**: 必須
- **複合API処理**: AIA-001（requirements.md参照）

**Query Parameters**:

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|---|------|-----------|------|
| mode | string | 任意 | - | モードフィルタ（problem_solving/learning_support/planning/mentoring） |
| limit | number | 任意 | 50 | 取得件数 |
| cursor | string | 任意 | - | ページネーションカーソル |

**Request例**:
```
GET /api/ai-assistant/chat/history?mode=problem_solving&limit=20
```

**Response**: `ChatHistoryResponse`

```typescript
{
  messages: [
    {
      id: 'msg-001',
      userId: 'user1',
      role: 'user',
      content: 'プロジェクトの進捗管理がうまくいきません',
      mode: 'problem_solving',
      createdAt: '2025-11-01T10:30:00Z'
    },
    {
      id: 'msg-002',
      userId: 'user1',
      role: 'assistant',
      content: 'ご質問ありがとうございます...',
      mode: 'problem_solving',
      createdAt: '2025-11-01T10:30:05Z'
    }
  ],
  hasMore: true,
  nextCursor: 'cursor-abc123'
}
```

#### 内部処理フロー（AIA-001）

1. **ユーザー認証確認**: セッションからuserIdを取得
2. **モードフィルタリング**: 指定されたmodeのチャット履歴のみ取得
3. **ページネーション処理**: limit, cursorを使って適切な範囲を取得
4. **ソート**: createdAtの降順（新しい順）
5. **hasMoreフラグ計算**: 次のページがあるかどうか
6. **nextCursor生成**: 次のページ取得用のカーソル

---

### 3. メッセージ送信とAI応答取得

- **エンドポイント**: `POST /api/ai-assistant/chat/send`
- **説明**: ユーザーメッセージを送信し、AI応答を取得
- **認証**: 必須
- **複合API処理**: AIA-002（requirements.md参照）

**Request**: `ChatMessageForm`

```typescript
{
  content: string;  // メッセージ内容（1文字以上2000文字以下）
  mode: string;     // problem_solving | learning_support | planning | mentoring
}
```

**Request例**:
```json
{
  "content": "プロジェクトの進捗管理がうまくいきません",
  "mode": "problem_solving"
}
```

**Response**: `AIChatResponse`

```typescript
{
  messageId: string;      // AI応答メッセージのID
  content: string;        // AI応答内容
  mode: string;           // 使用したモード
  timestamp: Date;        // 応答タイムスタンプ
}
```

**Response例**:
```json
{
  "messageId": "msg-003",
  "content": "ご質問ありがとうございます。「プロジェクトの進捗管理がうまくいきません」についてですね...",
  "mode": "problem_solving",
  "timestamp": "2025-11-01T10:30:05Z"
}
```

#### 内部処理フロー（AIA-002）

1. **ユーザーメッセージ保存**:
   - ChatMessageテーブルに保存（role: 'user'）
   - userId, content, mode, createdAtを記録

2. **コンテキスト情報取得**:
   - 最新の目標（Goal）: 最大5件
   - 最新のタスク（Task）: 最大10件
   - 最新のログ（Log）: 最大10件
   - 最新の振り返り（Reflection）: 最大5件

3. **AI APIプロンプト生成**:
   - システムプロンプト: モード固有の指示を含める
     - **課題解決モード**: 問題分析と解決策提案に特化
     - **学習支援モード**: COMPASS教材の説明と学習サポート
     - **計画立案モード**: SMART目標設定とアクションプラン作成
     - **伴走補助モード**: ログデータ分析と継続的サポート
   - コンテキスト情報: 取得した目標、タスク、ログ、振り返りを含める
   - ユーザーメッセージ: contentを含める

4. **AI API呼び出し**:
   - **開発環境**: Anthropic Claude 3.5 Sonnet
     - Rate Limit: 5リクエスト/分
     - Context: 200K tokens
     - コスト: $3/1M input tokens
   - **本番環境**: OpenAI GPT-4o mini
     - Rate Limit: 500リクエスト/分
     - Context: 128K tokens
     - コスト: $0.15/1M input tokens
   - **タイムアウト**: 30秒
   - **リトライ**: 最大3回（exponential backoff）

5. **AI応答保存**:
   - ChatMessageテーブルに保存（role: 'assistant'）
   - userId, content, mode, createdAtを記録

6. **レスポンス返却**:
   - messageId, content, mode, timestampを返却

---

### 4. AIアシスタントページ初期データ取得

- **エンドポイント**: `GET /api/ai-assistant/page-data`
- **説明**: ページ初期表示に必要なデータを一括取得
- **認証**: 必須

**Query Parameters**:

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|---|------|-----------|------|
| mode | string | 任意 | problem_solving | 初期表示モード |

**Request例**:
```
GET /api/ai-assistant/page-data?mode=problem_solving
```

**Response**: `AIAssistantPageData`

```typescript
{
  selectedMode: 'problem_solving',
  modeOptions: AIAssistantModeInfo[],  // モード情報4件
  chatHistory: ChatMessage[],          // 選択モードの履歴
  isLoading: false
}
```

#### 内部処理フロー

1. デフォルトモード設定（problem_solving）
2. モード情報取得（getModeOptions相当）
3. チャット履歴取得（getChatHistory相当）
4. 統合データ返却

---

### 5. チャット履歴クリア（開発用）

- **エンドポイント**: `DELETE /api/ai-assistant/chat/history`
- **説明**: ユーザーのチャット履歴を全削除（開発・デバッグ用）
- **認証**: 必須

**Request**: なし

**Response**: `void`（204 No Content）

---

## 型定義

すべての型定義は `types/index.ts` を参照してください。

### 主要な型

#### AIAssistantMode (Enum)
```typescript
export enum AIAssistantMode {
  PROBLEM_SOLVING = 'problem_solving',   // 課題解決モード
  LEARNING_SUPPORT = 'learning_support', // 学習支援モード
  PLANNING = 'planning',                 // 計画立案モード
  MENTORING = 'mentoring',               // 伴走補助モード
}
```

#### ChatMessage
```typescript
export interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  mode: AIAssistantMode;
  context?: Record<string, any>;
  createdAt: Date;
}
```

#### ChatMessageForm
```typescript
export interface ChatMessageForm {
  content: string;  // 1~2000文字
  mode: AIAssistantMode;
}
```

#### AIChatResponse
```typescript
export interface AIChatResponse {
  messageId: string;
  content: string;
  mode: AIAssistantMode;
  timestamp: Date;
}
```

#### ChatHistoryResponse
```typescript
export interface ChatHistoryResponse {
  messages: ChatMessage[];
  hasMore: boolean;
  nextCursor?: string;
}
```

#### AIAssistantPageData
```typescript
export interface AIAssistantPageData {
  selectedMode: AIAssistantMode;
  modeOptions: AIAssistantModeInfo[];
  chatHistory: ChatMessage[];
  isLoading: boolean;
}
```

---

## バリデーションルール

### メッセージ送信

| フィールド | ルール | エラーメッセージ |
|-----------|--------|----------------|
| content | 1文字以上 | 「メッセージを入力してください」 |
| content | 2000文字以下 | 「メッセージは2000文字以内で入力してください」 |
| content | 空白のみ禁止 | 「メッセージを入力してください」 |
| mode | 有効なモード | 「無効なモードです」 |

### チャット履歴取得

| フィールド | ルール | デフォルト |
|-----------|--------|-----------|
| limit | 1~100 | 50 |
| mode | 有効なモード（任意） | - |

---

## エラーレスポンス

すべてのエンドポイントで以下のエラーレスポンス形式を使用：

```typescript
{
  error: string;        // エラータイプ
  message: string;      // ユーザー向けメッセージ
  detail?: any;         // 詳細情報（オプション）
}
```

### HTTPステータスコード

| コード | 説明 | 例 |
|-------|------|---|
| 200 | 成功 | データ取得成功 |
| 201 | 作成成功 | メッセージ送信成功 |
| 204 | 成功（コンテンツなし） | 履歴削除成功 |
| 400 | リクエストエラー | バリデーションエラー |
| 401 | 認証エラー | セッション期限切れ |
| 403 | 権限エラー | 他ユーザーのデータアクセス |
| 404 | 未存在 | チャット履歴なし |
| 429 | Rate Limit | AI API Rate Limit超過 |
| 500 | サーバーエラー | AI API接続エラー |
| 504 | タイムアウト | AI API応答タイムアウト（30秒） |

---

## セキュリティ

### 認証・認可

1. **セッション検証**: すべてのエンドポイントで必須
   - Auth.js (NextAuth v5) Data Access Layer パターン
   - JWT暗号化（JWE, A256GCM）
   - HttpOnly Cookie

2. **ユーザーデータ分離**:
   - 各エンドポイントでuserIdでフィルタリング
   - 他ユーザーのチャット履歴にアクセス不可

3. **CSRF保護**:
   - Auth.js標準実装
   - CSRFトークン検証

### XSS対策

1. **入力サニタイゼーション**:
   - メッセージ送信時にHTMLタグをエスケープ
   - DOMPurifyライブラリ使用（フロントエンド）

2. **出力エスケープ**:
   - React標準のXSS保護
   - `dangerouslySetInnerHTML` 使用禁止

### Rate Limiting

1. **AI API Rate Limit**:
   - Claude: 5リクエスト/分（開発）
   - OpenAI: 500リクエスト/分（本番）
   - exponential backoffでリトライ

2. **ユーザーごとのRate Limit**:
   - 60リクエスト/分（検討中）
   - Redis使用（Upstash）

---

## パフォーマンス最適化

### キャッシュ戦略

1. **モード情報**:
   - 静的データ（変更なし）
   - Redis Cache: 24時間
   - CDN Cache: 可能

2. **チャット履歴**:
   - ユーザーごとに動的
   - Redis Cache: 5分
   - stale-while-revalidate

### データベースインデックス

```sql
-- ChatMessageテーブル
CREATE INDEX idx_chat_message_user_mode_created
  ON chat_messages (user_id, mode, created_at DESC);

CREATE INDEX idx_chat_message_created
  ON chat_messages (created_at DESC);
```

---

## モックサービス参照

実装時はこのモックサービスの挙動を参考にしてください：

```typescript
// lib/services/AIAssistantService.ts
```

モックサービスには以下が実装されています：
- ✅ 4つのモード情報提供
- ✅ モード別チャット履歴フィルタリング
- ✅ メッセージ送信とAI応答生成（モック）
- ✅ ページネーション基本実装
- ✅ 遅延シミュレーション（API呼び出し再現）

---

## 開発環境

### ローカル開発

```bash
# モックサービス使用（デフォルト）
npm run dev

# AIアシスタントページにアクセス
http://localhost:3247/ai-assistant
```

### API切り替え

モック→実APIへの切り替えは `lib/services/AIAssistantService.ts` の各メソッドで実装：

```typescript
// Before (モック)
async getChatHistory(mode?: AIAssistantMode): Promise<ChatHistoryResponse> {
  await this.delay(300);
  // モックデータ返却
}

// After (実API)
async getChatHistory(mode?: AIAssistantMode): Promise<ChatHistoryResponse> {
  const response = await fetch(
    `/api/ai-assistant/chat/history?mode=${mode}`,
    { credentials: 'include' }
  );
  if (!response.ok) throw new Error('Failed to fetch chat history');
  return response.json();
}
```

---

## テスト

### E2Eテスト仕様書

詳細は `docs/e2e-specs/ai-assistant-e2e.md` を参照してください。

**総テスト項目数**: 50項目
- 正常系: 24項目
- 異常系: 10項目
- セキュリティ: 6項目
- レスポンシブ: 5項目
- ワークフロー: 5項目

---

## 今後の拡張予定

### フェーズ2

1. **音声入力機能**:
   - Web Speech API使用
   - 音声→テキスト変換

2. **画像添付機能**:
   - Cloudinary使用
   - 画像アップロード・最適化

3. **チャット履歴エクスポート**:
   - JSON/PDF形式
   - 日付範囲指定

4. **お気に入りメッセージ**:
   - ブックマーク機能
   - タグ付け

5. **AI応答評価機能**:
   - Good/Bad フィードバック
   - AI精度向上

---

**API仕様書 完**

バックエンド実装時は、この仕様書とモックサービスを参照してください。
