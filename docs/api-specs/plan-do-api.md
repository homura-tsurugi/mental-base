# 目標・実行ページAPI仕様書

**生成日**: 2025-11-01
**収集元**: `lib/services/PlanDoService.ts`
**@MOCK_TO_APIマーク数**: 10
**@BACKEND_COMPLEXマーク数**: 0

---

## エンドポイント一覧

### 1. ページ初期データ取得

- **エンドポイント**: `GET /api/plan-do`
- **説明**: Plan/Doページの初期表示に必要な全データを一度に取得
- **認証**: 必須
- **Request**: なし（Query Parameterで`activeTab`を受け取ることも可能）
- **Response**: `PlanDoPageData`

```typescript
// Response型
interface PlanDoPageData {
  activeTab: 'plan' | 'do';
  goals: GoalWithProgress[];
  todayTasks: TaskWithGoal[];
  emotionOptions: EmotionOption[];
}

interface GoalWithProgress extends Goal {
  completedTasks: number;
  totalTasks: number;
  progressPercentage: number;
}

interface TaskWithGoal extends Task {
  goalName?: string;
}

interface EmotionOption {
  value: Emotion;
  emoji: string;
  label: string;
}
```

**レスポンス例**:
```json
{
  "activeTab": "plan",
  "goals": [
    {
      "id": "1",
      "userId": "user123",
      "title": "英語力を向上させる",
      "description": "TOEICスコア800点を目指し、毎日英語学習を継続する",
      "deadline": "2025-12-31T00:00:00.000Z",
      "status": "active",
      "completedTasks": 7,
      "totalTasks": 20,
      "progressPercentage": 35,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "todayTasks": [
    {
      "id": "t1",
      "userId": "user123",
      "goalId": "1",
      "title": "英単語30個を暗記",
      "priority": "high",
      "status": "pending",
      "goalName": "英語力を向上させる",
      "dueDate": "2025-11-01T00:00:00.000Z",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "emotionOptions": [
    { "value": "happy", "emoji": "😊", "label": "嬉しい" },
    { "value": "neutral", "emoji": "😐", "label": "普通" },
    { "value": "sad", "emoji": "😢", "label": "悲しい" },
    { "value": "anxious", "emoji": "😰", "label": "不安" }
  ]
}
```

**エラー**:
- `401 Unauthorized`: 認証エラー
- `500 Internal Server Error`: サーバーエラー

---

### 2. 目標一覧取得

- **エンドポイント**: `GET /api/goals`
- **説明**: ユーザーの目標一覧を進捗率付きで取得
- **認証**: 必須
- **Request**: なし
- **Response**: `GoalWithProgress[]`

```typescript
// Response型
interface GoalWithProgress extends Goal {
  completedTasks: number;
  totalTasks: number;
  progressPercentage: number;
}
```

**レスポンス例**:
```json
[
  {
    "id": "1",
    "userId": "user123",
    "title": "英語力を向上させる",
    "description": "TOEICスコア800点を目指す",
    "deadline": "2025-12-31T00:00:00.000Z",
    "status": "active",
    "completedTasks": 7,
    "totalTasks": 20,
    "progressPercentage": 35,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

**エラー**:
- `401 Unauthorized`: 認証エラー
- `500 Internal Server Error`: サーバーエラー

---

### 3. 目標作成

- **エンドポイント**: `POST /api/goals`
- **説明**: 新しい目標を作成
- **認証**: 必須
- **Request**: `GoalForm`
- **Response**: `Goal`

```typescript
// Request型
interface GoalForm {
  title: string;          // 必須、1-200文字
  description?: string;   // 任意
  deadline?: Date;        // 任意
}

