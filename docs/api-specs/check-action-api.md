# Check/Action（振り返り・改善）ページ API仕様書

**生成日**: 2025-11-01
**収集元**: `lib/services/CheckActionService.ts`
**@MOCK_TO_APIマーク数**: 9
**複合API処理数**: 1（複合処理-001: AI分析レポート生成）

---

## エンドポイント一覧

### 1. Check/Actionページデータ取得

- **エンドポイント**: `GET /api/check-action`
- **説明**: Check/Actionページ全体で必要なデータを一括取得
- **認証**: 必須

#### Request
```typescript
Query Parameters:
  period: PeriodType         // 'today' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom'
  startDate?: string         // ISO 8601形式（periodがcustomの場合必須）
  endDate?: string           // ISO 8601形式（periodがcustomの場合必須）
```

#### Response
```typescript
CheckActionPageData {
  period: PeriodOption;               // 期間情報
  stats: ProgressStats;               // 進捗統計
  chartData: ChartData;               // チャートデータ
  reflections: Reflection[];          // 振り返り記録一覧
  latestReport: AIAnalysisReportDetailed | null;  // 最新AI分析レポート
  actionPlans: ActionPlanDetailed[];  // アクションプラン一覧
}
```

#### バックエンド内部処理
1. 指定期間のタスク・ログデータを取得
2. 進捗統計を計算（達成率、完了タスク数、ログ日数、アクティブ目標数）
3. 期間内のタスク完了推移をチャートデータに変換
4. 指定期間の振り返り記録を取得
5. 最新のAI分析レポートを取得（存在する場合）
6. アクションプランを取得

---

### 2. 進捗統計データ取得

- **エンドポイント**: `GET /api/check-action/stats`
- **説明**: 指定期間の進捗統計情報を取得
- **認証**: 必須

#### Request
```typescript
Query Parameters:
  period: PeriodType
  startDate?: string
  endDate?: string
```

#### Response
```typescript
ProgressStats {
  achievementRate: number;  // 達成率（%）
  completedTasks: number;   // 完了タスク数
  logDays: number;          // ログ記録日数
  activeGoals: number;      // アクティブ目標数
}
```

---

### 3. チャートデータ取得

- **エンドポイント**: `GET /api/check-action/chart`
- **説明**: 指定期間のタスク完了推移チャートデータを取得
- **認証**: 必須

#### Request
```typescript
Query Parameters:
  period: PeriodType
  startDate?: string
  endDate?: string
```

#### Response
```typescript
ChartData {
  title: string;                    // チャートタイトル
  type: 'line' | 'bar';            // チャート種別
  dataPoints: ChartDataPoint[];    // データポイント配列
  yAxisLabel: string;              // Y軸ラベル
  xAxisLabel: string;              // X軸ラベル
}

ChartDataPoint {
  date: string;       // ISO 8601形式
  value: number;      // 値（タスク完了数等）
  label?: string;     // 表示ラベル（曜日等）
}
```

---

### 4. 振り返り記録一覧取得

- **エンドポイント**: `GET /api/reflections`
- **説明**: 指定期間の振り返り記録一覧を取得
- **認証**: 必須

#### Request
```typescript
Query Parameters:
  period?: PeriodType
  startDate?: string
  endDate?: string
  limit?: number     // デフォルト: 10
```

#### Response
```typescript
Reflection[] {
  id: string;
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  content: string;         // 振り返り内容
  achievements?: string;   // 達成したこと
  challenges?: string;     // 課題・困難だったこと
  createdAt: Date;
}
```

---

### 5. 最新AI分析レポート取得

- **エンドポイント**: `GET /api/analysis/latest`
- **説明**: ユーザーの最新AI分析レポートを取得
- **認証**: 必須

#### Request
```typescript
Query Parameters: なし
```

