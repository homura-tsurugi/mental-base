# Dashboard API仕様書

**生成日**: 2025-11-01
**収集元**: `lib/services/DashboardService.ts`
**@MOCK_TO_APIマーク数**: 6

---

## エンドポイント一覧

| # | メソッド | エンドポイント | 用途 | Response型 |
|---|----------|--------------|------|-----------|
| 1 | GET | `/api/dashboard` | ダッシュボード統合データ取得 | `DashboardData` |
| 2 | GET | `/api/compass/progress` | COM:PASS進捗サマリー取得 | `CompassProgress` |
| 3 | GET | `/api/tasks/today` | 今日のタスク一覧取得 | `TaskWithGoal[]` |
| 4 | GET | `/api/activities/recent` | 最近のアクティビティ取得 | `Activity[]` |
| 5 | GET | `/api/notifications` | 通知一覧取得 | `Notification[]` |
| 6 | PATCH | `/api/tasks/{taskId}/complete` | タスク完了状態更新 | `Task` |

---

## エンドポイント詳細

### 1. ダッシュボード統合データ取得

**エンドポイント**: `GET /api/dashboard`
**認証**: 必須（ユーザー認証）

#### Request

**Headers:**
```http
Authorization: Bearer {token}
```

**Query Parameters:** なし

#### Response

**Status**: `200 OK`

**Body**:
```typescript
{
  compassSummary: CompassProgress;
  todayTasks: TaskWithGoal[];
  recentActivities: Activity[];
  notifications: Notification[];
}
```

**Example**:
```json
{
  "compassSummary": {
    "planProgress": 75,
    "doProgress": 60,
    "checkProgress": 50,
    "actionProgress": 40
  },
  "todayTasks": [
    {
      "id": "1",
      "userId": "user1",
      "goalId": "goal1",
      "title": "朝のストレッチを10分間行う",
      "priority": "high",
      "status": "pending",
      "scheduledTime": "09:00",
      "goalName": "健康管理",
      "createdAt": "2025-11-01T08:00:00.000Z",
      "updatedAt": "2025-11-01T08:00:00.000Z"
    }
  ],
  "recentActivities": [
    {
      "id": "1",
      "type": "task_completed",
      "description": "<strong>タスク完了:</strong> 読書時間30分を確保",
      "timestamp": "2025-11-01T10:53:00.000Z",
      "icon": "check_circle",
      "iconColor": "var(--success)",
      "backgroundColor": "#e6f9f0"
    }
  ],
  "notifications": [
    {
      "id": "1",
      "userId": "user1",
      "type": "reminder",
      "title": "タスクのリマインダー",
      "message": "「朝のストレッチを10分間行う」の時間です",
      "read": false,
      "createdAt": "2025-11-01T10:55:00.000Z"
    }
  ]
}
```

#### 複合API処理（バックエンド内部処理）

**処理タイプ**: 複合API処理-DAS-001（requirements.md参照）

**処理フロー**:
1. ユーザーの全Goal取得
2. 各Goalの完了タスク数と総タスク数を計算
3. COM:PASS各フェーズの進捗率を計算
4. 今日期限のTaskを抽出（TaskWithGoal型に変換）
5. 最近のActivityを取得（直近10件）
6. 未読Notificationを取得
7. すべてのデータを統合してDashboardDataとして返却

**外部サービス依存**: Supabase（データベース）

**処理時間**: 500ms～1000ms（想定）

#### Error Responses

**401 Unauthorized**:
```json
{
  "error": "認証が必要です",
  "detail": {
    "code": "UNAUTHORIZED"
  }
}
```

**500 Internal Server Error**:
```json
{
  "error": "データ取得に失敗しました",
  "detail": {
    "code": "DATABASE_ERROR"
  }
}
```

---

### 2. COM:PASS進捗サマリー取得

**エンドポイント**: `GET /api/compass/progress`
**認証**: 必須（ユーザー認証）

