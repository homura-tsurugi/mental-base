# フェーズ2要件理解検証レポート

**作成日**: 2025-11-02
**対象**: Mental-Base フェーズ2メンター機能の残タスク（15%）
**目的**: フェーズ1統合前の要件整合性確認

---

## ✅ 明確に理解できた要件

### 1. Prismaマイグレーション

#### 対象モデル
Prismaスキーマには6つの新規モデルと、Userモデルへの拡張が含まれます：

**新規モデル（6つ）:**
1. `MentorClientRelationship` - メンター-クライアント関係
2. `ClientDataAccessPermission` - データアクセス権限
3. `ClientDataViewLog` - データ閲覧監査ログ
4. `MentorNote` - メンターノート
5. `ClientProgressReport` - クライアント進捗レポート

**既存モデル拡張（User）:**
- `role`: String (デフォルト: "client")
- `isMentor`: Boolean (デフォルト: false)
- `bio`: String? (テキスト、任意)
- `expertise`: String[] (配列、デフォルト: [])

#### 後方互換性の分析
**✅ 互換性あり:**
- 新規フィールドはすべてデフォルト値を持つ
- `role`のデフォルトは"client"（既存ユーザーに影響なし）
- `isMentor`のデフォルトはfalse（既存ユーザーに影響なし）
- `bio`と`expertise`は任意フィールド

**既存のフェーズ1テーブルとの関係:**
- フェーズ1のschema（`prisma/manual-migration.sql`）にはメンター機能フィールドが存在しない
- 現在のPrismaスキーマ（`prisma/schema.prisma`）にはすべてのフィールドが定義済み
- **重要**: `prisma/migrations/`ディレクトリが存在しない → マイグレーション未実行

#### マイグレーション実行時のリスク

**リスク1: データ型の不一致**
- 手動SQLと自動マイグレーションで型定義が異なる可能性
- 例: Prismaの`String[]`はPostgreSQLの`TEXT[]`にマッピングされる

**リスク2: インデックスの重複**
- 既存テーブルに手動でインデックスを追加している場合、Prismaマイグレーションと競合する可能性

**リスク3: 外部キー制約**
- `MentorClientRelationship`の`@@unique([mentorId, clientId])`が重要
- これにより1対多の関係（1メンター：複数クライアント、1クライアント：複数メンター）が保証される

**推奨実行手順:**
```bash
# 1. 現在のスキーマをバックアップ
pg_dump DATABASE_URL > backup_before_migration.sql

# 2. Prisma Migrateで差分を確認
npx prisma migrate dev --name phase2_mentor_features --create-only

# 3. 生成されたマイグレーションSQLを確認
cat prisma/migrations/YYYYMMDDHHMMSS_phase2_mentor_features/migration.sql

# 4. 問題なければ適用
npx prisma migrate deploy
```

---

### 2. lib/mentor-access.ts

#### 現状確認
**❌ ファイルは存在しない**

要件定義書（`docs/requirements_mentor.md`）のセクション「複合処理-005: クライアント詳細データ取得」に以下の記載あり:

> **バックエンド内部処理**:
> 1. メンター-クライアント関係を確認（MentorClientRelationship）
> 2. データアクセス権限を取得（ClientDataAccessPermission）
> 3. 許可されているデータのみ取得
> 4. 閲覧ログを記録（ClientDataViewLog）

#### 期待される関数仕様

**`checkDataAccess()` 関数:**
```typescript
/**
 * データアクセス権限の確認
 *
 * @param mentorId - メンターのユーザーID
 * @param clientId - クライアントのユーザーID
 * @param dataType - データタイプ（'goals' | 'tasks' | 'logs' | 'reflections' | 'ai_reports'）
 * @returns Promise<boolean> - アクセス許可の有無
 * @throws {Error} - 関係が存在しない、または無効な場合
 */
async function checkDataAccess(
  mentorId: string,
  clientId: string,
  dataType: 'goals' | 'tasks' | 'logs' | 'reflections' | 'ai_reports'
): Promise<boolean>
```

**処理フロー:**
1. `MentorClientRelationship`テーブルで関係を検索
   - `WHERE mentorId = ? AND clientId = ? AND status = 'active'`
2. 関係が存在しない場合 → `throw new Error('No active relationship found')`
3. `ClientDataAccessPermission`を`relationshipId`で取得
4. `isActive = true`かつ該当の`allowXxx = true`を確認
5. 結果を返す

**`logDataView()` 関数:**
```typescript
/**
 * データ閲覧ログの記録（GDPR対応）
 *
 * @param mentorId - メンターのユーザーID
 * @param clientId - クライアントのユーザーID
 * @param dataType - データタイプ
 * @param dataId - 閲覧したデータのID
 * @param action - アクション（'view' | 'export'）
 * @returns Promise<void>
 */
async function logDataView(
  mentorId: string,
  clientId: string,
  dataType: 'goal' | 'task' | 'log' | 'reflection' | 'ai_report',
  dataId: string,
  action: 'view' | 'export'
): Promise<void>
```

**処理フロー:**
1. `ClientDataViewLog`レコードを作成
2. DBに挿入（トランザクション不要、非同期で実行可能）
3. エラーは静かに記録（ログ失敗でメイン処理を止めない）

#### 使用箇所
- `app/api/mentor/client/[id]/route.ts` (GET) - クライアント詳細取得時
- `app/api/mentor/client/[id]/goals/route.ts` (GET) - 目標一覧取得時
- `app/api/mentor/client/[id]/tasks/route.ts` (GET) - タスク一覧取得時
- `app/api/mentor/client/[id]/logs/route.ts` (GET) - ログ一覧取得時
- `app/api/mentor/client/[id]/reflections/route.ts` (GET) - 振り返り一覧取得時
- `app/api/mentor/client/[id]/ai-reports/route.ts` (GET) - AI分析レポート一覧取得時

#### エラーケース処理