#### Response
```typescript
AIAnalysisReportDetailed {
  id: string;
  userId: string;
  reflectionId?: string;
  analysisType: 'progress' | 'pattern' | 'recommendation';
  insights: AIInsight[];           // AI洞察配列
  recommendations: AIRecommendation[];  // AI推奨事項配列
  summary: string;                 // 分析サマリー
  confidence: number;              // 信頼度（0-1）
  confidencePercentage: number;    // 信頼度パーセンテージ
  createdAt: Date;
}

AIInsight {
  id: string;
  type: 'pattern' | 'progress' | 'challenge';
  title: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
}

AIRecommendation {
  id: string;
  priority: number;               // 優先度（1が最高）
  title: string;
  description: string;
  actionable: boolean;            // 実行可能か
  category: 'time_optimization' | 'habit_improvement' | 'success_pattern' | 'other';
}
```

---

### 6. アクションプラン一覧取得

- **エンドポイント**: `GET /api/action-plans`
- **説明**: ユーザーのアクションプラン一覧を取得
- **認証**: 必須

#### Request
```typescript
Query Parameters:
  status?: 'planned' | 'in_progress' | 'completed'
  limit?: number     // デフォルト: 10
```

#### Response
```typescript
ActionPlanDetailed[] {
  id: string;
  userId: string;
  reportId?: string;
  title: string;
  description: string;
  actionItems: ActionItem[];
  status: 'planned' | 'in_progress' | 'completed';
  progress: number;              // 進捗率（0-100）
  completedItems: number;        // 完了アイテム数
  totalItems: number;            // 総アイテム数
  createdAt: Date;
  updatedAt: Date;
}

ActionItem {
  id: string;
  order: number;                 // 実行順序
  description: string;
  completed: boolean;
  dueDate?: Date;
}
```

---

### 7. 振り返り記録作成

- **エンドポイント**: `POST /api/reflections`
- **説明**: 新しい振り返り記録を作成
- **認証**: 必須

#### Request
```typescript
ReflectionForm {
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  content: string;         // 必須（1-5000文字）
  achievements?: string;   // 任意
  challenges?: string;     // 任意
}
```

#### Response
```typescript
Reflection {
  id: string;
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  content: string;
  achievements?: string;
  challenges?: string;
  createdAt: Date;
}
```

#### バリデーション
- `content`: 1文字以上、5000文字以下
- `startDate` < `endDate`
- 同一期間の重複登録不可

---

### 8. AI分析リクエスト（複合処理）

- **エンドポイント**: `POST /api/analysis/generate`
- **説明**: 振り返り記録からAI分析レポートを生成
- **認証**: 必須
- **処理タイプ**: @BACKEND_COMPLEX（複合処理-001）

#### Request
```typescript
{
  reflectionId: string;  // 分析対象の振り返りID
}
```

#### Response
```typescript
AIAnalysisReportDetailed {
  id: string;
  userId: string;
  reflectionId: string;
  analysisType: 'progress' | 'pattern' | 'recommendation';
  insights: AIInsight[];
  recommendations: AIRecommendation[];
  summary: string;
  confidence: number;
  confidencePercentage: number;
  createdAt: Date;
}
```

#### バックエンド内部処理（複合処理-001）

**参照**: `docs/requirements.md` 「6. 複合API処理（バックエンド内部処理）」セクション

1. **ユーザーデータ取得**
   - 指定期間のGoal、Task、Log、Reflectionデータを取得
   - 振り返り記録の内容を取得

2. **データ構造化とプロンプト生成**
   - タスク完了率、ログ記録パターンを分析
   - 振り返り内容（content, achievements, challenges）を構造化
   - AI APIに送信するプロンプトを生成

3. **AI API呼び出し**
   - Anthropic Claude API（開発）または OpenAI GPT-4o mini（本番）を使用
   - タイムアウト: 30秒
   - リトライロジック: 最大3回、exponential backoff

4. **AIレスポンス解析・構造化**
   - AI生成テキストから洞察（insights）を抽出
   - 推奨事項（recommendations）を抽出
   - 信頼度スコアを計算

5. **レポート保存**
   - `AIAnalysisReport`レコードをDBに保存
   - フロントエンドにレポートを返却

#### 外部サービス依存
- **Anthropic Claude API** (開発・テスト)
  - Rate Limit: 5リクエスト/分（Free Tier）
  - コスト: $10無料枠
- **OpenAI API** (本番)
  - Rate Limit: 500リクエスト/分（Tier 1）
  - コスト: $0.15/100万トークン（GPT-4o mini）