#### Request

**Headers:**
```http
Authorization: Bearer {token}
```

**Query Parameters:** なし

#### Response

**Status**: `200 OK`

**Body**:
```typescript
{
  planProgress: number;  // 0-100
  doProgress: number;    // 0-100
  checkProgress: number; // 0-100
  actionProgress: number; // 0-100
}
```

**Example**:
```json
{
  "planProgress": 75,
  "doProgress": 60,
  "checkProgress": 50,
  "actionProgress": 40
}
```

#### 説明

各フェーズの進捗率を0～100のパーセンテージで返します。

- **planProgress**: PLAN（計画）フェーズの進捗率
- **doProgress**: DO（実行）フェーズの進捗率
- **checkProgress**: Check（振り返り）フェーズの進捗率
- **actionProgress**: Action（改善）フェーズの進捗率

進捗率の計算方法：
```
進捗率 = (完了タスク数 / 総タスク数) × 100
```

---

### 3. 今日のタスク一覧取得

**エンドポイント**: `GET /api/tasks/today`
**認証**: 必須（ユーザー認証）

#### Request

**Headers:**
```http
Authorization: Bearer {token}
```

**Query Parameters:** なし

#### Response

**Status**: `200 OK`

**Body**: `TaskWithGoal[]`

```typescript
[
  {
    id: string;
    userId: string;
    goalId?: string;
    title: string;
    description?: string;
    dueDate?: Date;
    priority: 'high' | 'medium' | 'low';
    status: 'pending' | 'in_progress' | 'completed';
    completedAt?: Date;
    scheduledTime?: string; // HH:mm形式
    goalName?: string;      // Goalのtitleから取得
    createdAt: Date;
    updatedAt: Date;
  }
]
```

**Example**:
```json
[
  {
    "id": "1",
    "userId": "user1",
    "goalId": "goal1",
    "title": "朝のストレッチを10分間行う",
    "priority": "high",
    "status": "pending",
    "scheduledTime": "09:00",
    "goalName": "健康管理",
    "createdAt": "2025-11-01T08:00:00.000Z",
    "updatedAt": "2025-11-01T08:00:00.000Z"
  },
  {
    "id": "2",
    "userId": "user1",
    "goalId": "goal2",
    "title": "週報の作成と送付",
    "priority": "high",
    "status": "pending",
    "scheduledTime": "17:00",
    "goalName": "仕事の効率化",
    "createdAt": "2025-11-01T08:00:00.000Z",
    "updatedAt": "2025-11-01T08:00:00.000Z"
  }
]
```

#### 説明

今日が期限（dueDate）のタスク、または今日にスケジュールされた（scheduledTime）タスクを返します。各タスクには関連する目標名（goalName）が解決済みで含まれます。

**フィルタリング条件**:
- `dueDate` が今日の日付
- または `scheduledTime` が設定されている
- `status` が `completed` 以外

---

### 4. 最近のアクティビティ取得

**エンドポイント**: `GET /api/activities/recent`
**認証**: 必須（ユーザー認証）

#### Request

**Headers:**
```http
Authorization: Bearer {token}
```

**Query Parameters**:
- `limit` (optional): 取得件数（デフォルト: 10）

**Example**:
```http
GET /api/activities/recent?limit=10
```

#### Response

**Status**: `200 OK`

**Body**: `Activity[]`

```typescript
[
  {
    id: string;
    type: 'goal_created' | 'task_completed' | 'task_created' | 'log_recorded' | 'reflection_created' | 'improvement_suggested';
    description: string; // HTML形式
    timestamp: Date;
    icon?: 'check_circle' | 'assignment' | 'edit' | 'lightbulb' | 'flag' | 'insights';
    iconColor?: string;
    backgroundColor?: string;
  }
]
```