| エラーケース | HTTPステータス | レスポンス |
|------------|--------------|----------|
| メンター-クライアント関係が存在しない | 403 | `{ error: 'Access denied', detail: 'No active relationship found' }` |
| 関係がterminatedステータス | 403 | `{ error: 'Access denied', detail: 'Relationship has been terminated' }` |
| データアクセス許可が存在しない | 403 | `{ error: 'Access denied', detail: 'No permission granted' }` |
| 該当データタイプの許可がfalse | 403 | `{ error: 'Access denied', detail: 'Permission not granted for this data type' }` |
| 無効なdataType | 400 | `{ error: 'Invalid data type' }` |

---

### 3. API DB連携移行

#### 現在のモック実装分析

**`app/api/mentor/dashboard/route.ts`:**
```typescript
// 現在のモックデータ構造
const mockData = {
  statistics: {
    totalClients: 8,
    activeClients: 6,
    needsFollowUp: 2,
    averageProgress: 68.5,
  },
  clients: [
    {
      clientId: 'client-001',
      name: '田中 太郎',
      email: 'tanaka@example.com',
      avatarUrl: null,
      overallProgress: 85,
      lastActivityDate: new Date(...).toISOString(),
      status: 'on_track',
      relationshipId: 'rel-001',
    },
    // ...
  ],
};
```

**必要なPrismaクエリ（MDS-001: メンターダッシュボードデータ生成）:**

```typescript
// Step 1: 担当クライアント一覧取得
const relationships = await prisma.mentorClientRelationship.findMany({
  where: {
    mentorId: session.userId,
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
});

// Step 2: 各クライアントの進捗計算（並列処理）
const clientsData = await Promise.all(
  relationships.map(async (rel) => {
    const clientId = rel.clientId;

    // 最終活動日の計算
    const [latestLog, latestTask, latestReflection] = await Promise.all([
      prisma.log.findFirst({
        where: { userId: clientId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
      prisma.task.findFirst({
        where: { userId: clientId },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      prisma.reflection.findFirst({
        where: { userId: clientId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    const lastActivityDate = [
      latestLog?.createdAt,
      latestTask?.updatedAt,
      latestReflection?.createdAt,
    ].filter(Boolean).sort((a, b) => b - a)[0] || rel.acceptedAt;

    // 総合進捗率の計算
    const [goals, tasks] = await Promise.all([
      prisma.goal.findMany({
        where: { userId: clientId },
        select: { status: true },
      }),
      prisma.task.findMany({
        where: { userId: clientId },
        select: { status: true },
      }),
    ]);

    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const totalGoals = goals.length || 1;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.length || 1;
    const overallProgress = Math.round(((completedGoals / totalGoals) + (completedTasks / totalTasks)) / 2 * 100);

    // ステータス判定
    const daysSinceLastActivity = Math.floor((Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
    let status: ClientStatus;
    if (daysSinceLastActivity <= 3) {
      status = 'on_track';
    } else if (daysSinceLastActivity <= 7) {
      status = 'stagnant';
    } else {
      status = 'needs_followup';
    }

    return {
      clientId,
      name: rel.client.name,
      email: rel.client.email,
      avatarUrl: null,
      overallProgress,
      lastActivityDate,
      status,
      relationshipId: rel.id,
    };
  })
);

// Step 3: 統計サマリー集計
const statistics = {
  totalClients: clientsData.length,
  activeClients: clientsData.filter(c => {
    const daysSince = Math.floor((Date.now() - c.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSince <= 7;
  }).length,
  needsFollowUp: clientsData.filter(c => c.status === 'needs_followup').length,
  averageProgress: Math.round(clientsData.reduce((sum, c) => sum + c.overallProgress, 0) / clientsData.length),
};

return { statistics, clients: clientsData };
```

**パフォーマンス考慮（N+1問題対策）:**
- ❌ 避けるべき: 各クライアントごとにループで個別クエリ
- ✅ 推奨: `Promise.all()`で並列処理
- ✅ 推奨: `include`句でリレーションを一度に取得
- ⚠️ 注意: クライアント数が100人超える場合はページネーション必須

---

**`app/api/mentor/client/[id]/route.ts`:**

**現在のモック:**
```typescript
const mockData = {
  clientInfo: {
    id: clientId,
    name: getClientName(clientId),
    email: `${clientId}@example.com`,
    registeredAt: new Date(2024, 9, 1).toISOString(),
    relationshipStartDate: new Date(2024, 10, 1).toISOString(),
    overallProgress: Math.floor(Math.random() * 100),
  },
  permissions: {
    allowGoals: false,
    allowTasks: false,
    allowLogs: false,
    allowReflections: false,
    allowAiReports: false,
  },
  progressData: {
    goals: [],
    tasks: [],
    logs: [],
    reflections: [],
    aiReports: [],
  },
  mentorNotes: [],
};
```

**必要なPrismaクエリ（CDD-001: クライアント詳細データ取得）:**

