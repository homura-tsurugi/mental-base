# フェーズ2実装計画（ファイル単位）

**作成日**: 2025-11-02
**目的**: フェーズ1とフェーズ2の統合実装における具体的なファイル単位のタスク管理

---

## 決定事項サマリー

### ユーザー決定事項（2025-11-02確定）

1. **招待フロー**: メンター主導（メンターがクライアントを招待）
2. **データアクセス許可デフォルト**: 全て許可（allowGoals, allowTasks, allowLogs, allowReflections, allowAiReports すべて `true`）
3. **複数メンター保持**: 可能（1クライアント：複数メンター）
4. **MentorNoteフィールド名**: `isSharedWithClient`に統一（Prismaスキーマの`isPrivate`を変更）
5. **User型**: User型を拡張、UserExtended型は削除

### フェーズ1の既存実装パターン分析結果

#### 1. MainLayout（`components/layouts/MainLayout.tsx`）
- **navigationItems構造**: 静的配列、5つの固定アイテム
- **ロール判定**: なし（現状はすべてのユーザーに同じナビゲーション表示）
- **デザインパターン**:
  - Material Icons使用
  - Tailwind CSS変数（`var(--primary)`, `var(--text-primary)`等）
  - ボトムナビゲーション形式
  - FABボタン（画面右下固定）
- **統合ポイント**: メンターロール時にメンターダッシュボードリンクを追加する必要あり

#### 2. User型の使用状況
- **定義場所**: `types/index.ts` (L7-L14)
- **UserDisplay型**: User型を拡張、initialsプロパティ追加（L17-L20）
- **UserExtended型**: User型を拡張、role/isMentor/bio/expertise追加（L860-L866）
- **使用箇所**:
  - MainLayout.tsx（UserDisplay型のみ）
  - components/auth/（User型）
  - lib/dal.ts（セッション型として間接的に使用）
  - lib/services/SettingsService.ts（User型）
  - tests/（各種テスト）
- **影響範囲**: UserExtended型を削除し、User型に統合する必要あり

#### 3. カスタムフックパターン（`hooks/`）
- **命名規則**: use + 機能名（例: useDashboardData, useSettingsData）
- **構造**:
  ```typescript
  export const useHookName = (): ReturnType => {
    const [data, setData] = useState<DataType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = async () => { /* ... */ };

    useEffect(() => { fetchData(); }, []);

    return { data, loading, error, refetch: fetchData };
  };
  ```
- **特徴**:
  - サービスクラス（`lib/services/`）を使用してAPIコール
  - useState + useEffectパターン
  - React Queryは**未使用**（CLAUDEの想定と異なる）
- **統合ポイント**: useMentorDashboard, useClientDetail フックを同じパターンで実装

#### 4. API実装パターン（`app/api/`）
- **エラーハンドリング**:
  ```typescript
  try {
    const session = await verifySession(); // または verifyMentor()
    // 処理
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
  ```
- **認証チェック**: verifySession()、verifyMentor()を最初に呼び出す
- **レスポンス形式**: `NextResponse.json({ data })`または`NextResponse.json({ error })`
- **モックデータ**: 多くのAPIエンドポイントで開発中のモックデータを返している（`// TODO: 実際のデータベースから取得`コメント付き）

#### 5. 設定ページの構造（`app/(protected)/settings/page.tsx`）
- **セクション構成**:
  1. プロフィール（L159-L199）
  2. パスワード変更（L201-L264）
  3. 通知設定（L266-L289）
  4. アカウント管理（L291-L313）
- **スタイルパターン**: Card + セクション見出し（`<h2>`）
- **状態管理**: useState + useEffect（useSettingsDataフックから取得）
- **統合ポイント**: メンター登録セクション、データアクセス許可セクションを追加

---

## Week 1: 基盤整備（1-2日、合計5-6時間）

### タスク1-1: Prismaスキーマ修正（MentorNote.isPrivate → isSharedWithClient）

**対象ファイル**: `prisma/schema.prisma`

**現状**:
```prisma
model MentorNote {
  // ...
  isPrivate      Boolean  @default(true) // true: メンターのみ閲覧可能、false: クライアントと共有
  // ...
}
```

**修正後**:
```prisma
model MentorNote {
  // ...
  isSharedWithClient Boolean  @default(false) // true: クライアントと共有、false: メンターのみ閲覧可能
  // ...
}
```

**修正理由**: ユーザー決定事項に基づき、命名をより明確にする

**影響を受けるファイル**:
- `types/index.ts` (L708-L721: MentorNote型、L724-L732: MentorNoteForm型)
- `app/api/mentor/notes/route.ts` (L32, L57, L74)
- `app/api/mentor/notes/[id]/route.ts` (未実装予定、今後作成時に注意)
- `components/mentor/MentorNoteFormComponent.tsx` (isSharedWithClient使用箇所)
- `components/mentor/tabs/MentorNotesTab.tsx` (表示ロジック)

**所要時間**: 30分

**チェックリスト**:
- [ ] schema.prismaのisPrivate → isSharedWithClient変更
- [ ] コメント更新（true/falseの意味を明確化）
- [ ] 影響ファイルリスト作成完了

---

### タスク1-2: User型統一（UserExtended削除、User型拡張）

**対象ファイル**: `types/index.ts`

**現状**:
```typescript
// L7-L14
export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// L860-L866
export interface UserExtended extends User {
  role: UserRole; // CLIENT/MENTOR/ADMIN
  isMentor: boolean; // メンターかどうか
  bio?: string; // 自己紹介
  expertise: MentorExpertise[]; // 専門分野
}
```

**修正後**:
```typescript
// L7-L20（拡張）
export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
  // フェーズ2追加フィールド
  role: UserRole; // CLIENT/MENTOR/ADMIN
  isMentor: boolean; // メンターかどうか
  bio?: string; // 自己紹介
  expertise: MentorExpertise[]; // 専門分野
}

// UserExtended型は削除（L860-L866削除）
```

**修正理由**: ユーザー決定事項に基づき、User型を統一

**影響を受けるファイル**:
- **型エラーが発生しない可能性が高い箇所**（User型の拡張なので互換性あり）:
  - `components/auth/RegisterForm.tsx`
  - `components/auth/LoginForm.tsx`
  - `lib/services/SettingsService.ts`
  - `hooks/useSettingsData.ts`
  - `tests/api/*/*.test.ts`（複数のテストファイル）

- **UserExtended型を削除する必要がある箇所**:
  - `types/index.ts`のみ（UserExtended型の定義箇所）

**Prisma Client生成型との関係**:
- Prisma Clientの`User`型には既に`role`, `isMentor`, `bio`, `expertise`が含まれている（schema.prismaに定義済み）
- `types/index.ts`のUser型をPrisma Clientの型と同期させる必要がある

**所要時間**: 1時間