// Response型
interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  deadline?: Date;
  status: GoalStatus;     // 'active' | 'completed' | 'archived'
  createdAt: Date;
  updatedAt: Date;
}
```

**リクエスト例**:
```json
{
  "title": "英語力を向上させる",
  "description": "TOEICスコア800点を目指し、毎日英語学習を継続する",
  "deadline": "2025-12-31T00:00:00.000Z"
}
```

**レスポンス例**:
```json
{
  "id": "1",
  "userId": "user123",
  "title": "英語力を向上させる",
  "description": "TOEICスコア800点を目指し、毎日英語学習を継続する",
  "deadline": "2025-12-31T00:00:00.000Z",
  "status": "active",
  "createdAt": "2025-11-01T10:00:00.000Z",
  "updatedAt": "2025-11-01T10:00:00.000Z"
}
```

**バリデーション**:
- `title`: 必須、1-200文字
- `description`: 任意、最大5000文字
- `deadline`: 任意、過去日は許容

**エラー**:
- `400 Bad Request`: バリデーションエラー
- `401 Unauthorized`: 認証エラー
- `500 Internal Server Error`: サーバーエラー

---

### 4. 目標更新

- **エンドポイント**: `PUT /api/goals/{id}`
- **説明**: 既存の目標を更新
- **認証**: 必須
- **Request**: `Partial<GoalForm>`
- **Response**: `Goal`

```typescript
// Request型（部分更新可能）
interface GoalForm {
  title?: string;
  description?: string;
  deadline?: Date;
}
```

**リクエスト例**:
```json
{
  "title": "英語力を大幅に向上させる",
  "deadline": "2026-03-31T00:00:00.000Z"
}
```

**レスポンス例**:
```json
{
  "id": "1",
  "userId": "user123",
  "title": "英語力を大幅に向上させる",
  "description": "TOEICスコア800点を目指し、毎日英語学習を継続する",
  "deadline": "2026-03-31T00:00:00.000Z",
  "status": "active",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-11-01T11:00:00.000Z"
}
```

**バリデーション**:
- `title`: 1-200文字（指定時）
- `description`: 最大5000文字（指定時）

**エラー**:
- `400 Bad Request`: バリデーションエラー
- `401 Unauthorized`: 認証エラー
- `403 Forbidden`: 他ユーザーの目標へのアクセス
- `404 Not Found`: 目標が存在しない
- `500 Internal Server Error`: サーバーエラー

---

### 5. 目標削除

- **エンドポイント**: `DELETE /api/goals/{id}`
- **説明**: 目標を削除（関連タスクもカスケード削除）
- **認証**: 必須
- **Request**: なし
- **Response**: `void`

**レスポンス**: `204 No Content`

**注意**:
- 目標を削除すると、関連するタスクもすべて削除されます
- この操作は取り消せません

**エラー**:
- `401 Unauthorized`: 認証エラー
- `403 Forbidden`: 他ユーザーの目標へのアクセス
- `404 Not Found`: 目標が存在しない
- `500 Internal Server Error`: サーバーエラー

---

### 6. 今日のタスク取得

- **エンドポイント**: `GET /api/tasks/today`
- **説明**: 今日期限のタスク一覧を目標名付きで取得
- **認証**: 必須
- **Request**: なし
- **Response**: `TaskWithGoal[]`

```typescript
// Response型
interface TaskWithGoal extends Task {
  goalName?: string;
}