```typescript
import { checkDataAccess, logDataView } from '@/lib/mentor-access';

// Step 1: メンター-クライアント関係確認
const relationship = await prisma.mentorClientRelationship.findFirst({
  where: {
    mentorId: session.userId,
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
      where: { isActive: true },
    },
  },
});

if (!relationship) {
  return NextResponse.json({ error: 'Access denied' }, { status: 403 });
}

const permissions = relationship.accessPermissions[0] || {
  allowGoals: false,
  allowTasks: false,
  allowLogs: false,
  allowReflections: false,
  allowAiReports: false,
};

// Step 2: 許可されたデータを取得
const progressData: any = {
  goals: [],
  tasks: [],
  logs: [],
  reflections: [],
  aiReports: [],
};

if (permissions.allowGoals) {
  progressData.goals = await prisma.goal.findMany({
    where: { userId: clientId },
    include: { tasks: true },
  });
  // ログ記録（非同期、エラーハンドリング不要）
  progressData.goals.forEach(goal => {
    logDataView(session.userId, clientId, 'goal', goal.id, 'view').catch(console.error);
  });
}

if (permissions.allowTasks) {
  progressData.tasks = await prisma.task.findMany({
    where: { userId: clientId },
    include: { goal: { select: { title: true } } },
  });
  progressData.tasks.forEach(task => {
    logDataView(session.userId, clientId, 'task', task.id, 'view').catch(console.error);
  });
}

if (permissions.allowLogs) {
  progressData.logs = await prisma.log.findMany({
    where: { userId: clientId },
    orderBy: { createdAt: 'desc' },
    take: 50, // 最新50件
  });
  progressData.logs.forEach(log => {
    logDataView(session.userId, clientId, 'log', log.id, 'view').catch(console.error);
  });
}

if (permissions.allowReflections) {
  progressData.reflections = await prisma.reflection.findMany({
    where: { userId: clientId },
    orderBy: { createdAt: 'desc' },
  });
  progressData.reflections.forEach(reflection => {
    logDataView(session.userId, clientId, 'reflection', reflection.id, 'view').catch(console.error);
  });
}

if (permissions.allowAiReports) {
  progressData.aiReports = await prisma.aIAnalysisReport.findMany({
    where: { userId: clientId },
    orderBy: { createdAt: 'desc' },
  });
  progressData.aiReports.forEach(report => {
    logDataView(session.userId, clientId, 'ai_report', report.id, 'view').catch(console.error);
  });
}

// Step 3: メンターノート取得
const mentorNotes = await prisma.mentorNote.findMany({
  where: {
    mentorId: session.userId,
    clientId,
  },
  orderBy: { createdAt: 'desc' },
});

// Step 4: クライアント情報構築
const clientInfo = {
  id: relationship.client.id,
  name: relationship.client.name,
  email: relationship.client.email,
  registeredAt: relationship.client.createdAt,
  relationshipStartDate: relationship.acceptedAt || relationship.invitedAt,
  overallProgress: calculateOverallProgress(progressData),
  status: determineClientStatus(progressData),
};

return NextResponse.json({
  clientInfo,
  permissions,
  progressData,
  mentorNotes,
});
```

**パフォーマンス最適化:**
- データアクセス権限の並列チェックは不要（1回のクエリで取得済み）
- ログ記録は`Promise.all()`でまとめて非同期実行（メインレスポンスをブロックしない）
- 大量データは`take`でリミット設定（例: ログは最新50件のみ）

---

### 4. C-005-EXT（設定ページ拡張）

#### 要件定義書の記載（セクション3.4）

**追加機能:**
1. メンター登録セクション
2. データアクセス許可設定セクション

#### 詳細仕様

**メンター登録セクション:**
- **表示条件**: すべてのユーザーに表示
- **UI要素**:
  - 「メンターとして登録する」トグルスイッチ
  - 自己紹介（bio）テキストエリア（500文字以内）
  - 専門分野（expertise）マルチセレクト
    - 選択肢: `['career', 'mental_health', 'learning', 'life_coaching', 'health_wellness', 'entrepreneurship', 'other']`
    - 日本語ラベル: キャリア、メンタルヘルス、学習、ライフコーチング、健康・ウェルネス、起業・ビジネス、その他
  - 保存ボタン

**データアクセス許可設定セクション:**
- **表示条件**: `user.role === 'CLIENT'` かつ 担当メンターが存在する場合のみ表示
- **UI要素**:
  - セクションタイトル: "メンターへのデータ公開設定"
  - チェックボックス群:
    - ☑ 目標（Goals）
    - ☑ タスク（Tasks）
    - ☑ ログ（Logs）
    - ☑ 振り返り（Reflections）
    - ☑ AI分析レポート
  - 保存ボタン
  - 注意書き: 「メンターがあなたのデータを閲覧すると、閲覧ログが記録されます」

#### 既存ページとの統合方法

**現在の設定ページ構成（`app/(protected)/settings/page.tsx`）:**
1. プロフィールセクション
2. パスワード変更セクション
3. 通知設定セクション
4. アカウント管理セクション（Danger Zone）

**統合プラン:**
```typescript
// 新規追加位置: 通知設定セクションの直後、アカウント管理セクションの前

{/* Mentor Registration Section - フェーズ2追加 */}
<section className="px-6 pb-6">
  <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">メンター登録</h2>

  <Card className="p-4 shadow-md">
    {/* トグルスイッチ */}
    <div className="flex items-center justify-between py-3 border-b border-[var(--border-color)]">
      <div>
        <div className="text-base font-medium text-[var(--text-primary)]">メンターとして登録</div>
        <div className="text-sm text-[var(--text-tertiary)] mt-1">
          クライアントの成長を支援するメンターとして活動する
        </div>
      </div>
      <label className="relative inline-block w-12 h-7 flex-shrink-0">
        <input
          type="checkbox"
          checked={isMentor}
          onChange={handleMentorToggle}
          className="opacity-0 w-0 h-0 peer"
        />
        <span className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-[var(--border-dark)] transition-all rounded-full peer-checked:bg-[var(--primary)] before:absolute before:content-[''] before:h-5 before:w-5 before:left-1 before:bottom-1 before:bg-white before:transition-all before:rounded-full peer-checked:before:translate-x-5"></span>
      </label>
    </div>

    {/* isMentor=trueの場合のみ表示 */}
    {isMentor && (
      <>
        {/* 自己紹介 */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            自己紹介（500文字以内）
          </label>
          <textarea
            value={mentorBio}
            onChange={(e) => setMentorBio(e.target.value)}
            maxLength={500}
            rows={4}
            className="w-full px-4 py-3 border border-[var(--border-color)] rounded-lg text-base text-[var(--text-primary)] transition-colors focus:outline-none focus:border-[var(--primary)] resize-none"
            placeholder="あなたの専門分野や、クライアントをサポートする際の姿勢について記入してください"
          />
          <div className="text-xs text-[var(--text-tertiary)] text-right mt-1">
            {mentorBio.length} / 500文字
          </div>
        </div>

        {/* 専門分野 */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            専門分野（複数選択可）
          </label>
          <div className="grid grid-cols-2 gap-2">
            {EXPERTISE_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-2 p-2 border border-[var(--border-color)] rounded-lg cursor-pointer hover:bg-[var(--bg-tertiary)]">
                <input
                  type="checkbox"
                  checked={expertise.includes(option.value)}
                  onChange={() => handleExpertiseToggle(option.value)}
                  className="w-4 h-4 text-[var(--primary)] border-[var(--border-color)] rounded focus:ring-[var(--primary)]"
                />
                <span className="text-sm text-[var(--text-primary)]">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 保存ボタン */}
        <Button
          onClick={handleMentorRegistrationSave}
          className="w-full mt-4"
        >
          <span className="material-icons text-lg mr-2">save</span>
          メンター情報を保存
        </Button>
      </>
    )}
  </Card>
</section>

{/* Data Access Permission Section - フェーズ2追加 */}
{/* user.role === 'CLIENT' かつ hasMentor=true の場合のみ表示 */}
{user?.role === 'CLIENT' && hasMentor && (
  <section className="px-6 pb-6">
    <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">メンターへのデータ公開設定</h2>

    <Card className="p-4 shadow-md">
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        担当メンターに公開するデータを選択してください。メンターがデータを閲覧すると、閲覧ログが記録されます。
      </p>

      <div className="space-y-3">
        {DATA_ACCESS_OPTIONS.map((option) => (
          <label key={option.key} className="flex items-center justify-between py-2 border-b border-[var(--border-color)] last:border-b-0 cursor-pointer">
            <div>
              <div className="text-base font-medium text-[var(--text-primary)]">{option.label}</div>
              <div className="text-xs text-[var(--text-tertiary)] mt-1">{option.description}</div>
            </div>
            <input
              type="checkbox"
              checked={dataAccessPermissions[option.key]}
              onChange={() => handleDataAccessToggle(option.key)}
              className="w-5 h-5 text-[var(--primary)] border-[var(--border-color)] rounded focus:ring-[var(--primary)]"
            />
          </label>
        ))}
      </div>

      <Button
        onClick={handleDataAccessSave}
        className="w-full mt-4"
      >
        <span className="material-icons text-lg mr-2">save</span>
        データ公開設定を保存
      </Button>
    </Card>
  </section>
)}
```