**チェックリスト**:
- [ ] User型にrole, isMentor, bio, expertiseフィールド追加
- [ ] UserExtended型定義削除（L860-L866）
- [ ] TypeScriptコンパイルエラー確認（`npm run build`）
- [ ] UserExtended型を使用している箇所がないことをGrep確認

---

### タスク1-3: DataAccessPermissionデフォルト値変更

**対象ファイル**: `prisma/schema.prisma`

**現状**:
```prisma
model ClientDataAccessPermission {
  // ...
  allowGoals      Boolean  @default(false)
  allowTasks      Boolean  @default(false)
  allowLogs       Boolean  @default(false)
  allowReflections Boolean @default(false)
  allowAiReports  Boolean  @default(false)
  // ...
}
```

**修正後**:
```prisma
model ClientDataAccessPermission {
  // ...
  allowGoals      Boolean  @default(true)  // デフォルトで全て許可
  allowTasks      Boolean  @default(true)
  allowLogs       Boolean  @default(true)
  allowReflections Boolean @default(true)
  allowAiReports  Boolean  @default(true)
  // ...
}
```

**修正理由**: ユーザー決定事項に基づき、データアクセス許可のデフォルトを全て許可に変更

**影響を受けるファイル**: なし（データベーススキーマの変更のみ）

**所要時間**: 15分

**チェックリスト**:
- [ ] schema.prismaのデフォルト値変更
- [ ] コメント追加（デフォルトで全て許可）

---

### タスク1-4: Prismaマイグレーション実行

**実行コマンド**:
```bash
# 1. バックアップ作成（重要）
pg_dump $DATABASE_URL > "/Users/nishiyamayoshimitsu/Desktop/backup_before_phase2_migration_$(date +%Y%m%d_%H%M%S).sql"

# 2. マイグレーション作成（確認のみ、--create-onlyオプション）
npx prisma migrate dev --name phase2_mentor_features --create-only

# 3. 生成されたSQLファイルを確認
cat prisma/migrations/$(ls -t prisma/migrations/ | head -1)/migration.sql

# 4. 問題なければマイグレーション適用
npx prisma migrate deploy

# 5. Prisma Client再生成
npx prisma generate
```

**マイグレーション内容**:
1. `mentor_notes.isPrivate` → `mentor_notes.isSharedWithClient` カラム名変更
2. `client_data_access_permissions`の各allowカラムのデフォルト値を`false` → `true`に変更

**予想されるSQL**:
```sql
-- MentorNote: isPrivate → isSharedWithClient
ALTER TABLE "mentor_notes" RENAME COLUMN "isPrivate" TO "isSharedWithClient";

-- ClientDataAccessPermission: デフォルト値変更
ALTER TABLE "client_data_access_permissions" ALTER COLUMN "allowGoals" SET DEFAULT true;
ALTER TABLE "client_data_access_permissions" ALTER COLUMN "allowTasks" SET DEFAULT true;
ALTER TABLE "client_data_access_permissions" ALTER COLUMN "allowLogs" SET DEFAULT true;
ALTER TABLE "client_data_access_permissions" ALTER COLUMN "allowReflections" SET DEFAULT true;
ALTER TABLE "client_data_access_permissions" ALTER COLUMN "allowAiReports" SET DEFAULT true;
```

**注意事項**:
- **既存データへの影響**: `isPrivate`の値が反転する（`isPrivate=true` → `isSharedWithClient=false`）
- **ロールバック手順**: バックアップからリストア
  ```bash
  psql $DATABASE_URL < backup_before_phase2_migration_YYYYMMDD_HHMMSS.sql
  ```

**所要時間**: 1時間（テスト環境での実行、確認含む）

**チェックリスト**:
- [ ] バックアップ作成完了
- [ ] マイグレーションSQL確認完了（--create-onlyで生成）
- [ ] テスト環境で実行完了（エラーなし）
- [ ] 本番環境で実行完了（該当する場合）
- [ ] Prisma Client再生成完了（`npx prisma generate`）
- [ ] TypeScriptコンパイルエラー確認（`npm run build`）

---

### タスク1-5: lib/constants.ts作成

**新規ファイル**: `lib/constants.ts`

**実装内容**:
```typescript
// API エンドポイントパス定数
// フェーズ2: メンター機能用

/**
 * メンター関連APIエンドポイント
 */
export const API_PATHS = {
  // メンターダッシュボード
  MENTOR_DASHBOARD: '/api/mentor/dashboard',

  // メンター-クライアント関係
  MENTOR_RELATIONSHIPS: '/api/mentor/relationships',
  MENTOR_INVITE: '/api/mentor/invite',
  MENTOR_RELATIONSHIP_ACCEPT: (id: string) => `/api/mentor/relationships/${id}/accept`,
  MENTOR_RELATIONSHIP_TERMINATE: (id: string) => `/api/mentor/relationships/${id}/terminate`,

  // クライアント詳細
  MENTOR_CLIENT_DETAIL: (id: string) => `/api/mentor/client/${id}`,
  MENTOR_CLIENT_GOALS: (id: string) => `/api/mentor/client/${id}/goals`,
  MENTOR_CLIENT_TASKS: (id: string) => `/api/mentor/client/${id}/tasks`,
  MENTOR_CLIENT_LOGS: (id: string) => `/api/mentor/client/${id}/logs`,
  MENTOR_CLIENT_REFLECTIONS: (id: string) => `/api/mentor/client/${id}/reflections`,
  MENTOR_CLIENT_AI_REPORTS: (id: string) => `/api/mentor/client/${id}/ai-reports`,

  // データアクセス制御
  CLIENT_DATA_ACCESS: '/api/client/data-access',

  // メンターノート
  MENTOR_NOTES: '/api/mentor/notes',
  MENTOR_NOTE_DETAIL: (id: string) => `/api/mentor/notes/${id}`,

  // 進捗レポート
  MENTOR_REPORTS: '/api/mentor/reports',
  MENTOR_REPORT_GENERATE: '/api/mentor/reports/generate',
  MENTOR_REPORT_DETAIL: (id: string) => `/api/mentor/reports/${id}`,
  MENTOR_REPORT_SHARE: (id: string) => `/api/mentor/reports/${id}/share`,
} as const;

/**
 * ページパス定数
 */
export const PAGE_PATHS = {
  // メンター
  MENTOR_DASHBOARD: '/mentor',
  MENTOR_CLIENT_DETAIL: (id: string) => `/mentor/client/${id}`,

  // クライアント
  SETTINGS: '/settings',
  HOME: '/',
} as const;
```

**依存**: なし

**所要時間**: 30分

**チェックリスト**:
- [ ] lib/constants.ts作成完了
- [ ] API_PATHS定数定義完了
- [ ] PAGE_PATHS定数定義完了
- [ ] TypeScriptコンパイルエラー確認

---

### タスク1-6: lib/mentor-access.ts作成

**新規ファイル**: `lib/mentor-access.ts`