**Example**:
```json
[
  {
    "id": "1",
    "type": "task_completed",
    "description": "<strong>タスク完了:</strong> 読書時間30分を確保",
    "timestamp": "2025-11-01T10:53:00.000Z",
    "icon": "check_circle",
    "iconColor": "var(--success)",
    "backgroundColor": "#e6f9f0"
  },
  {
    "id": "2",
    "type": "log_recorded",
    "description": "<strong>ログ記録:</strong> 集中力が高い状態を記録",
    "timestamp": "2025-11-01T09:55:00.000Z",
    "icon": "edit",
    "iconColor": "var(--warning)",
    "backgroundColor": "#fff5e6"
  }
]
```

#### 説明

ユーザーの最近のアクティビティを新しい順に返します。アクティビティには、タスク完了、ログ記録、目標作成などが含まれます。

**ソート順**: `timestamp` 降順（最新が先頭）

**アクティビティタイプ別のアイコンと色**:
- `task_completed`: check_circle, 緑色
- `log_recorded`: edit, オレンジ色
- `task_created`: assignment, 青色
- `improvement_suggested`: lightbulb, 紫色
- `goal_created`: flag, 青色
- `reflection_created`: insights, オレンジ色

---

### 5. 通知一覧取得

**エンドポイント**: `GET /api/notifications`
**認証**: 必須（ユーザー認証）

#### Request

**Headers:**
```http
Authorization: Bearer {token}
```

**Query Parameters**:
- `unreadOnly` (optional): 未読のみ取得（デフォルト: true）

**Example**:
```http
GET /api/notifications?unreadOnly=true
```

#### Response

**Status**: `200 OK`

**Body**: `Notification[]`

```typescript
[
  {
    id: string;
    userId: string;
    type: 'reminder' | 'achievement' | 'suggestion';
    title: string;
    message: string;
    read: boolean;
    createdAt: Date;
  }
]
```

**Example**:
```json
[
  {
    "id": "1",
    "userId": "user1",
    "type": "reminder",
    "title": "タスクのリマインダー",
    "message": "「朝のストレッチを10分間行う」の時間です",
    "read": false,
    "createdAt": "2025-11-01T10:55:00.000Z"
  }
]
```

#### 説明

ユーザーの通知一覧を返します。デフォルトでは未読のみを返します。

**通知タイプ**:
- `reminder`: タスクのリマインダー
- `achievement`: 達成通知（目標完了、連続記録など）
- `suggestion`: AIからの提案

---

### 6. タスク完了状態更新

**エンドポイント**: `PATCH /api/tasks/{taskId}/complete`
**認証**: 必須（ユーザー認証）

#### Request

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Path Parameters**:
- `taskId`: タスクID（string）

**Body**:
```typescript
{
  completed: boolean;
}
```

**Example**:
```http
PATCH /api/tasks/1/complete
Content-Type: application/json

{
  "completed": true
}
```

#### Response

**Status**: `200 OK`

**Body**: `Task`

```typescript
{
  id: string;
  userId: string;
  goalId?: string;
  title: string;
  description?: string;
  dueDate?: Date;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**Example**:
```json
{
  "id": "1",
  "userId": "user1",
  "goalId": "goal1",
  "title": "朝のストレッチを10分間行う",
  "priority": "high",
  "status": "completed",
  "completedAt": "2025-11-01T10:55:00.000Z",
  "createdAt": "2025-11-01T08:00:00.000Z",
  "updatedAt": "2025-11-01T10:55:00.000Z"
}
```

#### 説明

タスクの完了状態を更新します。`completed: true`を送信すると、タスクのstatusが`completed`に更新され、`completedAt`に現在日時が設定されます。`completed: false`を送信すると、タスクのstatusが`pending`に戻り、`completedAt`がnullになります。

**副作用**:
- 完了時: アクティビティに「タスク完了」を追加
- COM:PASS進捗率が自動的に再計算される

#### Error Responses

**404 Not Found**:
```json
{
  "error": "タスクが見つかりません",
  "detail": {
    "code": "TASK_NOT_FOUND",
    "taskId": "1"
  }
}
```

**403 Forbidden**:
```json
{
  "error": "このタスクを更新する権限がありません",
  "detail": {
    "code": "FORBIDDEN"
  }
}
```

---

## 型定義参照

すべての型定義は `/types/index.ts` に記載されています。

### 主要な型

```typescript
// ダッシュボードデータ
export interface DashboardData {
  compassSummary: CompassProgress;
  todayTasks: TaskWithGoal[];
  recentActivities: Activity[];
  notifications: Notification[];
}

