# クライアント詳細API仕様書（M-002）

**生成日**: 2025-11-02
**ページ**: M-002 クライアント詳細
**収集元**: services/mock/ClientDetailService.ts, components/mentor/
**@MOCK_TO_APIマーク数**: 26箇所

---

## 📋 概要

このドキュメントは、M-002: クライアント詳細ページで使用されるすべてのAPIエンドポイントの仕様を定義します。各エンドポイントは`@MOCK_TO_API`マークで識別され、モックサービスの実装を基に作成されています。

---

## 🔐 認証・認可

すべてのエンドポイントは以下の要件を満たす必要があります：

- **認証**: Auth.js v5セッション必須
- **認可**: MENTORロール必須（`verifyMentor()`）
- **データアクセス制御**: クライアントの許可に基づくデータ閲覧

---

## 📡 エンドポイント一覧

### 1. クライアント詳細情報取得

#### エンドポイント
```
GET /api/mentor/client/{clientId}
```

#### リクエスト
- **パスパラメータ**:
  - `clientId` (string, required): クライアントID

#### レスポンス
```typescript
{
  clientInfo: ClientInfo;
  permissions: ClientDataAccessPermission;
  progressData: {
    overallProgress: number;
    goals: GoalWithProgress[];
    tasks: TaskWithGoal[];
    logs: Log[];
    reflections: Reflection[];
    aiReports: AIAnalysisReportDetailed[];
  };
  mentorNotes: MentorNote[];
}
```

#### 処理フロー
1. メンター-クライアント関係を確認
2. データアクセス権限を取得
3. 許可されているデータのみ取得
4. 閲覧ログを記録（ClientDataViewLog）

#### エラー
- `401 Unauthorized`: 認証エラー
- `403 Forbidden`: メンター権限なし、または関係が存在しない
- `404 Not Found`: クライアントが存在しない

---

### 2. クライアント基本情報取得

#### エンドポイント
```
GET /api/mentor/client/{clientId}/info
```

#### リクエスト
- **パスパラメータ**:
  - `clientId` (string, required): クライアントID

#### レスポンス
```typescript
{
  id: string;
  name: string;
  email: string;
  initials: string;
  registeredAt: Date;
  relationshipStartDate: Date;
  overallProgress: number;
  status: 'on_track' | 'stagnant' | 'needs_followup';
}
```

---

### 3. データアクセス権限取得

#### エンドポイント
```
GET /api/mentor/client/{clientId}/permissions
```

#### リクエスト
- **パスパラメータ**:
  - `clientId` (string, required): クライアントID