**実装内容**:
```typescript
// メンターデータアクセス制御ヘルパー関数
// フェーズ2: セキュリティとGDPR対応

import { prisma } from '@/lib/prisma';

/**
 * データアクセス権限チェック
 * @param mentorId メンターID
 * @param clientId クライアントID
 * @param dataType データタイプ（'goal' | 'task' | 'log' | 'reflection' | 'ai_report'）
 * @returns 許可されている場合true、そうでない場合false
 * @throws {Error} 関係が存在しない、または無効な場合
 */
export async function checkDataAccess(
  mentorId: string,
  clientId: string,
  dataType: 'goal' | 'task' | 'log' | 'reflection' | 'ai_report'
): Promise<boolean> {
  // 1. メンター-クライアント関係確認
  const relationship = await prisma.mentorClientRelationship.findFirst({
    where: {
      mentorId,
      clientId,
      status: 'active', // activeステータスのみ
    },
    include: {
      accessPermissions: {
        where: {
          isActive: true,
        },
      },
    },
  });

  if (!relationship) {
    throw new Error('メンター-クライアント関係が存在しません');
  }

  if (!relationship.accessPermissions.length) {
    return false; // 権限設定が存在しない場合は拒否
  }

  const permission = relationship.accessPermissions[0];

  // 2. データタイプ別の権限チェック
  switch (dataType) {
    case 'goal':
      return permission.allowGoals;
    case 'task':
      return permission.allowTasks;
    case 'log':
      return permission.allowLogs;
    case 'reflection':
      return permission.allowReflections;
    case 'ai_report':
      return permission.allowAiReports;
    default:
      return false;
  }
}

/**
 * データ閲覧ログ記録
 * @param mentorId メンターID
 * @param clientId クライアントID
 * @param dataType データタイプ
 * @param dataId データID
 * @param action アクション（'view' | 'export'）
 */
export async function logDataView(
  mentorId: string,
  clientId: string,
  dataType: 'goal' | 'task' | 'log' | 'reflection' | 'ai_report',
  dataId: string,
  action: 'view' | 'export' = 'view'
): Promise<void> {
  await prisma.clientDataViewLog.create({
    data: {
      mentorId,
      clientId,
      dataType,
      dataId,
      action,
    },
  });
}

/**
 * クライアントデータアクセス（権限チェック + ログ記録）
 * @param mentorId メンターID
 * @param clientId クライアントID
 * @param dataType データタイプ
 * @param dataId データID
 * @throws {Error} アクセス権限がない場合
 */
export async function accessClientData(
  mentorId: string,
  clientId: string,
  dataType: 'goal' | 'task' | 'log' | 'reflection' | 'ai_report',
  dataId: string
): Promise<void> {
  // 1. 権限チェック
  const hasAccess = await checkDataAccess(mentorId, clientId, dataType);

  if (!hasAccess) {
    throw new Error(`${dataType}データへのアクセス権限がありません`);
  }

  // 2. ログ記録
  await logDataView(mentorId, clientId, dataType, dataId, 'view');
}

/**
 * 複数データの一括アクセスチェック（N+1問題回避）
 * @param mentorId メンターID
 * @param clientId クライアントID
 * @param dataType データタイプ
 * @param dataIds データID配列
 * @throws {Error} アクセス権限がない場合
 */
export async function accessMultipleClientData(
  mentorId: string,
  clientId: string,
  dataType: 'goal' | 'task' | 'log' | 'reflection' | 'ai_report',
  dataIds: string[]
): Promise<void> {
  // 1. 権限チェック（1回のみ）
  const hasAccess = await checkDataAccess(mentorId, clientId, dataType);

  if (!hasAccess) {
    throw new Error(`${dataType}データへのアクセス権限がありません`);
  }

  // 2. ログ記録（一括作成）
  await prisma.clientDataViewLog.createMany({
    data: dataIds.map((dataId) => ({
      mentorId,
      clientId,
      dataType,
      dataId,
      action: 'view' as const,
    })),
  });
}
```

**依存**: Prismaマイグレーション完了後

**テスト**:
```typescript
// lib/mentor-access.test.ts（作成推奨）
import { checkDataAccess, logDataView, accessClientData } from './mentor-access';

describe('mentor-access', () => {
  test('checkDataAccess: 有効な権限がある場合true', async () => {
    // モックデータセットアップ
    const hasAccess = await checkDataAccess('mentor-1', 'client-1', 'goal');
    expect(hasAccess).toBe(true);
  });

  test('checkDataAccess: 権限がない場合false', async () => {
    const hasAccess = await checkDataAccess('mentor-1', 'client-2', 'log');
    expect(hasAccess).toBe(false);
  });

  test('accessClientData: 権限がない場合エラー', async () => {
    await expect(
      accessClientData('mentor-1', 'client-3', 'task', 'task-1')
    ).rejects.toThrow('taskデータへのアクセス権限がありません');
  });
});
```

**所要時間**: 2時間

**チェックリスト**:
- [ ] lib/mentor-access.ts作成完了
- [ ] checkDataAccess関数実装完了
- [ ] logDataView関数実装完了
- [ ] accessClientData関数実装完了
- [ ] accessMultipleClientData関数実装完了
- [ ] ユニットテスト作成完了（推奨）
- [ ] TypeScriptコンパイルエラー確認

---

## Week 2: API実装とDB連携（2-3日、合計16-20時間）

### タスク2-1: /api/mentor/dashboard のDB連携移行

**対象ファイル**: `app/api/mentor/dashboard/route.ts`

**現状**: モックデータを返している

**修正内容**:

```typescript
// GET /api/mentor/dashboard - メンターダッシュボードデータ取得

import { NextRequest, NextResponse } from 'next/server';
import { verifyMentor } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import type { MentorDashboardData, DashboardStatistics, ClientSummary, ClientStatus } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // メンター認証確認
    const session = await verifyMentor();
    const mentorId = session.userId;

    // 担当クライアント一覧と権限を並列取得
    const [relationships, allClients] = await Promise.all([
      // メンター-クライアント関係取得（activeのみ）
      prisma.mentorClientRelationship.findMany({
        where: {
          mentorId,
          status: 'active',
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
            },
          },
        },
      }),

      // クライアントの最終活動日時を取得（全クライアント分）
      prisma.mentorClientRelationship.findMany({
        where: {
          mentorId,
          status: 'active',
        },
        select: {
          clientId: true,
        },
      }),
    ]);

    if (relationships.length === 0) {
      // クライアントが0の場合
      return NextResponse.json({
        statistics: {
          totalClients: 0,
          activeClients: 0,
          needsFollowUp: 0,
          averageProgress: 0,
        },
        clients: [],
      } as MentorDashboardData);
    }

    const clientIds = relationships.map((r) => r.clientId);

    // 各クライアントの最終活動日時と進捗率を並列計算
    const clientDataPromises = clientIds.map(async (clientId) => {
      const [lastTask, lastLog, lastReflection, goals, tasks] = await Promise.all([
        // 最終タスク更新
        prisma.task.findFirst({
          where: { userId: clientId },
          orderBy: { updatedAt: 'desc' },
          select: { updatedAt: true },
        }),
        // 最終ログ作成
        prisma.log.findFirst({
          where: { userId: clientId },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
        // 最終振り返り作成
        prisma.reflection.findFirst({
          where: { userId: clientId },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
        // 目標数
        prisma.goal.count({
          where: { userId: clientId, status: 'active' },
        }),
        // タスク数と完了数
        prisma.task.findMany({
          where: { userId: clientId },
          select: { status: true },
        }),
      ]);

      // 最終活動日時を決定
      const activityDates = [
        lastTask?.updatedAt,
        lastLog?.createdAt,
        lastReflection?.createdAt,
      ].filter(Boolean) as Date[];

      const lastActivityDate = activityDates.length > 0
        ? new Date(Math.max(...activityDates.map((d) => d.getTime())))
        : new Date(0); // アクティビティがない場合はエポック

      // 進捗率計算（タスク完了率）
      const completedTasks = tasks.filter((t) => t.status === 'completed').length;
      const totalTasks = tasks.length;
      const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return { clientId, lastActivityDate, overallProgress };
    });

    const clientDataResults = await Promise.all(clientDataPromises);
    const clientDataMap = new Map(
      clientDataResults.map((r) => [r.clientId, r])
    );

    // クライアントステータス判定
    const getClientStatus = (lastActivityDate: Date): ClientStatus => {
      const now = new Date();
      const daysSinceActivity = Math.floor(
        (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceActivity <= 3) return 'on_track'; // 3日以内
      if (daysSinceActivity <= 7) return 'stagnant'; // 7日以内
      return 'needs_followup'; // 7日以上
    };

    // 最終活動ラベル生成
    const getLastActivityLabel = (lastActivityDate: Date): string => {
      const now = new Date();
      const diffMs = now.getTime() - lastActivityDate.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMinutes < 60) return '今日';
      if (diffHours < 24) return '今日';
      if (diffDays === 1) return '昨日';
      return `${diffDays}日前`;
    };

    // クライアント一覧データ作成
    const clients: ClientSummary[] = relationships.map((rel) => {
      const clientData = clientDataMap.get(rel.clientId)!;
      const status = getClientStatus(clientData.lastActivityDate);
      const lastActivityLabel = getLastActivityLabel(clientData.lastActivityDate);

      // イニシャル計算（名前の最初の1文字）
      const initials = rel.client.name.charAt(0);

      return {
        id: rel.clientId,
        name: rel.client.name,
        email: rel.client.email,
        initials,
        overallProgress: clientData.overallProgress,
        lastActivityDate: clientData.lastActivityDate,
        lastActivityLabel,
        status,
        relationshipId: rel.id,
      };
    });

    // 統計計算
    const totalClients = clients.length;
    const activeClients = clients.filter((c) => c.status === 'on_track').length;
    const needsFollowUp = clients.filter((c) => c.status === 'needs_followup').length;
    const averageProgress = clients.length > 0
      ? Math.round(clients.reduce((sum, c) => sum + c.overallProgress, 0) / clients.length)
      : 0;

    const statistics: DashboardStatistics = {
      totalClients,
      activeClients,
      needsFollowUp,
      averageProgress,
    };

    const dashboardData: MentorDashboardData = {
      statistics,
      clients,
    };

    return NextResponse.json(dashboardData, { status: 200 });
  } catch (error) {
    console.error('メンターダッシュボードデータ取得エラー:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'データの取得に失敗しました' },
      { status: 500 }
    );
  }
}
```

**パフォーマンス最適化ポイント**:
- Promise.allで並列クエリ実行
- N+1問題回避（クライアント数分のクエリを並列実行）
- インデックス活用（userId, status, createdAt, updatedAtにインデックスあり）

**テスト**:
- 正常系: クライアント一覧取得
- 統計計算の正確性（totalClients, activeClients, needsFollowUp, averageProgress）
- パフォーマンス（100クライアントでレスポンス1秒以内目標）

**所要時間**: 3時間

**チェックリスト**:
- [ ] モックデータ削除
- [ ] Prismaクエリ実装完了
- [ ] Promise.all使用でパフォーマンス最適化
- [ ] クライアントステータス判定ロジック実装
- [ ] 統計計算実装
- [ ] エラーハンドリング確認
- [ ] TypeScriptコンパイルエラー確認

---

### タスク2-2: /api/mentor/client/[id] のDB連携移行

**対象ファイル**: `app/api/mentor/client/[id]/route.ts`

**現状**: 未実装（新規作成）

**実装内容**:

```typescript
// GET /api/mentor/client/[id] - クライアント詳細データ取得

import { NextRequest, NextResponse } from 'next/server';
import { verifyMentor } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { checkDataAccess, accessMultipleClientData } from '@/lib/mentor-access';
import type { ClientDetailData, ClientInfo, ClientStatus } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // メンター認証確認
    const session = await verifyMentor();
    const mentorId = session.userId;
    const clientId = params.id;

    // 1. メンター-クライアント関係確認
    const relationship = await prisma.mentorClientRelationship.findFirst({
      where: {
        mentorId,
        clientId,
        status: 'active',
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
        accessPermissions: {
          where: {
            isActive: true,
          },
        },
      },
    });

    if (!relationship) {
      return NextResponse.json(
        { error: 'クライアントが見つかりません' },
        { status: 404 }
      );
    }

    const permissions = relationship.accessPermissions[0];
    if (!permissions) {
      return NextResponse.json(
        { error: 'アクセス権限が設定されていません' },
        { status: 403 }
      );
    }

    // 2. クライアント基本情報
    const clientInfo: ClientInfo = {
      id: relationship.client.id,
      name: relationship.client.name,
      email: relationship.client.email,
      initials: relationship.client.name.charAt(0),
      registeredAt: relationship.client.createdAt,
      relationshipStartDate: relationship.acceptedAt || relationship.invitedAt,
      overallProgress: 0, // 後で計算
      status: 'on_track' as ClientStatus, // 後で計算
    };

    // 3. 権限に基づいてデータ取得
    const [goals, tasks, logs, reflections, aiReports] = await Promise.all([
      // 目標一覧（許可されている場合のみ）
      permissions.allowGoals
        ? prisma.goal.findMany({
            where: { userId: clientId },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),

      // タスク一覧（許可されている場合のみ）
      permissions.allowTasks
        ? prisma.task.findMany({
            where: { userId: clientId },
            include: {
              goal: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),

      // ログ履歴（許可されている場合のみ）
      permissions.allowLogs
        ? prisma.log.findMany({
            where: { userId: clientId },
            orderBy: { createdAt: 'desc' },
            take: 50, // 最新50件
          })
        : Promise.resolve([]),

      // 振り返り（許可されている場合のみ）
      permissions.allowReflections
        ? prisma.reflection.findMany({
            where: { userId: clientId },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),

      // AI分析レポート（許可されている場合のみ）
      permissions.allowAiReports
        ? prisma.aIAnalysisReport.findMany({
            where: { userId: clientId },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
    ]);

    // 4. アクセスログ記録（一括）
    const dataAccessLogs = [];
    if (permissions.allowGoals && goals.length > 0) {
      await accessMultipleClientData(mentorId, clientId, 'goal', goals.map((g) => g.id));
    }
    if (permissions.allowTasks && tasks.length > 0) {
      await accessMultipleClientData(mentorId, clientId, 'task', tasks.map((t) => t.id));
    }
    if (permissions.allowLogs && logs.length > 0) {
      await accessMultipleClientData(mentorId, clientId, 'log', logs.map((l) => l.id));
    }
    if (permissions.allowReflections && reflections.length > 0) {
      await accessMultipleClientData(mentorId, clientId, 'reflection', reflections.map((r) => r.id));
    }
    if (permissions.allowAiReports && aiReports.length > 0) {
      await accessMultipleClientData(mentorId, clientId, 'ai_report', aiReports.map((r) => r.id));
    }

    // 5. 進捗率計算（タスク完了率）
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const totalTasks = tasks.length;
    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    clientInfo.overallProgress = overallProgress;

    // 6. ステータス計算（最終活動日時から）
    const lastActivityDate = tasks.length > 0
      ? tasks[0].updatedAt
      : logs.length > 0
        ? logs[0].createdAt
        : new Date(0);

    const daysSinceActivity = Math.floor(
      (new Date().getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    clientInfo.status =
      daysSinceActivity <= 3
        ? 'on_track'
        : daysSinceActivity <= 7
          ? 'stagnant'
          : 'needs_followup';

    // 7. メンターノート取得（常に許可）
    const mentorNotes = await prisma.mentorNote.findMany({
      where: {
        mentorId,
        clientId,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 8. TaskWithGoal型、GoalWithProgress型に変換
    const tasksWithGoal = tasks.map((task) => {
      const { goal, ...taskData } = task;
      return {
        ...taskData,
        goalName: goal?.title,
      };
    });

    const goalsWithProgress = goals.map((goal) => {
      const goalTasks = tasks.filter((t) => t.goalId === goal.id);
      const completedGoalTasks = goalTasks.filter((t) => t.status === 'completed').length;
      const totalGoalTasks = goalTasks.length;
      const progressPercentage = totalGoalTasks > 0
        ? Math.round((completedGoalTasks / totalGoalTasks) * 100)
        : 0;

      return {
        ...goal,
        completedTasks: completedGoalTasks,
        totalTasks: totalGoalTasks,
        progressPercentage,
      };
    });

    // 9. AI分析レポートを詳細型に変換（insightsとrecommendationsをパース）
    const aiReportsDetailed = aiReports.map((report) => ({
      ...report,
      insights: report.insights as any, // JSONフィールドをパース（型アサーション）
      recommendations: report.recommendations as any,
      confidencePercentage: Math.round(report.confidence * 100),
    }));

    // 10. レスポンスデータ構築
    const clientDetailData: ClientDetailData = {
      clientInfo,
      permissions,
      progressData: {
        overallProgress,
        goals: goalsWithProgress,
        tasks: tasksWithGoal,
        logs,
        reflections,
        aiReports: aiReportsDetailed,
      },
      mentorNotes,
    };

    return NextResponse.json(clientDetailData, { status: 200 });
  } catch (error) {
    console.error('クライアント詳細データ取得エラー:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'データの取得に失敗しました' },
      { status: 500 }
    );
  }
}
```

**所要時間**: 3時間

**チェックリスト**:
- [ ] 新規ファイル作成
- [ ] メンター-クライアント関係確認ロジック実装
- [ ] 権限に基づくデータ取得実装
- [ ] アクセスログ記録実装（accessMultipleClientData使用）
- [ ] 進捗率・ステータス計算実装
- [ ] TaskWithGoal、GoalWithProgress型変換実装
- [ ] エラーハンドリング確認
- [ ] TypeScriptコンパイルエラー確認

---

### タスク2-3~2-13: 新規APIエンドポイント実装（11個）

以下のエンドポイントを順次実装します。

#### 2-3. GET /api/mentor/relationships

**新規ファイル**: `app/api/mentor/relationships/route.ts`

**実装内容**: メンター-クライアント関係一覧取得

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyMentor } from '@/lib/dal';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await verifyMentor();
    const mentorId = session.userId;

    const relationships = await prisma.mentorClientRelationship.findMany({
      where: { mentorId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ relationships }, { status: 200 });
  } catch (error) {
    console.error('関係一覧取得エラー:', error);
    return NextResponse.json({ error: 'データの取得に失敗しました' }, { status: 500 });
  }
}
```

**所要時間**: 1時間

---

#### 2-4. POST /api/mentor/invite

**新規ファイル**: `app/api/mentor/invite/route.ts`

**実装内容**: クライアント招待（メール送信含む）

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyMentor } from '@/lib/dal';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await verifyMentor();
    const mentorId = session.userId;

    const body = await request.json();
    const { clientEmail } = body;

    if (!clientEmail) {
      return NextResponse.json({ error: 'clientEmailが必要です' }, { status: 400 });
    }

    // 1. クライアントユーザー検索
    const client = await prisma.user.findUnique({
      where: { email: clientEmail },
    });

    if (!client) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 2. 既存の関係確認
    const existingRelationship = await prisma.mentorClientRelationship.findFirst({
      where: {
        mentorId,
        clientId: client.id,
      },
    });

    if (existingRelationship) {
      return NextResponse.json(
        { error: 'すでに招待済みです' },
        { status: 409 }
      );
    }

    // 3. 関係作成（status: pending）
    const relationship = await prisma.mentorClientRelationship.create({
      data: {
        mentorId,
        clientId: client.id,
        status: 'pending',
        invitedBy: mentorId,
      },
    });

    // 4. TODO: メール送信（Resend API使用）
    // await sendInvitationEmail(client.email, session.userName);

    return NextResponse.json({ relationship }, { status: 201 });
  } catch (error) {
    console.error('招待エラー:', error);
    return NextResponse.json({ error: '招待に失敗しました' }, { status: 500 });
  }
}
```

**所要時間**: 2時間（メール送信ロジックは後回し可）

---

#### 2-5. POST /api/mentor/relationships/[id]/accept

**新規ファイル**: `app/api/mentor/relationships/[id]/accept/route.ts`