// COM:PASS進捗
export interface CompassProgress {
  planProgress: number; // 0-100
  doProgress: number; // 0-100
  checkProgress: number; // 0-100
  actionProgress: number; // 0-100
}

// タスク（目標名付き）
export interface TaskWithGoal extends Task {
  goalName?: string;
}

// アクティビティ
export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: Date;
  icon?: ActivityIcon;
  iconColor?: string;
  backgroundColor?: string;
}

// 通知
export interface Notification {
  id: string;
  userId: string;
  type: 'reminder' | 'achievement' | 'suggestion';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}
```

---

## モックサービス参照

実装時はこのモックサービスの挙動を参考にしてください：

```typescript
// モックサービスのパス
lib/services/DashboardService.ts
```

**主要メソッド**:
- `getDashboardData()`: ダッシュボード統合データ取得
- `getMockCompassProgress()`: COM:PASS進捗取得
- `getMockTodayTasks()`: 今日のタスク一覧取得
- `getMockRecentActivities()`: 最近のアクティビティ取得
- `getMockNotifications()`: 通知一覧取得
- `toggleTaskComplete()`: タスク完了状態更新

---

## API実装時の注意事項

### セキュリティ

1. **認証・認可**
   - すべてのエンドポイントで認証必須
   - ユーザーは自分のデータのみアクセス可能
   - Auth.js (NextAuth v5)のJWTトークンで認証

2. **入力検証**
   - taskIdのUUID形式検証
   - completedのboolean型検証
   - limitの数値範囲検証（1～100）

3. **XSS対策**
   - アクティビティの`description`はHTMLを含むため、バックエンドでサニタイズ
   - フロントエンドではDOMPurifyで二重にサニタイズ推奨

4. **CSRF対策**
   - Auth.jsのCSRFトークン機能を活用
   - すべてのPATCH/POST/DELETE操作で検証

### パフォーマンス

1. **データベースクエリ最適化**
   - `getDashboardData()`は複数テーブルを結合するため、適切なインデックスが必要
   - N+1問題を避けるため、JOIN使用を推奨

2. **キャッシュ戦略**
   - COM:PASS進捗はRedisで5分間キャッシュ推奨
   - 通知一覧はリアルタイム性が必要なのでキャッシュ不要

3. **ページネーション**
   - アクティビティは`limit`パラメータでページネーション対応
   - デフォルト10件、最大100件

### エラーハンドリング

1. **標準エラーレスポンス形式**
```typescript
{
  error: string;       // ユーザー向けメッセージ
  detail?: {           // 開発者向け詳細情報
    code: string;
    [key: string]: any;
  };
}
```

2. **HTTPステータスコード**
   - 200: 成功
   - 400: バリデーションエラー
   - 401: 認証エラー
   - 403: 権限エラー
   - 404: リソースが見つからない
   - 500: サーバーエラー

---

## 次のステップ

1. **バックエンド実装**（FastAPI + SQLAlchemy）
   - Pydanticモデル定義
   - APIルーター実装
   - データベーステーブル作成

2. **API統合**
   - モックサービスから実APIへ切り替え
   - エラーハンドリング実装
   - ローディング状態改善

3. **E2Eテスト実施**
   - `docs/e2e-specs/dashboard-e2e.md`のテスト項目実行
   - 正常系・異常系の網羅的テスト

---

**以上でDashboard API仕様書は完了です。**
