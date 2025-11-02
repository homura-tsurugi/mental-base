# Slice 2-B: 目標・タスク管理 実装完了サマリー

**実装日**: 2025-11-02
**実装者**: @バックエンド実装エージェント
**ステータス**: ✅ 100%完了
**テストカバレッジ**: 40テストケース（すべて統合テスト）

---

## 1. 実装概要

Slice 2-B（目標・タスク管理）のバックエンドAPIを完全実装しました。Plan-Doページで必要なすべてのエンドポイントが動作可能な状態です。

### 実装したエンドポイント（10エンドポイント）

#### 目標管理 (Goals)
1. **GET /api/goals** - 目標一覧取得（進捗率計算付き）
2. **POST /api/goals** - 目標作成
3. **PUT /api/goals/{id}** - 目標更新
4. **DELETE /api/goals/{id}** - 目標削除（カスケード削除）

#### タスク管理 (Tasks)
5. **GET /api/tasks/today** - 今日のタスク取得（Goal名結合）
6. **POST /api/tasks** - タスク作成
7. **PATCH /api/tasks/{id}/toggle** - タスク完了状態切り替え
8. **DELETE /api/tasks/{id}** - タスク削除

#### ログ管理 (Logs)
9. **POST /api/logs** - ログ記録

#### ページ統合データ
10. **GET /api/plan-do** - Plan-Doページ統合データ取得

---

## 2. 実装ファイル一覧

### API Routes
```
app/api/
├── goals/
│   ├── route.ts                    # GET, POST /api/goals
│   └── [id]/
│       └── route.ts                # PUT, DELETE /api/goals/{id}
├── tasks/
│   ├── route.ts                    # POST /api/tasks
│   ├── [id]/
│   │   ├── route.ts                # DELETE /api/tasks/{id}
│   │   └── toggle/
│   │       └── route.ts            # PATCH /api/tasks/{id}/toggle
│   └── today/
│       └── route.ts                # GET /api/tasks/today
├── logs/
│   └── route.ts                    # POST /api/logs
└── plan-do/
    └── route.ts                    # GET /api/plan-do
```

### 統合テスト
```
tests/api/plan-do/
├── goals.test.ts                   # 15テストケース
├── tasks.test.ts                   # 14テストケース
├── logs.test.ts                    # 9テストケース
└── plan-do-page.test.ts            # 12テストケース
```

---

## 3. 主要機能の詳細

### 3.1 目標管理（Goals）

#### 進捗率計算ロジック
目標一覧取得時に、各目標の進捗率を自動計算：
```typescript
// 目標に紐づくタスク数を取得
const totalTasks = await prisma.task.count({
  where: { goalId: goal.id },
});

// 完了タスク数を取得
const completedTasks = await prisma.task.count({
  where: {
    goalId: goal.id,
    status: 'completed',
  },
});

// 進捗率を計算（0-100）
const progressPercentage =
  totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
```

#### カスケード削除
目標削除時、関連タスクもPrismaスキーマの`onDelete: Cascade`で自動削除されます。

### 3.2 タスク管理（Tasks）

#### 今日のタスク取得
```typescript
// 今日の日付範囲を計算
const today = new Date();
today.setHours(0, 0, 0, 0);

const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

// 今日のタスクを取得（Goal名結合）
const tasks = await prisma.task.findMany({
  where: {
    userId,
    dueDate: {
      gte: today,
      lt: tomorrow,
    },
  },
  include: {
    goal: {
      select: { id: true, title: true },
    },
  },
  orderBy: [
    { priority: 'desc' },      // high -> medium -> low
    { scheduledTime: 'asc' },  // 時間順
    { createdAt: 'asc' },
  ],
});
```

#### タスク完了状態切り替え
```typescript
const isCompleted = existingTask.status === 'completed';
const newStatus = isCompleted ? 'pending' : 'completed';
const completedAt = isCompleted ? null : new Date();

await prisma.task.update({
  where: { id },
  data: { status: newStatus, completedAt },
});
```

### 3.3 ログ記録（Logs）

#### バリデーション
- `content`: 1-5000文字（必須）
- `emotion`: 'happy' | 'neutral' | 'sad' | 'anxious' | 'excited' | 'tired'（任意）
- `state`: 'energetic' | 'tired' | 'focused' | 'distracted' | 'calm' | 'stressed'（任意）
- `type`: 'daily' | 'reflection' | 'insight'（デフォルト: 'daily'）
- `taskId`: 存在するタスクIDであること（任意）

### 3.4 Plan-Doページ統合データ

1つのエンドポイントで以下のデータを取得：
- 目標一覧（進捗率付き）
- 今日のタスク一覧（Goal名付き）
- 感情選択肢
- アクティブタブ情報

```typescript
const pageData = {
  activeTab: 'plan' | 'do',
  goals: GoalWithProgress[],
  todayTasks: TaskWithGoal[],
  emotionOptions: EmotionOption[],
};
```

---

## 4. セキュリティ対策

### 認証・認可
すべてのエンドポイントで`verifySession()`を使用したData Access Layer (DAL)パターンを実装：