**実装内容**: 招待承認（クライアント側）

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/dal';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifySession();
    const relationshipId = params.id;

    // 1. 関係確認（クライアント本人のみ承認可能）
    const relationship = await prisma.mentorClientRelationship.findUnique({
      where: { id: relationshipId },
    });

    if (!relationship) {
      return NextResponse.json({ error: '招待が見つかりません' }, { status: 404 });
    }

    if (relationship.clientId !== session.userId) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    if (relationship.status !== 'pending') {
      return NextResponse.json({ error: 'すでに処理済みです' }, { status: 409 });
    }

    // 2. ステータス更新（pending → active）
    const updatedRelationship = await prisma.mentorClientRelationship.update({
      where: { id: relationshipId },
      data: {
        status: 'active',
        acceptedAt: new Date(),
      },
    });

    // 3. データアクセス許可を作成（デフォルトで全て許可）
    await prisma.clientDataAccessPermission.create({
      data: {
        relationshipId,
        clientId: session.userId,
        allowGoals: true,
        allowTasks: true,
        allowLogs: true,
        allowReflections: true,
        allowAiReports: true,
        isActive: true,
      },
    });

    return NextResponse.json({ relationship: updatedRelationship }, { status: 200 });
  } catch (error) {
    console.error('招待承認エラー:', error);
    return NextResponse.json({ error: '承認に失敗しました' }, { status: 500 });
  }
}
```

**所要時間**: 1.5時間

---

#### 2-6. DELETE /api/mentor/relationships/[id]/terminate

**新規ファイル**: `app/api/mentor/relationships/[id]/terminate/route.ts`

**実装内容**: 関係終了（メンターまたはクライアント）

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/dal';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifySession();
    const relationshipId = params.id;

    // 1. 関係確認（メンターまたはクライアント本人のみ）
    const relationship = await prisma.mentorClientRelationship.findUnique({
      where: { id: relationshipId },
    });

    if (!relationship) {
      return NextResponse.json({ error: '関係が見つかりません' }, { status: 404 });
    }

    if (
      relationship.mentorId !== session.userId &&
      relationship.clientId !== session.userId
    ) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    // 2. ステータス更新（active → terminated）
    const updatedRelationship = await prisma.mentorClientRelationship.update({
      where: { id: relationshipId },
      data: {
        status: 'terminated',
        terminatedAt: new Date(),
      },
    });

    // 3. アクセス権限を無効化
    await prisma.clientDataAccessPermission.updateMany({
      where: { relationshipId },
      data: { isActive: false },
    });

    return NextResponse.json({ relationship: updatedRelationship }, { status: 200 });
  } catch (error) {
    console.error('関係終了エラー:', error);
    return NextResponse.json({ error: '終了に失敗しました' }, { status: 500 });
  }
}
```

**所要時間**: 1.5時間

---

#### 2-7~2-11. クライアントデータ取得エンドポイント（5個）

これらは`/api/mentor/client/[id]/route.ts`に統合されているため、**追加実装不要**です。

- GET /api/mentor/client/[id]/goals
- GET /api/mentor/client/[id]/tasks
- GET /api/mentor/client/[id]/logs
- GET /api/mentor/client/[id]/reflections
- GET /api/mentor/client/[id]/ai-reports

クエリパラメータでデータタイプを指定する方式に変更することも検討できます。

**所要時間**: 0時間（統合済み）

---

#### 2-12. GET /api/client/data-access

**新規ファイル**: `app/api/client/data-access/route.ts`

**実装内容**: アクセス許可設定取得（クライアント側）

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/dal';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession();
    const clientId = session.userId;

    // クライアントのアクセス許可設定一覧
    const permissions = await prisma.clientDataAccessPermission.findMany({
      where: {
        clientId,
        isActive: true,
      },
      include: {
        relationship: {
          include: {
            mentor: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ permissions }, { status: 200 });
  } catch (error) {
    console.error('アクセス許可取得エラー:', error);
    return NextResponse.json({ error: 'データの取得に失敗しました' }, { status: 500 });
  }
}
```

**所要時間**: 1時間

---

#### 2-13. PUT /api/client/data-access

**新規ファイル**: `app/api/client/data-access/route.ts`（既存ファイルにPUT追加）

**実装内容**: アクセス許可設定更新（クライアント側）

```typescript
export async function PUT(request: NextRequest) {
  try {
    const session = await verifySession();
    const clientId = session.userId;

    const body = await request.json();
    const { relationshipId, allowGoals, allowTasks, allowLogs, allowReflections, allowAiReports } = body;

    if (!relationshipId) {
      return NextResponse.json({ error: 'relationshipIdが必要です' }, { status: 400 });
    }

    // 1. 関係確認（クライアント本人のみ更新可能）
    const relationship = await prisma.mentorClientRelationship.findUnique({
      where: { id: relationshipId },
    });

    if (!relationship || relationship.clientId !== clientId) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    // 2. 既存の権限設定を更新
    const permission = await prisma.clientDataAccessPermission.upsert({
      where: { relationshipId },
      update: {
        allowGoals: allowGoals ?? true,
        allowTasks: allowTasks ?? true,
        allowLogs: allowLogs ?? true,
        allowReflections: allowReflections ?? true,
        allowAiReports: allowAiReports ?? true,
      },
      create: {
        relationshipId,
        clientId,
        allowGoals: allowGoals ?? true,
        allowTasks: allowTasks ?? true,
        allowLogs: allowLogs ?? true,
        allowReflections: allowReflections ?? true,
        allowAiReports: allowAiReports ?? true,
        isActive: true,
      },
    });

    return NextResponse.json({ permission }, { status: 200 });
  } catch (error) {
    console.error('アクセス許可更新エラー:', error);
    return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
  }
}
```

**所要時間**: 1時間

---

### タスク2-14: メンターノートAPI（isPrivate → isSharedWithClient対応）

**対象ファイル**: `app/api/mentor/notes/route.ts`, `app/api/mentor/notes/[id]/route.ts`

**修正内容**:

`route.ts` (GET, POST):
```typescript
// L32, L74の isPrivate → isSharedWithClient に変更
isSharedWithClient: isSharedWithClient !== undefined ? isSharedWithClient : false,
```

`[id]/route.ts` (PUT, DELETE):
```typescript
// 同様にisPrivate → isSharedWithClient に変更
```

**所要時間**: 30分

**チェックリスト**:
- [ ] route.ts修正完了
- [ ] [id]/route.ts修正完了
- [ ] TypeScriptコンパイルエラー確認

---

### タスク2-15: 進捗レポートAPI（DB連携）

**対象ファイル**: `app/api/mentor/reports/route.ts`

**現状**: モックデータ返却

**修正内容**: Prismaクエリに置き換え（詳細は省略、パターンは他のAPIと同様）

**所要時間**: 2時間

---

## Week 3: フロントエンド実装（2-3日、合計10-12時間）

### タスク3-1: lib/services/MentorDashboardService.ts 作成

**新規ファイル**: `lib/services/MentorDashboardService.ts`

**実装内容**:
```typescript
// メンターダッシュボード用サービス
// 既存のサービスクラスパターンに従う

import { API_PATHS } from '@/lib/constants';
import type { MentorDashboardData } from '@/types';

class MentorDashboardService {
  /**
   * ダッシュボードデータ取得
   */
  async getDashboardData(): Promise<MentorDashboardData> {
    const response = await fetch(API_PATHS.MENTOR_DASHBOARD, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('ダッシュボードデータの取得に失敗しました');
    }

    return response.json();
  }

  /**
   * クライアント招待
   */
  async inviteClient(clientEmail: string): Promise<void> {
    const response = await fetch(API_PATHS.MENTOR_INVITE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clientEmail }),
    });

    if (!response.ok) {
      throw new Error('招待に失敗しました');
    }
  }
}