**必要な状態管理:**
```typescript
// 新規state
const [isMentor, setIsMentor] = useState(false);
const [mentorBio, setMentorBio] = useState('');
const [expertise, setExpertise] = useState<MentorExpertise[]>([]);
const [hasMentor, setHasMentor] = useState(false);
const [dataAccessPermissions, setDataAccessPermissions] = useState({
  allowGoals: false,
  allowTasks: false,
  allowLogs: false,
  allowReflections: false,
  allowAiReports: false,
});

// 定数
const EXPERTISE_OPTIONS = [
  { value: 'career', label: 'キャリア' },
  { value: 'mental_health', label: 'メンタルヘルス' },
  { value: 'learning', label: '学習' },
  { value: 'life_coaching', label: 'ライフコーチング' },
  { value: 'health_wellness', label: '健康・ウェルネス' },
  { value: 'entrepreneurship', label: '起業・ビジネス' },
  { value: 'other', label: 'その他' },
];

const DATA_ACCESS_OPTIONS = [
  { key: 'allowGoals', label: '目標（Goals）', description: 'あなたの目標と進捗状況' },
  { key: 'allowTasks', label: 'タスク（Tasks）', description: 'タスクの実行状況' },
  { key: 'allowLogs', label: 'ログ（Logs）', description: '日々の活動記録' },
  { key: 'allowReflections', label: '振り返り（Reflections）', description: '週次・月次の振り返り内容' },
  { key: 'allowAiReports', label: 'AI分析レポート', description: 'AIによる分析結果と推奨事項' },
];
```

**API連携:**
```typescript
// メンター登録保存
const handleMentorRegistrationSave = async () => {
  try {
    await fetch('/api/user/mentor-registration', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isMentor, bio: mentorBio, expertise }),
    });
    setSuccessMessage('メンター情報を保存しました');
  } catch (err) {
    setFormError('保存に失敗しました');
  }
};

// データアクセス許可保存
const handleDataAccessSave = async () => {
  try {
    await fetch('/api/client/data-access', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataAccessPermissions),
    });
    setSuccessMessage('データ公開設定を保存しました');
  } catch (err) {
    setFormError('保存に失敗しました');
  }
};
```

---

### 5. カスタムフック

#### 既存パターン分析

**既存フック（`hooks/useDashboardData.ts`）のパターン:**
```typescript
export const useDashboardData = (): UseDashboardDataReturn => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await dashboardService.getDashboardData();
      setData(result);
    } catch (err) {
      setError(err as Error);
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
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
    // 追加メソッド
    toggleTaskComplete,
  };
};
```

**共通パターン:**
1. `data`, `loading`, `error`の3つのstate
2. `fetchData()`関数でAPI呼び出し
3. `useEffect()`で初回ロード
4. `refetch()`関数を公開
5. ドメイン固有のメソッド（例: `toggleTaskComplete`）

#### 新規フック仕様

**`hooks/useMentorDashboard.ts`:**
```typescript
import { useState, useEffect } from 'react';
import { MentorDashboardData } from '@/types';

interface UseMentorDashboardReturn {
  data: MentorDashboardData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  filterClients: (filter: ClientFilterType) => void;
  sortClients: (sortBy: ClientSortOrder) => void;
  searchClients: (query: string) => void;
}

export const useMentorDashboard = (): UseMentorDashboardReturn => {
  const [data, setData] = useState<MentorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filter, setFilter] = useState<ClientFilterType>('all');
  const [sortBy, setSortBy] = useState<ClientSortOrder>('progress');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/mentor/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const result = await response.json();

      // フィルター・ソート・検索を適用
      const filteredClients = applyFilters(result.clients, filter, sortBy, searchQuery);
      setData({ ...result, clients: filteredClients });
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const filterClients = (newFilter: ClientFilterType) => {
    setFilter(newFilter);
  };

  const sortClients = (newSortBy: ClientSortOrder) => {
    setSortBy(newSortBy);
  };

  const searchClients = (query: string) => {
    setSearchQuery(query);
  };

  useEffect(() => {
    fetchData();
  }, [filter, sortBy, searchQuery]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    filterClients,
    sortClients,
    searchClients,
  };
};

// ヘルパー関数
function applyFilters(
  clients: ClientSummary[],
  filter: ClientFilterType,
  sortBy: ClientSortOrder,
  searchQuery: string
): ClientSummary[] {
  let filtered = [...clients];

  // フィルター適用
  if (filter !== 'all') {
    filtered = filtered.filter(c => c.status === filter);
  }

  // 検索適用
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query)
    );
  }

  // ソート適用
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'progress':
        return b.overallProgress - a.overallProgress;
      case 'last_activity':
        return b.lastActivityDate.getTime() - a.lastActivityDate.getTime();
      case 'name':
        return a.name.localeCompare(b.name, 'ja');
      default:
        return 0;
    }
  });

  return filtered;
}
```