#### レスポンス
```typescript
{
  id: string;
  relationshipId: string;
  clientId: string;
  allowGoals: boolean;
  allowTasks: boolean;
  allowLogs: boolean;
  allowReflections: boolean;
  allowAiReports: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 4. クライアント目標一覧取得

#### エンドポイント
```
GET /api/mentor/client/{clientId}/goals
```

#### リクエスト
- **パスパラメータ**:
  - `clientId` (string, required): クライアントID

#### レスポンス
```typescript
GoalWithProgress[]
```

#### 必須権限
- `allowGoals: true`

#### エラー
- `403 Forbidden`: 目標閲覧権限がない

---

### 5. クライアントタスク一覧取得

#### エンドポイント
```
GET /api/mentor/client/{clientId}/tasks
```

#### リクエスト
- **パスパラメータ**:
  - `clientId` (string, required): クライアントID

#### レスポンス
```typescript
TaskWithGoal[]
```

#### 必須権限
- `allowTasks: true`

#### エラー
- `403 Forbidden`: タスク閲覧権限がない

---

### 6. クライアントログ履歴取得

#### エンドポイント
```
GET /api/mentor/client/{clientId}/logs
```

#### リクエスト
- **パスパラメータ**:
  - `clientId` (string, required): クライアントID
- **クエリパラメータ**:
  - `limit` (number, optional): 取得件数（デフォルト: 50）
  - `offset` (number, optional): オフセット（デフォルト: 0）

#### レスポンス
```typescript
Log[]
```

#### 必須権限
- `allowLogs: true`

#### エラー
- `403 Forbidden`: ログ閲覧権限がない

---

### 7. クライアント振り返り一覧取得

#### エンドポイント
```
GET /api/mentor/client/{clientId}/reflections
```

#### リクエスト
- **パスパラメータ**:
  - `clientId` (string, required): クライアントID

#### レスポンス
```typescript
Reflection[]
```

#### 必須権限
- `allowReflections: true`

#### エラー
- `403 Forbidden`: 振り返り閲覧権限がない

---

### 8. クライアントAI分析レポート一覧取得

#### エンドポイント
```
GET /api/mentor/client/{clientId}/ai-reports
```

#### リクエスト
- **パスパラメータ**:
  - `clientId` (string, required): クライアントID

#### レスポンス
```typescript
AIAnalysisReportDetailed[]
```

#### 必須権限
- `allowAiReports: true`

#### エラー
- `403 Forbidden`: AI分析レポート閲覧権限がない

---

### 9. メンターノート一覧取得

#### エンドポイント
```
GET /api/mentor/notes?clientId={clientId}
```

#### リクエスト
- **クエリパラメータ**:
  - `clientId` (string, required): クライアントID

#### レスポンス
```typescript
MentorNote[]
```

#### 説明
メンター自身が作成したノートのみ取得

---

### 10. メンターノート作成

#### エンドポイント
```
POST /api/mentor/notes
```

#### リクエスト
```typescript
{
  clientId: string;
  title: string;
  content: string;
  noteType: 'general' | 'observation' | 'concern' | 'achievement';
  tags: string[];
  isSharedWithClient: boolean;
  linkedGoalId?: string;
  linkedTaskId?: string;
  linkedLogId?: string;
}
```

#### レスポンス
```typescript
MentorNote
```

#### エラー
- `400 Bad Request`: 必須フィールド不足
- `403 Forbidden`: クライアント関係が存在しない

---

### 11. メンターノート更新

#### エンドポイント
```
PUT /api/mentor/notes/{noteId}
```

#### リクエスト
- **パスパラメータ**:
  - `noteId` (string, required): ノートID
- **ボディ**:
```typescript
{
  title?: string;
  content?: string;
  noteType?: 'general' | 'observation' | 'concern' | 'achievement';
  tags?: string[];
  isSharedWithClient?: boolean;
}
```

#### レスポンス
```typescript
MentorNote
```

#### エラー
- `403 Forbidden`: ノートの所有者ではない
- `404 Not Found`: ノートが存在しない

---

### 12. メンターノート削除

#### エンドポイント
```
DELETE /api/mentor/notes/{noteId}
```

#### リクエスト
- **パスパラメータ**:
  - `noteId` (string, required): ノートID

#### レスポンス
```
204 No Content
```

#### エラー
- `403 Forbidden`: ノートの所有者ではない
- `404 Not Found`: ノートが存在しない

---

### 13. 進捗レポート生成

#### エンドポイント
```
POST /api/mentor/reports/generate
```

#### リクエスト
```typescript
{
  clientId: string;
  period: 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  rating: number; // 1-5
  areasForImprovement: string;
  strengths: string;
  nextSteps: string;
  followUpDate?: Date;
  isSharedWithClient: boolean;
}
```

#### レスポンス
```typescript
ClientProgressReport
```

#### 処理フロー
1. 指定期間のクライアントデータを集計
2. 統計を計算（完了目標数、完了タスク数、ログ記録数等）
3. メンター評価とコメントを保存
4. `isSharedWithClient: true`の場合、クライアントに通知

---

## 🔄 複合API処理

### 複合処理-007: クライアント詳細データ取得

**トリガー**: M-002ページ初期表示

**内部処理フロー**:
1. メンター-クライアント関係を確認（MentorClientRelationship）
2. データアクセス権限を取得（ClientDataAccessPermission）
3. 並列データ取得（Promise.all）:
   - クライアント基本情報
   - 許可されたデータ（目標/タスク/ログ/振り返り/AI分析）
   - メンターノート
4. 閲覧ログを記録（ClientDataViewLog）
5. 統合データを返却

**外部サービス依存**: Supabase

---

### 複合処理-008: 進捗レポート生成

**トリガー**: 「進捗レポート生成」ボタンクリック

**内部処理フロー**:
1. メンター-クライアント関係を確認
2. 指定期間のデータ集計:
   - 完了した目標数
   - 完了したタスク数
   - ログ記録数
   - 振り返り記録数
3. 総合進捗率を計算
4. メンター評価（rating, areasForImprovement, strengths, nextSteps）を保存
5. ClientProgressReportレコードをDBに保存
6. `isSharedWithClient: true`の場合、クライアントに通知メール送信
7. レポートを返却

**外部サービス依存**: Supabase, Resend（メール送信）

---

## 📊 データモデル参照

すべての型定義は `types/index.ts` を参照してください：

- `ClientDetailData`
- `ClientInfo`
- `ClientDataAccessPermission`
- `GoalWithProgress`
- `TaskWithGoal`
- `Log`
- `Reflection`
- `AIAnalysisReportDetailed`
- `MentorNote`
- `MentorNoteForm`
- `ClientProgressReport`
- `ClientProgressReportForm`

---

## 🔒 セキュリティ要件

1. **認証**: すべてのエンドポイントで`verifyMentor()`を実行
2. **認可**: メンター-クライアント関係の存在を確認
3. **データアクセス制御**: 権限がないデータは返却しない
4. **監査ログ**: すべてのデータ閲覧を`ClientDataViewLog`に記録
5. **GDPR対応**: クライアントはいつでもアクセス権を取り消し可能

---

## 🧪 モックサービス参照

実装時は以下のモックサービスの挙動を参考にしてください：

```
services/mock/ClientDetailService.ts
```

---

**このAPI仕様書は、バックエンド実装時に参照し、@MOCK_TO_APIマークと置き換えてください。**