export const mentorDashboardService = new MentorDashboardService();
```

**所要時間**: 1時間

---

### タスク3-2: hooks/useMentorDashboard.ts 作成

**新規ファイル**: `hooks/useMentorDashboard.ts`

**実装内容**:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { mentorDashboardService } from '@/lib/services/MentorDashboardService';
import type { MentorDashboardData } from '@/types';

interface UseMentorDashboardReturn {
  data: MentorDashboardData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  inviteClient: (email: string) => Promise<void>;
}

export const useMentorDashboard = (): UseMentorDashboardReturn => {
  const [data, setData] = useState<MentorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await mentorDashboardService.getDashboardData();
      setData(result);
    } catch (err) {
      setError(err as Error);
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const inviteClient = async (email: string) => {
    try {
      await mentorDashboardService.inviteClient(email);
      await fetchData(); // リフレッシュ
    } catch (err) {
      console.error('Invite error:', err);
      setError(err as Error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    inviteClient,
  };
};
```

**所要時間**: 1時間

---

### タスク3-3: lib/services/ClientDetailService.ts 作成

**新規ファイル**: `lib/services/ClientDetailService.ts`

**実装内容**: MentorDashboardServiceと同様のパターン

**所要時間**: 1時間

---

### タスク3-4: hooks/useClientDetail.ts 作成

**新規ファイル**: `hooks/useClientDetail.ts`

**実装内容**: useMentorDashboardと同様のパターン

**所要時間**: 1時間

---

### タスク3-5: components/settings/MentorRegistration.tsx 作成

**新規ファイル**: `components/settings/MentorRegistration.tsx`

**実装内容**:
```typescript
'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { MentorRegistrationForm, MentorExpertise } from '@/types';

interface MentorRegistrationProps {
  isMentor: boolean;
  bio?: string;
  expertise: MentorExpertise[];
  onSave: (form: MentorRegistrationForm) => Promise<void>;
}

export const MentorRegistration: React.FC<MentorRegistrationProps> = ({
  isMentor,
  bio,
  expertise,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<MentorRegistrationForm>({
    isMentor,
    bio,
    expertise,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form);
    setIsEditing(false);
  };

  return (
    <Card className="p-4 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-[var(--text-primary)]">メンター登録</h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-[var(--primary)] hover:underline"
          >
            編集
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit}>
          {/* フォーム実装 */}
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isMentor}
                onChange={(e) => setForm({ ...form, isMentor: e.target.checked })}
              />
              <span className="text-sm text-[var(--text-primary)]">メンターとして登録</span>
            </label>
          </div>

          {form.isMentor && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  自己紹介（500文字以内）
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-[var(--border-color)] rounded-lg text-base text-[var(--text-primary)] transition-colors focus:outline-none focus:border-[var(--primary)]"
                  value={form.bio || ''}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  maxLength={500}
                  rows={4}
                  placeholder="メンターとしての経験や専門分野を入力してください"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  専門分野（複数選択可）
                </label>
                {/* チェックボックス一覧 */}
                {/* 省略 */}
              </div>
            </>
          )}

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              保存
            </Button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 px-4 py-3 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg text-base font-medium hover:bg-[var(--border-dark)] transition-colors"
            >
              キャンセル
            </button>
          </div>
        </form>
      ) : (
        <div className="text-sm text-[var(--text-secondary)]">
          {isMentor ? (
            <>
              <p className="mb-2">メンターとして登録されています</p>
              {bio && <p className="mb-2">{bio}</p>}
              {expertise.length > 0 && (
                <p>専門分野: {expertise.join(', ')}</p>
              )}
            </>
          ) : (
            <p>メンター登録していません</p>
          )}
        </div>
      )}
    </Card>
  );
};
```

**所要時間**: 2時間

---

### タスク3-6: components/settings/DataAccessControl.tsx 作成

**新規ファイル**: `components/settings/DataAccessControl.tsx`

**実装内容**: MentorRegistrationと同様のパターン（複数メンター対応のUIが必要）

**所要時間**: 2時間

---

### タスク3-7: app/(protected)/settings/page.tsx 修正

**対象ファイル**: `app/(protected)/settings/page.tsx`

**修正内容**:
```typescript
// 1. インポート追加
import { MentorRegistration } from '@/components/settings/MentorRegistration';
import { DataAccessControl } from '@/components/settings/DataAccessControl';

// 2. セクション追加（アカウント管理セクションの前）
{/* Mentor Registration Section */}
<section className="px-6 pb-6">
  <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">メンター機能</h2>
  <MentorRegistration
    isMentor={profile?.isMentor || false}
    bio={profile?.bio}
    expertise={profile?.expertise || []}
    onSave={updateMentorProfile}
  />
</section>

{/* Data Access Control Section */}
<section className="px-6 pb-6">
  <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">データアクセス許可</h2>
  <DataAccessControl
    permissions={dataAccessPermissions}
    onUpdate={updateDataAccessPermissions}
  />
</section>
```

**所要時間**: 1時間

---

### タスク3-8: components/layouts/MainLayout.tsx 修正

**対象ファイル**: `components/layouts/MainLayout.tsx`

**修正内容**:
```typescript
// 1. UserDisplay型にroleプロパティ追加
interface MainLayoutProps {
  children: React.ReactNode;
  user?: UserDisplay & { role?: string }; // role追加
}

// 2. navigationItemsを動的生成
const navigationItems = [
  { id: 'home', label: 'ホーム', icon: 'home', href: '/' },
  { id: 'plan-do', label: '計画/実行', icon: 'assignment', href: '/plan-do' },
  { id: 'check-action', label: '確認/改善', icon: 'analytics', href: '/check-action' },
  { id: 'ai-assistant', label: '学習', icon: 'school', href: '/ai-assistant' },
  // メンターロールの場合のみ追加
  ...(user?.role === 'mentor' || user?.isMentor
    ? [{ id: 'mentor', label: 'メンター', icon: 'group', href: '/mentor' }]
    : []),
  { id: 'settings', label: '設定', icon: 'settings', href: '/settings' },
];
```

**所要時間**: 1時間

---

## Week 4: テスト・デバッグ・デプロイ（2-3日、合計8-10時間）

### タスク4-1: E2Eテスト追加

**新規ファイル**: `tests/e2e/mentor-dashboard.spec.ts`, `tests/e2e/client-detail.spec.ts`