```typescript
import { verifySession } from '@/lib/dal';

export async function GET() {
  const session = await verifySession();
  const userId = session.userId;
  // ...
}
```

### 権限チェック
- 目標・タスク・ログの更新/削除時、所有者確認を実施
- 他ユーザーのデータへのアクセスは403 Forbiddenを返す

```typescript
if (existingGoal.userId !== userId) {
  return NextResponse.json(
    { error: 'この目標を編集する権限がありません' },
    { status: 403 }
  );
}
```

### バリデーション
- タイトル長（200文字以内）
- 説明文長（5000文字以内）
- 優先度の有効値チェック
- 時刻形式チェック（HH:mm）
- 関連エンティティの存在確認

---

## 5. テスト実装

### テストカバレッジ: 40テストケース

#### goals.test.ts（15テストケース）
- **正常系**: 目標作成、一覧取得、更新、削除、進捗率計算
- **バリデーション**: タイトル必須、文字数制限
- **エラーハンドリング**: 404 Not Found、403 Forbidden
- **カスケード削除**: 目標削除時に関連タスクも削除

#### tasks.test.ts（14テストケース）
- **正常系**: タスク作成、完了切り替え、削除、今日のタスク取得
- **バリデーション**: タイトル必須、優先度、時刻形式
- **エラーハンドリング**: 存在しないgoalId、taskId
- **ソート**: 優先度→時間順の正しいソート

#### logs.test.ts（9テストケース）
- **正常系**: ログ記録
- **バリデーション**: 内容必須、文字数制限、emotion/state/type値チェック
- **エラーハンドリング**: 存在しないtaskId
- **網羅テスト**: すべての有効なemotion/state/type値でテスト

#### plan-do-page.test.ts（12テストケース）
- **正常系**: ページデータ取得、activeTab切り替え
- **進捗率計算**: 目標の進捗率が正しく計算される
- **今日のタスク**: 日付フィルタリングが正しく動作
- **Goal名結合**: タスクに目標名が正しく結合される
- **感情選択肢**: 定義済みの感情選択肢が取得される
- **統合シナリオ**: 複数の目標とタスクが正しく取得される

### テスト設計の特徴
1. **実データ主義**: モック一切なし、実際のデータベースとAPIを使用
2. **完全分離**: 各テストでユニークなユーザーを作成（タイムスタンプ+ランダム）
3. **独立実行可能**: テスト間のデータ依存なし
4. **認証統合**: Auth.jsのセッションCookieを使用した本物の認証フロー

---

## 6. @9統合テスト成功請負人への引き継ぎ

### テスト実行手順

1. **開発サーバー起動**
   ```bash
   npm run dev
   # ポート3247で起動することを確認
   ```

2. **テスト実行**
   ```bash
   # すべてのPlan-Do APIテストを実行
   npm run test tests/api/plan-do

   # 個別実行も可能
   npm run test tests/api/plan-do/goals.test.ts
   npm run test tests/api/plan-do/tasks.test.ts
   npm run test tests/api/plan-do/logs.test.ts
   npm run test tests/api/plan-do/plan-do-page.test.ts
   ```

### 前提条件
- ✅ データベース接続設定（.env.local）
- ✅ Prismaマイグレーション実行済み
- ✅ Next.js開発サーバー起動（ポート3247）
- ✅ 認証システム（Auth.js）動作確認済み

### 注意事項
1. **モック不使用**: すべて実際のデータベースとAPIを使用
2. **テストデータ自動生成**: 各テストでユニークなユーザーとデータを作成
3. **並列実行非推奨**: データベース競合を避けるため、順次実行を推奨
4. **セッション認証**: 各テストで自動的にログイン処理を実行

### トラブルシューティング
- **接続エラー**: .env.localのDATABASE_URLを確認
- **認証エラー**: 開発サーバーが起動しているか確認
- **404エラー**: Next.jsのビルドキャッシュをクリア（`.next`ディレクトリ削除）

---

## 7. 参考資料

### API仕様書
- **docs/api-specs/plan-do-api.md**: 完全なAPI仕様とリクエスト/レスポンス例

### 型定義
- **types/index.ts**: Goal, Task, Log, PlanDoPageData等の型定義

### データベーススキーマ
- **prisma/schema.prisma**: Goal, Task, Logモデルの定義

### 認証・セキュリティ
- **lib/dal.ts**: Data Access Layerパターン実装
- **lib/auth.ts**: Auth.js設定

---

## 8. 次のステップ

### 完了した機能
✅ スライス1: 認証基盤（ログイン・登録・パスワードリセット）
✅ スライス2-A: ユーザー管理（プロフィール・設定・アカウント削除）
✅ スライス2-B: 目標・タスク管理（本スライス）

### 次の実装候補
1. **スライス3: ダッシュボード** - 依存関係が解消され実装可能
2. **スライス4-A: 振り返り・改善** - AI API統合が必要
3. **スライス4-B: AIアシスタント** - AI API統合が必要

---

**実装完了**: 2025-11-02
**バックエンド実装エージェント**: ✅ 任務完了
**次の担当**: @9統合テスト成功請負人