**`hooks/useClientDetail.ts`:**
```typescript
import { useState, useEffect } from 'react';
import { ClientDetailData, MentorNote, ClientProgressReport } from '@/types';

interface UseClientDetailReturn {
  data: ClientDetailData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createNote: (note: MentorNoteForm) => Promise<void>;
  updateNote: (noteId: string, updates: Partial<MentorNoteForm>) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  generateReport: (reportForm: ClientProgressReportForm) => Promise<void>;
}

export const useClientDetail = (clientId: string): UseClientDetailReturn => {
  const [data, setData] = useState<ClientDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/mentor/client/${clientId}`);
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('このクライアントのデータにアクセスする権限がありません');
        }
        throw new Error('データの取得に失敗しました');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const createNote = async (note: MentorNoteForm) => {
    try {
      const response = await fetch('/api/mentor/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...note, clientId }),
      });
      if (!response.ok) throw new Error('ノートの作成に失敗しました');
      await fetchData(); // データをリフレッシュ
    } catch (err) {
      throw err;
    }
  };

  const updateNote = async (noteId: string, updates: Partial<MentorNoteForm>) => {
    try {
      const response = await fetch(`/api/mentor/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('ノートの更新に失敗しました');
      await fetchData();
    } catch (err) {
      throw err;
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const response = await fetch(`/api/mentor/notes/${noteId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('ノートの削除に失敗しました');
      await fetchData();
    } catch (err) {
      throw err;
    }
  };

  const generateReport = async (reportForm: ClientProgressReportForm) => {
    try {
      const response = await fetch('/api/mentor/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reportForm, clientId }),
      });
      if (!response.ok) throw new Error('レポートの生成に失敗しました');
      await fetchData();
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchData();
    }
  }, [clientId]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    createNote,
    updateNote,
    deleteNote,
    generateReport,
  };
};
```

---

## ⚠️ 確認が必要な曖昧点

### 1. 招待・承認フローの方向性

**質問**: メンター-クライアント関係の招待は誰が誰を招待しますか？

**背景分析:**
- Prismaスキーマ: `MentorClientRelationship`モデルに`invitedBy: String`フィールドあり
- 要件定義書: 「クライアントへの招待（簡易実装）」との記載（セクション2.2、メンターの機能）
- 現在の実装: 招待フロー未実装

**選択肢:**

**A) メンターがクライアントを招待（メンター主導）**
- メリット: メンターが積極的にクライアントを募集できる
- デメリット: クライアント側のプライバシー懸念
- 実装: メンターがクライアントのメールアドレスを入力 → 招待メール送信 → クライアントが承認

**B) クライアントがメンターを招待（クライアント主導）**
- メリット: クライアントが主導権を持つ（プライバシー保護）
- デメリット: メンターの発見性が低い（メンター検索機能が必要）
- 実装: クライアントがメンター検索 → 招待リクエスト → メンターが承認

**C) 双方向の招待が可能（柔軟）**
- メリット: 最も柔軟、両方のニーズに対応
- デメリット: 実装が複雑、UIが煩雑になる可能性
- 実装: 両方向の招待フローをサポート

**推奨**: **A) メンターがクライアントを招待（メンター主導）**

**理由:**
1. 要件定義書の記載「クライアントへの招待（簡易実装）」はメンター主導を示唆
2. MVPとしてシンプルな実装が望ましい
3. COM:PASSのユースケース: メンターは既存のクライアント（COM:PASS利用者）に声をかけることが多い
4. フェーズ3でクライアント主導の検索機能を追加可能

**実装方針:**
- メンターダッシュボードに「クライアント招待」ボタン配置
- メールアドレス入力 → `POST /api/mentor/invite { email: "client@example.com" }`
- 招待リンク生成（例: `/mentor/accept?token=xxx`）
- クライアントがリンクをクリック → 承認 → `status: 'active'`に変更

---

### 2. データアクセス許可のデフォルト

**質問**: 新しくメンター-クライアント関係が成立した際、データアクセス許可のデフォルト設定は？

**背景分析:**
- Prismaスキーマ: `ClientDataAccessPermission`の各フィールドは`@default(false)`
- 要件定義書: 明示的な記載なし
- 現在のモック実装: すべて`false`

**選択肢:**

**A) 全て拒否（クライアントが個別に許可）**
- メリット: プライバシー最優先、GDPR準拠
- デメリット: クライアントが手動で許可する必要（摩擦）
- UX: 関係成立後、クライアントに「データ公開設定をしてください」と通知

**B) 全て許可（クライアントが個別に拒否）**
- メリット: スムーズな利用開始、メンターがすぐにサポート可能
- デメリット: クライアントが意図せずデータを公開する可能性
- UX: 関係成立時に「デフォルトで全データを公開しますが、設定で変更できます」と通知

**C) 招待時にメンターが希望を提示、クライアントが承認時に決定**
- メリット: 透明性が高い、双方が納得した上で関係開始
- デメリット: 実装が複雑、承認フローが長い
- UX: 招待時にメンターが「目標とタスクの閲覧を希望」と記載 → クライアントが承認時に選択

**推奨**: **A) 全て拒否（クライアントが個別に許可）**

**理由:**
1. プライバシー保護がMVPの重要な要件（GDPR対応、閲覧ログ記録）
2. クライアントが安心して関係を開始できる
3. デフォルトで許可した場合、後で取り消すのは心理的に難しい
4. 設定ページで簡単に許可できる（UI改善で摩擦を最小化）

**実装方針:**
- 関係成立時、`ClientDataAccessPermission`レコードを自動作成（すべて`false`）
- クライアントに通知: 「メンターとの関係が成立しました。設定ページでデータ公開範囲を選択してください」
- M-002（クライアント詳細）でメンターが「データアクセス許可がありません」メッセージを表示
- クライアントが許可を与えると、メンターに通知: 「クライアント○○があなたに△△のデータアクセスを許可しました」

---

### 3. クライアントの複数メンター保持

**質問**: 1人のクライアントが複数のメンターから支援を受けることは可能ですか？

**背景分析:**
- Prismaスキーマ: `MentorClientRelationship`に`@@unique([mentorId, clientId])`制約
  - これは「同じメンター-クライアントのペアは1つのみ」を意味
  - 1人のクライアントが複数のメンターを持つことは**可能**
- 要件定義書: 「1対多（1メンター：複数クライアント）」の記載のみ（クライアント側の制限は明記なし）

**選択肢:**

**A) 不可（1対1のみ）**
- メリット: シンプルな関係性、責任の所在が明確
- デメリット: 柔軟性が低い、クライアントがメンターを変更したい場合に不便
- 実装: `clientId`に`@unique`制約を追加

**B) 可能（1対多）**
- メリット: 柔軟性が高い、異なる専門分野のメンターから支援を受けられる
- デメリット: データアクセス権限の管理が複雑化
- 実装: 現在のスキーマのまま（`@@unique([mentorId, clientId])`のみ）

**現在の実装**: Prismaスキーマは**B) 可能（1対多）**をサポート

**推奨**: **B) 可能（1対多）**を維持

**理由:**
1. 現在のスキーマ設計がすでにこれをサポートしている
2. ユースケース: クライアントが「キャリア」と「メンタルヘルス」の2つの専門分野でサポートが欲しい
3. 柔軟性が高く、将来の拡張性に優れる
4. データアクセス権限は`ClientDataAccessPermission`で個別管理できるため、複雑化の懸念は小さい

**確認事項**: これが意図した設計であることをユーザーに確認する必要あり

**実装上の注意:**
- 設定ページのデータアクセス許可セクション: 複数のメンターがいる場合、メンターごとに個別設定可能にする
- UI例:
  ```
  メンターA（キャリア専門）
    ☑ 目標  ☑ タスク  ☐ ログ  ☐ 振り返り  ☐ AI分析レポート

  メンターB（メンタルヘルス専門）
    ☐ 目標  ☐ タスク  ☑ ログ  ☑ 振り返り  ☑ AI分析レポート
  ```

---

### 4. メンターノートの`isPrivate`フィールド名の不整合

**質問**: `MentorNote`の公開/非公開フィールドの名前が型定義とスキーマで異なります。

**背景:**
- Prismaスキーマ: `isPrivate Boolean @default(true)` (line 341)
- types/index.ts: `isSharedWithClient: boolean` (line 715, 728)

**不整合の詳細:**
- Prismaでは`isPrivate: true`が「非公開（メンターのみ閲覧）」
- types/index.tsでは`isSharedWithClient: true`が「公開（クライアントと共有）」
- 論理が逆転している（`isPrivate`と`isSharedWithClient`は反対の意味）

**選択肢:**

**A) Prismaスキーマを修正（`isPrivate` → `isSharedWithClient`）**
- メリット: types/index.tsと一貫性が保たれる、「共有」という概念がわかりやすい
- デメリット: スキーマ変更が必要（マイグレーション）

**B) types/index.tsを修正（`isSharedWithClient` → `isPrivate`）**
- メリット: スキーマ変更不要、シンプルな修正
- デメリット: UIで「非公開」というネガティブな表現になる

**C) マッピング関数を作成（型変換時に変換）**
- メリット: 両方の定義を維持できる
- デメリット: 変換ロジックが複雑化、バグの温床

**推奨**: **A) Prismaスキーマを修正**

**理由:**
1. `isSharedWithClient`の方が意図が明確（「クライアントと共有するか」）
2. UIでポジティブな表現（「共有する」）の方がUX的に良い
3. types/index.tsは14箇所で既に`isSharedWithClient`を使用している
4. マイグレーションはまだ実行されていないため、変更のコストは低い

**修正内容:**
```prisma
model MentorNote {
  // ...
  isSharedWithClient Boolean @default(false) // 修正: isPrivateから変更、デフォルトをfalseに
  // ...
}
```

**ロジックの変更:**
- 旧: `isPrivate: true` → メンターのみ閲覧
- 新: `isSharedWithClient: false` → メンターのみ閲覧（同じ意味、表現が明確）

---

### 5. `ClientProgressReport`の`isSharedWithClient`フィールドの整合性

**質問**: 進捗レポートの共有フィールドもメンターノートと同様の検証が必要です。

**背景:**
- Prismaスキーマ: `isSharedWithClient Boolean @default(false)` (line 377)
- types/index.ts: `isSharedWithClient: boolean` (line 753)

**✅ 問題なし**: こちらは一貫性あり

---

### 6. API_PATHSの定義場所

**質問**: APIエンドポイントの定数（API_PATHS）はどこに定義されていますか？

**調査結果:**
- `lib/`ディレクトリに`API_PATHS`や`API_ENDPOINTS`の定義が見つからない
- 既存のコードではハードコードでエンドポイントを指定している

**推奨**: 定数ファイルを作成

**実装:**
```typescript
// lib/constants.ts（新規作成）