**実装内容**: Playwright E2Eテスト（既存のテストパターンに従う）

**所要時間**: 3時間

---

### タスク4-2: 統合テスト

**テスト項目**:
- フェーズ1のクライアント機能に影響がないことを確認
- メンターロールでの動作確認
- データアクセス制御の動作確認

**所要時間**: 2時間

---

### タスク4-3: バグ修正・最適化

**想定される問題**:
- TypeScriptエラー
- Prismaクエリのパフォーマンス問題
- UIの表示崩れ

**所要時間**: 3-5時間

---

## リスク管理

### 高リスク

#### 1. Prismaマイグレーション失敗

**リスク内容**: マイグレーション実行時にエラーが発生し、データベースが破損する

**対策**:
- 必ずバックアップを作成
- テスト環境で先行実行
- `--create-only`オプションで生成されたSQLを事前確認
- ロールバック手順の準備

**ロールバック手順**:
```bash
# バックアップからリストア
psql $DATABASE_URL < backup_before_phase2_migration_YYYYMMDD_HHMMSS.sql

# または、マイグレーションを戻す
npx prisma migrate resolve --rolled-back MIGRATION_NAME
```

---

#### 2. User型変更による型エラー多発

**リスク内容**: UserExtended型削除により、複数箇所で型エラーが発生

**対策**:
- 段階的に修正（まずUser型拡張、次にUserExtended削除）
- TypeScript strict mode活用
- `npm run build`でコンパイルエラー確認
- Grepで影響範囲を事前特定

**影響箇所**:
- `types/index.ts`のみ（UserExtended型の定義削除）
- 他のファイルはUser型の拡張なので互換性あり

---

### 中リスク

#### 3. パフォーマンス問題（N+1クエリ）

**リスク内容**: クライアント数が多い場合、ダッシュボード読み込みが遅延

**対策**:
- Promise.all使用で並列クエリ実行
- Prisma includeでリレーション一括取得
- クエリ最適化（必要なフィールドのみselect）
- インデックス活用

**パフォーマンス目標**:
- 100クライアントでダッシュボード読み込み1秒以内

---

#### 4. データアクセス制御のバグ

**リスク内容**: 権限チェックロジックのバグにより、不正なデータアクセスが可能になる

**対策**:
- lib/mentor-access.tsのユニットテスト徹底
- E2Eテストで権限チェックを確認
- コードレビュー実施

---

## 完了チェックリスト

### 技術的完了条件

- [ ] TypeScriptエラー0件（`npm run build`成功）
- [ ] ビルドエラー0件
- [ ] 全E2Eテストpass
- [ ] Prismaマイグレーション成功（本番環境）
- [ ] パフォーマンス基準達成（ダッシュボード1秒以内）

### 機能的完了条件

- [ ] メンター招待フロー動作確認（pending → active）
- [ ] データアクセス制御動作確認（許可/拒否）
- [ ] 複数メンター対応動作確認
- [ ] クライアント詳細データ表示確認（全タブ）
- [ ] メンターノート作成・編集・削除確認
- [ ] 進捗レポート生成確認

### フェーズ1統合確認

- [ ] 既存のクライアント機能に影響なし
- [ ] User型を使用している箇所が正常動作
- [ ] MainLayoutのナビゲーションが正常動作（ロール判定）
- [ ] 設定ページの既存セクションが正常動作

---

## 見積もりサマリー

| Week | タスク数 | 所要時間 | 主な作業 |
|------|---------|---------|---------|
| Week 1 | 6 | 5-6時間 | 基盤整備（スキーマ、型、マイグレーション、ヘルパー作成） |
| Week 2 | 15 | 16-20時間 | API実装とDB連携（ダッシュボード、クライアント詳細、招待、権限） |
| Week 3 | 8 | 10-12時間 | フロントエンド実装（サービス、フック、コンポーネント、ページ修正） |
| Week 4 | 3 | 8-10時間 | テスト・デバッグ・最適化 |

**合計**: 約40-48時間（5-6日の集中作業）

---

## 新規作成ファイル一覧

### Week 1: 基盤整備

1. `lib/constants.ts` - API_PATHS定数
2. `lib/mentor-access.ts` - データアクセス制御ヘルパー

### Week 2: API実装

3. `app/api/mentor/relationships/route.ts` - 関係一覧
4. `app/api/mentor/invite/route.ts` - クライアント招待
5. `app/api/mentor/relationships/[id]/accept/route.ts` - 招待承認
6. `app/api/mentor/relationships/[id]/terminate/route.ts` - 関係終了
7. `app/api/mentor/client/[id]/route.ts` - クライアント詳細
8. `app/api/client/data-access/route.ts` - アクセス許可設定取得・更新

### Week 3: フロントエンド実装

9. `lib/services/MentorDashboardService.ts` - メンターダッシュボードサービス
10. `lib/services/ClientDetailService.ts` - クライアント詳細サービス
11. `hooks/useMentorDashboard.ts` - メンターダッシュボードフック
12. `hooks/useClientDetail.ts` - クライアント詳細フック
13. `components/settings/MentorRegistration.tsx` - メンター登録コンポーネント
14. `components/settings/DataAccessControl.tsx` - データアクセス許可コンポーネント

### Week 4: テスト

15. `tests/e2e/mentor-dashboard.spec.ts` - メンターダッシュボードE2Eテスト
16. `tests/e2e/client-detail.spec.ts` - クライアント詳細E2Eテスト
17. `lib/mentor-access.test.ts` - データアクセス制御ユニットテスト（推奨）

**合計**: 17ファイル

---

## 既存ファイル修正一覧

### Week 1: 基盤整備

1. `prisma/schema.prisma` - MentorNote.isPrivate → isSharedWithClient、デフォルト値変更
2. `types/index.ts` - User型拡張、UserExtended削除

### Week 2: API実装

3. `app/api/mentor/dashboard/route.ts` - モック→DB連携
4. `app/api/mentor/notes/route.ts` - isPrivate → isSharedWithClient
5. `app/api/mentor/notes/[id]/route.ts` - isPrivate → isSharedWithClient
6. `app/api/mentor/reports/route.ts` - モック→DB連携

### Week 3: フロントエンド実装

7. `app/(protected)/settings/page.tsx` - 新規セクション追加
8. `components/layouts/MainLayout.tsx` - メンターリンク追加、ロール判定

**合計**: 8ファイル

---

## 実装順序の推奨

1. **Week 1 (基盤整備)** を完全に完了してから Week 2 に進む
2. **Prismaマイグレーション** はテスト環境で先行実行
3. **API実装** は依存関係の少ないものから（関係一覧 → 招待 → 承認 → クライアント詳細）
4. **フロントエンド** はサービス → フック → コンポーネント → ページの順
5. **テスト** は機能実装と並行して作成

---

**実装計画完**

**最終更新**: 2025-11-02