- **Supabase PostgreSQL** (データベース)

#### タイムアウト・エラーハンドリング
- タイムアウト: 30秒
- リトライ: 最大3回、exponential backoff（2秒 → 4秒 → 8秒）
- エラーレスポンス:
  ```typescript
  {
    error: "AI analysis generation failed",
    detail: {
      reason: "timeout" | "rate_limit" | "api_error",
      retryAfter?: number  // Rate Limit時の待機秒数
    }
  }
  ```

---

### 9. アクションプラン作成

- **エンドポイント**: `POST /api/action-plans`
- **説明**: 新しいアクションプランを作成
- **認証**: 必須

#### Request
```typescript
ActionPlanForm {
  reportId?: string;           // AI分析レポートID（任意）
  title: string;               // 必須（1-200文字）
  description: string;         // 必須（1-2000文字）
  actionItems: string[];       // アクション項目配列（最低1個、最大20個）
}
```

#### Response
```typescript
ActionPlanDetailed {
  id: string;
  userId: string;
  reportId?: string;
  title: string;
  description: string;
  actionItems: ActionItem[];
  status: 'planned';           // 新規作成時は常に'planned'
  progress: 0;
  completedItems: 0;
  totalItems: number;
  createdAt: Date;
  updatedAt: Date;
}
```

#### バリデーション
- `title`: 1文字以上、200文字以下
- `description`: 1文字以上、2000文字以下
- `actionItems`: 最低1個、最大20個

---

## モックサービス参照

実装時はこのモックサービスの挙動を参考にする:

```typescript
lib/services/CheckActionService.ts
```

---

## セキュリティ要件

### 認証・認可
- 全エンドポイントで認証必須（Auth.js セッション検証）
- ユーザーIDはセッションから取得（リクエストボディに含めない）
- 他ユーザーのデータアクセス防止（userId一致チェック）

### XSS対策
- `content`, `achievements`, `challenges`, `description`のサニタイゼーション
- HTMLタグのエスケープ処理

### Rate Limiting
- AI分析生成: 5リクエスト/分/ユーザー（Claude Free Tier制約）
- その他エンドポイント: 60リクエスト/分/ユーザー

---

## パフォーマンス要件

### レスポンスタイム目標
- GET エンドポイント: < 500ms
- POST `/api/reflections`: < 1秒
- POST `/api/action-plans`: < 1秒
- POST `/api/analysis/generate`: 5-30秒（AI処理時間）

### キャッシュ戦略
- `GET /api/check-action`: 5分キャッシュ（期間選択で無効化）
- `GET /api/analysis/latest`: 10分キャッシュ
- `GET /api/action-plans`: 5分キャッシュ

---

## エラーレスポンス形式

```typescript
{
  error: string;              // エラーメッセージ
  detail?: {                  // 詳細情報（任意）
    field?: string;           // バリデーションエラー時のフィールド名
    reason?: string;          // エラー理由
    retryAfter?: number;      // リトライ可能時間（秒）
  }
}
```

### HTTPステータスコード
- `200 OK`: 成功
- `201 Created`: リソース作成成功
- `400 Bad Request`: バリデーションエラー
- `401 Unauthorized`: 認証エラー
- `403 Forbidden`: 権限エラー
- `404 Not Found`: リソースが見つからない
- `429 Too Many Requests`: Rate Limit超過
- `500 Internal Server Error`: サーバーエラー
- `503 Service Unavailable`: AI APIエラー

---

## 次のステップ

### バックエンド実装時
1. FastAPIでエンドポイントを実装
2. Supabase PostgreSQLとの連携
3. Auth.jsセッション検証ミドルウェア追加
4. AI API連携実装（Claude/OpenAI）
5. Rate Limitingミドルウェア追加
6. バリデーションスキーマ定義（Pydantic）

### フロントエンド統合時
1. `CheckActionService.ts`のモックメソッドを実API呼び出しに置き換え
2. 環境変数でAPIベースURL設定
3. エラーハンドリング強化
4. ローディング・リトライロジック追加

---

**API仕様書 完**