export const API_PATHS = {
  // 認証
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
  },

  // クライアント機能
  DASHBOARD: '/api/dashboard',
  GOALS: '/api/goals',
  TASKS: '/api/tasks',
  LOGS: '/api/logs',
  REFLECTIONS: '/api/reflections',
  AI_ANALYSIS: '/api/analysis',
  CHAT: '/api/chat',
  SETTINGS: '/api/settings',

  // メンター機能（フェーズ2）
  MENTOR: {
    DASHBOARD: '/api/mentor/dashboard',
    RELATIONSHIPS: '/api/mentor/relationships',
    INVITE: '/api/mentor/invite',
    CLIENT_DETAIL: (clientId: string) => `/api/mentor/client/${clientId}`,
    CLIENT_GOALS: (clientId: string) => `/api/mentor/client/${clientId}/goals`,
    CLIENT_TASKS: (clientId: string) => `/api/mentor/client/${clientId}/tasks`,
    CLIENT_LOGS: (clientId: string) => `/api/mentor/client/${clientId}/logs`,
    CLIENT_REFLECTIONS: (clientId: string) => `/api/mentor/client/${clientId}/reflections`,
    CLIENT_AI_REPORTS: (clientId: string) => `/api/mentor/client/${clientId}/ai-reports`,
    NOTES: '/api/mentor/notes',
    NOTE_DETAIL: (noteId: string) => `/api/mentor/notes/${noteId}`,
    REPORTS: '/api/mentor/reports',
    REPORT_GENERATE: '/api/mentor/reports/generate',
    REPORT_DETAIL: (reportId: string) => `/api/mentor/reports/${reportId}`,
  },

  // データアクセス制御
  CLIENT: {
    DATA_ACCESS: '/api/client/data-access',
  },

  // ユーザー管理
  USER: {
    PROFILE: '/api/user/profile',
    PASSWORD: '/api/user/password',
    MENTOR_REGISTRATION: '/api/user/mentor-registration',
  },
} as const;
```

**使用例:**
```typescript
// Before
const response = await fetch('/api/mentor/dashboard');