interface Task {
  id: string;
  userId: string;
  goalId?: string;
  title: string;
  description?: string;
  dueDate?: Date;
  scheduledTime?: string;
  priority: TaskPriority;    // 'high' | 'medium' | 'low'
  status: TaskStatus;        // 'pending' | 'in_progress' | 'completed'
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**レスポンス例**:
```json
[
  {
    "id": "t1",
    "userId": "user123",
    "goalId": "1",
    "title": "英単語30個を暗記",
    "priority": "high",
    "status": "pending",
    "goalName": "英語力を向上させる",
    "dueDate": "2025-11-01T00:00:00.000Z",
    "scheduledTime": "09:00",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

**フィルタリングロジック**:
- `dueDate`が今日の日付と一致するタスクを抽出
- `goalId`がある場合は目標名を結合して返却

**エラー**:
- `401 Unauthorized`: 認証エラー
- `500 Internal Server Error`: サーバーエラー

---

### 7. タスク作成

- **エンドポイント**: `POST /api/tasks`
- **説明**: 新しいタスクを作成
- **認証**: 必須
- **Request**: `TaskForm`
- **Response**: `Task`

```typescript
// Request型
interface TaskForm {
  title: string;          // 必須、1-200文字
  description?: string;   // 任意
  goalId?: string;        // 任意、関連する目標ID
  dueDate?: Date;         // 任意
  scheduledTime?: string; // 任意、"HH:mm"形式
  priority: TaskPriority; // 'high' | 'medium' | 'low'
}
```

**リクエスト例**:
```json
{
  "title": "英単語30個を暗記",
  "goalId": "1",
  "dueDate": "2025-11-01T00:00:00.000Z",
  "scheduledTime": "09:00",
  "priority": "high"
}
```

**レスポンス例**:
```json
{
  "id": "t1",
  "userId": "user123",
  "goalId": "1",
  "title": "英単語30個を暗記",
  "dueDate": "2025-11-01T00:00:00.000Z",
  "scheduledTime": "09:00",
  "priority": "high",
  "status": "pending",
  "createdAt": "2025-11-01T10:00:00.000Z",
  "updatedAt": "2025-11-01T10:00:00.000Z"
}
```

**バリデーション**:
- `title`: 必須、1-200文字
- `description`: 任意、最大5000文字
- `goalId`: 存在する目標IDであること（指定時）
- `scheduledTime`: "HH:mm"形式（指定時）
- `priority`: 'high' | 'medium' | 'low'

**エラー**:
- `400 Bad Request`: バリデーションエラー
- `401 Unauthorized`: 認証エラー
- `404 Not Found`: 指定された目標が存在しない
- `500 Internal Server Error`: サーバーエラー

---

### 8. タスク完了切り替え

- **エンドポイント**: `PATCH /api/tasks/{id}/toggle`
- **説明**: タスクの完了状態を切り替え（completed ⇔ pending）
- **認証**: 必須
- **Request**: なし
- **Response**: `Task`

**レスポンス例**:
```json
{
  "id": "t1",
  "userId": "user123",
  "goalId": "1",
  "title": "英単語30個を暗記",
  "dueDate": "2025-11-01T00:00:00.000Z",
  "priority": "high",
  "status": "completed",
  "completedAt": "2025-11-01T11:00:00.000Z",
  "createdAt": "2025-11-01T10:00:00.000Z",
  "updatedAt": "2025-11-01T11:00:00.000Z"
}
```

**動作**:
- `status`が`completed`の場合 → `pending`に変更、`completedAt`を`undefined`に
- `status`が`pending`または`in_progress`の場合 → `completed`に変更、`completedAt`を現在日時に

**エラー**:
- `401 Unauthorized`: 認証エラー
- `403 Forbidden`: 他ユーザーのタスクへのアクセス
- `404 Not Found`: タスクが存在しない
- `500 Internal Server Error`: サーバーエラー

---

### 9. タスク削除

- **エンドポイント**: `DELETE /api/tasks/{id}`
- **説明**: タスクを削除
- **認証**: 必須
- **Request**: なし
- **Response**: `void`

**レスポンス**: `204 No Content`

**エラー**:
- `401 Unauthorized`: 認証エラー
- `403 Forbidden`: 他ユーザーのタスクへのアクセス
- `404 Not Found`: タスクが存在しない
- `500 Internal Server Error`: サーバーエラー

---

### 10. ログ記録

- **エンドポイント**: `POST /api/logs`
- **説明**: 日々のログを記録
- **認証**: 必須
- **Request**: `LogForm`
- **Response**: `Log`

```typescript
// Request型
interface LogForm {
  content: string;        // 必須、1-5000文字
  emotion?: Emotion;      // 任意、'happy' | 'neutral' | 'sad' | 'anxious'等
  state?: State;          // 任意、'energetic' | 'tired' | 'focused'等
  type?: LogType;         // 任意、'daily' | 'reflection' | 'insight'
  taskId?: string;        // 任意、関連するタスクID
}

// Response型
interface Log {
  id: string;
  userId: string;
  taskId?: string;
  content: string;
  emotion?: Emotion;
  state?: State;
  type: LogType;
  createdAt: Date;
}
```

**リクエスト例**:
```json
{
  "content": "今日は集中して英単語学習ができた。30個すべて暗記できて達成感がある。",
  "emotion": "happy",
  "state": "focused",
  "type": "daily",
  "taskId": "t1"
}
```

**レスポンス例**:
```json
{
  "id": "l1",
  "userId": "user123",
  "taskId": "t1",
  "content": "今日は集中して英単語学習ができた。30個すべて暗記できて達成感がある。",
  "emotion": "happy",
  "state": "focused",
  "type": "daily",
  "createdAt": "2025-11-01T11:30:00.000Z"
}
```

**バリデーション**:
- `content`: 必須、1-5000文字
- `emotion`: 'happy' | 'neutral' | 'sad' | 'anxious' | 'excited' | 'tired'（指定時）
- `state`: 'energetic' | 'tired' | 'focused' | 'distracted' | 'calm' | 'stressed'（指定時）
- `type`: 'daily' | 'reflection' | 'insight'、デフォルトは'daily'
- `taskId`: 存在するタスクIDであること（指定時）

**エラー**:
- `400 Bad Request`: バリデーションエラー
- `401 Unauthorized`: 認証エラー
- `404 Not Found`: 指定されたタスクが存在しない
- `500 Internal Server Error`: サーバーエラー

---

## モックサービス参照

実装時はこのモックサービスの挙動を参考にしてください：

```
lib/services/PlanDoService.ts
```

---

## データベーススキーマ（参考）

### goals テーブル
```sql
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  deadline TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_status ON goals(status);
```

### tasks テーブル
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  due_date DATE,
  scheduled_time TIME,
  priority VARCHAR(10) NOT NULL DEFAULT 'medium',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_goal_id ON tasks(goal_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);
```

### logs テーブル
```sql
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  emotion VARCHAR(20),
  state VARCHAR(20),
  type VARCHAR(20) NOT NULL DEFAULT 'daily',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_logs_task_id ON logs(task_id);
CREATE INDEX idx_logs_created_at ON logs(created_at);
```

---

## 実装ガイド

### FastAPI実装例

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from . import schemas, crud
from .dependencies import get_db, get_current_user

router = APIRouter(prefix="/api")

@router.get("/plan-do", response_model=schemas.PlanDoPageData)
async def get_plan_do_page_data(
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    goals = crud.get_goals_with_progress(db, user_id=current_user.id)
    today_tasks = crud.get_today_tasks_with_goal(db, user_id=current_user.id)
    emotion_options = schemas.get_emotion_options()

    return {
        "activeTab": "plan",
        "goals": goals,
        "todayTasks": today_tasks,
        "emotionOptions": emotion_options
    }

@router.post("/goals", response_model=schemas.Goal)
async def create_goal(
    goal_form: schemas.GoalForm,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    return crud.create_goal(db, goal_form, user_id=current_user.id)

# 他のエンドポイントも同様に実装...
```

---

**API仕様書 完**

バックエンド実装時はこの仕様書を参照してください。