// After
import { API_PATHS } from '@/lib/constants';
const response = await fetch(API_PATHS.MENTOR.DASHBOARD);
```

---

## ❌ 検出された不整合

### 1. User型とPrisma Client型の不一致

**Prismaスキーマ:**
```prisma
model User {
  role       String   @default("client")
  isMentor   Boolean  @default(false)
  bio        String?  @db.Text
  expertise  String[] @default([])
}
```

**types/index.ts:**
```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
  // ❌ role, isMentor, bio, expertiseフィールドが欠如
}

export interface UserExtended extends User {
  role: UserRole; // CLIENT/MENTOR/ADMIN
  isMentor: boolean;
  bio?: string;
  expertise: MentorExpertise[];
}
```

**問題点:**
- 基本の`User`型にフェーズ2フィールドが含まれていない
- `UserExtended`型は存在するが、使用箇所が不明
- Prisma Clientから取得したUserオブジェクトを`User`型にキャストすると型エラー

**解決策:**

**オプション1: User型を拡張（推奨）**
```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
  // フェーズ2追加フィールド
  role: UserRole; // 'CLIENT' | 'MENTOR' | 'ADMIN'
  isMentor: boolean;
  bio?: string;
  expertise: MentorExpertise[];
}

// UserExtended型は削除（不要）
```

**オプション2: UserExtended型を統一的に使用**
```typescript
// User型は基本情報のみ（変更なし）
export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// UserExtended型を全体で使用
export interface UserExtended extends User {
  role: UserRole;
  isMentor: boolean;
  bio?: string;
  expertise: MentorExpertise[];
}

// 使用箇所を全てUserExtendedに変更
```

**推奨**: **オプション1（User型を拡張）**

**理由:**
1. フェーズ2以降、すべてのUserはroleフィールドを持つ（デフォルトあり）
2. 2つの型を使い分けるのは複雑（開発者の混乱を招く）
3. Prisma ClientのUser型と一貫性が保たれる

---

### 2. MentorNoteの`isPrivate`と`isSharedWithClient`の不整合

**詳細は「曖昧点4」を参照**

**解決策**: Prismaスキーマを修正
```prisma
model MentorNote {
  // ...
  isSharedWithClient Boolean @default(false) // 修正
  // ...
}
```

---

### 3. lib/mentor-access.tsの欠如

**詳細は「明確に理解できた要件2」を参照**

**解決策**: ファイルを新規作成（仕様は上記参照）

---

### 4. MainLayoutのナビゲーションにメンターダッシュボードリンクが欠如

**現在のMainLayout:**
```typescript
const navigationItems = [
  { id: 'home', label: 'ホーム', icon: 'home', href: '/' },
  { id: 'plan-do', label: '計画/実行', icon: 'assignment', href: '/plan-do' },
  { id: 'check-action', label: '確認/改善', icon: 'analytics', href: '/check-action' },
  { id: 'ai-assistant', label: '学習', icon: 'school', href: '/ai-assistant' },
  { id: 'settings', label: '設定', icon: 'settings', href: '/settings' },
];
```

**問題**: メンターダッシュボードへのリンクがない

**解決策:**
```typescript
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserExtended } from '@/types'; // 修正: UserDisplayではなくUserExtendedを使用

interface MainLayoutProps {
  children: React.ReactNode;
  user?: UserExtended; // ロール情報を含むUserExtended型を使用
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, user }) => {
  const pathname = usePathname();

  // ベースナビゲーションアイテム（全ユーザー共通）
  const baseNavigationItems = [
    { id: 'home', label: 'ホーム', icon: 'home', href: '/' },
    { id: 'plan-do', label: '計画/実行', icon: 'assignment', href: '/plan-do' },
    { id: 'check-action', label: '確認/改善', icon: 'analytics', href: '/check-action' },
    { id: 'ai-assistant', label: '学習', icon: 'school', href: '/ai-assistant' },
    { id: 'settings', label: '設定', icon: 'settings', href: '/settings' },
  ];

  // メンターの場合のみメンターダッシュボードを追加
  const navigationItems = user?.role === 'MENTOR' || user?.isMentor
    ? [
        { id: 'mentor', label: 'メンター', icon: 'supervisor_account', href: '/mentor' },
        ...baseNavigationItems,
      ]
    : baseNavigationItems;

  // ... 残りは同じ
};
```

**注意点:**
- ナビゲーションアイテムが6つになる → ボトムナビゲーションが狭くなる可能性
- 代替案: メンターダッシュボードはヘッダーの右上にアイコンで配置

---

## 💡 実装前に決定すべき事項

### 優先度: 高

1. **招待・承認フローの方向性**（曖昧点1）
   - 推奨: メンター主導（A）
   - 決定が必要: ユーザー承認

2. **データアクセス許可のデフォルト**（曖昧点2）
   - 推奨: 全て拒否（A）
   - 決定が必要: ユーザー承認

3. **User型の統一**（不整合1）
   - 推奨: User型を拡張（オプション1）
   - 実装前に必須

4. **MentorNoteのフィールド名統一**（不整合2、曖昧点4）
   - 推奨: `isSharedWithClient`に統一
   - マイグレーション前に修正必須

### 優先度: 中

5. **クライアントの複数メンター保持**（曖昧点3）
   - 推奨: 可能（B）を維持
   - 確認推奨: 意図した設計かどうか

6. **API_PATHS定数の作成**（不整合4）
   - 推奨: lib/constants.tsを作成
   - 任意だが、コード品質向上のため推奨

7. **MainLayoutのナビゲーション変更**（不整合5）
   - 決定が必要: メンターダッシュボードの配置（ボトムナビ vs ヘッダー）

### 優先度: 低

8. **エラーメッセージの日本語化**
   - 現在の実装は英語エラーメッセージが混在
   - 統一的なエラーハンドリング戦略を決定

---

## 🔗 フェーズ1統合チェックリスト

### データベース統合

- [ ] **Prismaマイグレーションの実行**
  - [ ] バックアップ作成
  - [ ] マイグレーションSQL確認
  - [ ] テスト環境で実行
  - [ ] 本番環境で実行
  - [ ] `npx prisma generate`でClient再生成

- [ ] **既存データとの互換性確認**
  - [ ] 既存Userレコードに`role`, `isMentor`フィールドが追加されるか
  - [ ] デフォルト値が正しく設定されるか
  - [ ] インデックスが適切に作成されるか

### 型定義統合

- [ ] **User型の統一**（不整合1の解決）
  - [ ] types/index.tsのUser型を拡張
  - [ ] UserExtended型の使用箇所を確認
  - [ ] Prisma Client型との整合性確認

- [ ] **MentorNote型の統一**（不整合2の解決）
  - [ ] Prismaスキーマを`isSharedWithClient`に修正
  - [ ] types/index.tsとの整合性確認

- [ ] **API_PATHS定数の作成**
  - [ ] lib/constants.tsを作成
  - [ ] 既存のハードコードされたパスを置換

### 認証・認可統合

- [ ] **DALパターンの一貫性確認**
  - [ ] lib/dal.tsのロール検証関数が正しく動作するか
  - [ ] Auth.jsのコールバックでroleが正しく設定されるか
  - [ ] セッションにroleが含まれるか

- [ ] **メンター専用ページの保護**
  - [ ] M-001, M-002ページで`verifyMentor()`が呼ばれているか
  - [ ] クライアントがアクセスした場合、/authにリダイレクトされるか

### UI/UX統合

- [ ] **MainLayoutのナビゲーション変更内容は明確か？**
  - [ ] メンターダッシュボードリンクの配置決定
  - [ ] ロール判定ロジックの実装
  - [ ] デザインの一貫性確保

- [ ] **設定ページの拡張**
  - [ ] メンター登録セクションの実装
  - [ ] データアクセス許可設定セクションの実装
  - [ ] 既存セクションとの統合確認

### API統合

- [ ] **モックからDB連携への移行**
  - [ ] `/api/mentor/dashboard`のDB連携実装
  - [ ] `/api/mentor/client/[id]`のDB連携実装
  - [ ] lib/mentor-access.tsの実装

- [ ] **新規APIエンドポイントの実装**
  - [ ] `/api/mentor/invite` (POST)
  - [ ] `/api/mentor/relationships` (GET)
  - [ ] `/api/mentor/notes` (POST, GET)
  - [ ] `/api/mentor/notes/[id]` (PUT, DELETE)
  - [ ] `/api/mentor/reports/generate` (POST)
  - [ ] `/api/client/data-access` (GET, PUT)
  - [ ] `/api/user/mentor-registration` (PUT)

### カスタムフック統合

- [ ] **既存パターンとの一貫性は保たれるか？**
  - [ ] useMentorDashboard.tsの実装
  - [ ] useClientDetail.tsの実装
  - [ ] 既存フックとの命名規則統一

### テスト統合

- [ ] **E2Eテストの追加**
  - [ ] M-001（メンターダッシュボード）のテスト
  - [ ] M-002（クライアント詳細）のテスト
  - [ ] C-005-EXT（設定拡張）のテスト
  - [ ] データアクセス制御のテスト

---

## 🎯 次のアクション

### 即座に実行すべき

1. **User型の統一決定** → types/index.ts修正
2. **MentorNoteのフィールド名統一** → prisma/schema.prisma修正
3. **招待フローの方向性決定** → ユーザー確認
4. **データアクセス許可デフォルト決定** → ユーザー確認

### Week 1で実行

5. **lib/mentor-access.tsの実装**
6. **Prismaマイグレーションの実行**
7. **API_PATHS定数の作成**
8. **MainLayoutのナビゲーション変更**

### Week 2で実行

9. **API DB連携移行**（dashboard, client detail）
10. **C-005-EXT実装**（設定ページ拡張）
11. **カスタムフック実装**（useMentorDashboard, useClientDetail）

### Week 3で実行

12. **招待・承認フロー実装**
13. **データアクセス制御の完全実装**
14. **E2Eテスト追加**

---

## 📊 完成度評価

| 項目 | 完成度 | 備考 |
|------|--------|------|
| Prismaスキーマ | 95% | フィールド名の微調整が必要 |
| 認証・認可（DAL） | 100% | lib/auth.ts, lib/dal.ts完成 |
| M-001ページ | 90% | DB連携のみ残り |
| M-002ページ | 90% | DB連携のみ残り |
| C-005-EXT | 0% | 未着手 |
| API（モック版） | 80% | DB連携への移行が必要 |
| lib/mentor-access.ts | 0% | 未着手（仕様は明確） |
| カスタムフック | 0% | 未着手（パターンは明確） |
| 型定義 | 85% | User型の不整合を修正すべき |
| E2Eテスト | 70% | メンター機能のテストが必要 |

**総合完成度**: **約85%**（残り15%の内訳が明確化）

---

**レポート完**

次のステップ: 上記の「次のアクション」に従って実装を進めてください。
