# M-001: メンターダッシュボード - API仕様書

**バージョン**: 1.0.0
**最終更新日**: 2025-11-02
**ステータス**: 確定

---

## 目次

1. [概要](#概要)
2. [エンドポイント一覧](#エンドポイント一覧)
3. [詳細仕様](#詳細仕様)
4. [複合処理](#複合処理)
5. [エラーハンドリング](#エラーハンドリング)
6. [モックサービス参照](#モックサービス参照)

---

## 概要

### 目的
M-001: メンターダッシュボードページで使用するAPIエンドポイントの仕様を定義。
担当クライアント全体の進捗と優先対応者を一目で把握するための統合データを提供する。

### 主要機能
- 統計サマリー表示（担当クライアント数、アクティブ数、要フォロー数、平均進捗率）
- クライアント一覧（カード表示）
- 検索・フィルター機能
- ソート機能（進捗率/最終活動日/名前）
- クライアント詳細への遷移

### @MOCK_TO_APIマーク収集元
- `components/mentor/DashboardStats.tsx` (L24-L26)
- `components/mentor/ClientList.tsx` (L25-L27)

### 参照ドキュメント
- 要件定義書: `docs/requirements_mentor.md` - 3.2 M-001: メンターダッシュボード
- 複合処理: `docs/requirements_mentor.md` - 6. 複合処理-004: メンターダッシュボードデータ生成
- 型定義: `types/index.ts`

---

## エンドポイント一覧

| No | エンドポイント | メソッド | 認証 | 権限 | 説明 |
|----|---------------|---------|------|------|------|
| 1 | `/api/mentor/dashboard` | GET | 必須 | MENTOR | メンターダッシュボードデータ取得（統計+クライアント一覧） |

---

## 詳細仕様

### 1. メンターダッシュボードデータ取得

**エンドポイント**: `GET /api/mentor/dashboard`

**認証**: 必須（Auth.js Session）

**認可**: MENTOR ロール必須（Data Access Layer検証）

#### リクエスト

**Query Parameters**:
```typescript
{
  mentorId?: string; // メンターのユーザーID（任意、省略時はセッションから取得）
}
```

**Headers**:
```
Authorization: Bearer <session_token>
Content-Type: application/json
```

#### レスポンス

**成功時（200 OK）**:
```typescript
{
  statistics: DashboardStatistics;
  clients: ClientSummary[];
}
```

**型定義**:
```typescript
// 統計サマリー
interface DashboardStatistics {
  totalClients: number;      // 担当クライアント総数
  activeClients: number;     // アクティブクライアント（今週活動あり）
  needsFollowUp: number;     // 要フォロークライアント（7日以上活動なし）
  averageProgress: number;   // 平均進捗率（0-100）
}

// クライアント一覧の各アイテム
interface ClientSummary {
  id: string;                   // クライアントID
  name: string;                 // 名前
  email: string;                // メールアドレス
  avatarUrl?: string;           // アバター画像URL（任意）
  initials: string;             // イニシャル（例: "田中太郎" → "田"）
  overallProgress: number;      // 総合進捗率（0-100）
  lastActivityDate: Date;       // 最終活動日時
  lastActivityLabel: string;    // 最終活動ラベル（例: "今日", "2日前", "10日前"）
  status: ClientStatus;         // ステータス（on_track/stagnant/needs_followup）
  relationshipId: string;       // MentorClientRelationshipのID
}

// クライアントステータス
type ClientStatus = 'on_track' | 'stagnant' | 'needs_followup';

// メンターダッシュボード全体のデータ
interface MentorDashboardData {
  statistics: DashboardStatistics;
  clients: ClientSummary[];
}
```

**レスポンス例**:
```json
{
  "statistics": {
    "totalClients": 12,
    "activeClients": 8,
    "needsFollowUp": 2,
    "averageProgress": 68.5
  },
  "clients": [
    {
      "id": "client-uuid-1",
      "name": "田中 太郎",
      "email": "tanaka@example.com",
      "avatarUrl": null,
      "initials": "田",
      "overallProgress": 85,
      "lastActivityDate": "2025-11-02T10:30:00Z",
      "lastActivityLabel": "今日",
      "status": "on_track",
      "relationshipId": "relationship-uuid-1"
    },
    {
      "id": "client-uuid-2",
      "name": "佐藤 花子",
      "email": "sato@example.com",
      "avatarUrl": "https://example.com/avatars/sato.jpg",
      "initials": "佐",
      "overallProgress": 42,
      "lastActivityDate": "2025-10-25T14:20:00Z",
      "lastActivityLabel": "8日前",
      "status": "needs_followup",
      "relationshipId": "relationship-uuid-2"
    }
  ]
}
```

#### エラーレスポンス

**401 Unauthorized** - 認証エラー:
```json
{
  "error": "Unauthorized",
  "detail": {
    "message": "認証が必要です。ログインしてください。"
  }
}
```

**403 Forbidden** - 権限エラー:
```json
{
  "error": "Forbidden",
  "detail": {
    "message": "このリソースへのアクセス権限がありません。メンターロールが必要です。"
  }
}
```

**500 Internal Server Error** - サーバーエラー:
```json
{
  "error": "Internal Server Error",
  "detail": {
    "message": "データの取得に失敗しました。しばらくしてから再試行してください。"
  }
}
```

---

## 複合処理

### MDS-001: メンターダッシュボードデータ生成

**トリガー**: メンターダッシュボード表示時（M-001: メンターダッシュボード）

**フロントエンドAPI**: `GET /api/mentor/dashboard`

**複合処理の詳細** (`docs/requirements_mentor.md` - 複合処理-004):

#### バックエンド内部処理フロー

1. **メンターの担当クライアント取得**
   ```sql
   SELECT * FROM mentor_client_relationships
   WHERE mentor_id = ? AND status = 'active'
   ```

2. **各クライアントの進捗データ計算**
   - 最終活動日の算出:
     - 最新のLog、Task、Reflectionの作成日時を比較
     - 最も新しい日時を`lastActivityDate`として使用

   - 総合進捗率の計算:
     ```
     overallProgress = (
       planProgress + doProgress + checkProgress + actionProgress
     ) / 4
     ```
     - planProgress: アクティブな目標の設定状況（0-100）
     - doProgress: タスク完了率（完了タスク / 総タスク × 100）
     - checkProgress: ログ記録頻度（週次目標に対する達成率）
     - actionProgress: 振り返り・改善計画の実行率

   - ステータス判定:
     ```typescript
     if (lastActivityDays <= 3 && overallProgress >= 70) {
       status = 'on_track';
     } else if (lastActivityDays <= 7 && overallProgress >= 50) {
       status = 'stagnant';
     } else {
       status = 'needs_followup';
     }
     ```

3. **統計サマリー集計**
   - `totalClients`: クライアント配列の長さ
   - `activeClients`: 7日以内に活動があるクライアント数
     ```typescript
     activeClients = clients.filter(c =>
       (Date.now() - c.lastActivityDate) <= 7 * 24 * 60 * 60 * 1000
     ).length
     ```
   - `needsFollowUp`: status が 'needs_followup' のクライアント数
     ```typescript
     needsFollowUp = clients.filter(c => c.status === 'needs_followup').length
     ```
   - `averageProgress`: 全クライアントの平均進捗率
     ```typescript
     averageProgress = clients.reduce((sum, c) => sum + c.overallProgress, 0) / totalClients
     ```

4. **データ統合**
   - `MentorDashboardData`オブジェクトを生成
   - 統計サマリーとクライアント一覧を含む
   - フロントエンドに返却

#### データソース
- **MentorClientRelationship**: メンター-クライアント関係
- **User**: クライアント基本情報（name, email）
- **Goal**: クライアントの目標データ
- **Task**: クライアントのタスクデータ
- **Log**: クライアントのログ記録
- **Reflection**: クライアントの振り返り記録

#### パフォーマンス最適化

**注意事項**:
- クライアント数が多い場合（100人以上）はページネーション推奨
- データベースクエリは適切にインデックス化
- Prismaのバッチクエリ（`findMany` + `include`）を活用

**推奨クエリ戦略**:
```typescript
// 1回のクエリで関連データをまとめて取得
const relationships = await prisma.mentorClientRelationship.findMany({
  where: {
    mentorId: session.userId,
    status: 'active',
  },
  include: {
    client: {
      include: {
        goals: { where: { status: 'active' } },
        tasks: { where: { status: { in: ['pending', 'in_progress'] } } },
        logs: { orderBy: { createdAt: 'desc' }, take: 1 },
        reflections: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    },
  },
});
```

#### 外部サービス依存
- Supabase PostgreSQL（データベース）

#### 想定処理時間
- 通常時: 100-300ms
- クライアント数50人以下の場合: 500ms以内
- クライアント数100人以上の場合: 1000ms以内（ページネーション推奨）

---

## エラーハンドリング

### フロントエンド側の処理

**DashboardStats.tsx**:
```typescript
// L24-L38
useEffect(() => {
  async function fetchStats() {
    try {
      const response = await fetch(`/api/mentor/dashboard?mentorId=${mentorId}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.statistics);
      }
    } catch (error) {
      console.error('統計データの取得に失敗しました:', error);
      // エラートースト表示（shadcn/ui toast推奨）
    } finally {
      setLoading(false);
    }
  }
  fetchStats();
}, [mentorId]);
```

**ClientList.tsx**:
```typescript
// L25-L40
useEffect(() => {
  async function fetchClients() {
    try {
      const response = await fetch(`/api/mentor/dashboard?mentorId=${mentorId}`);
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
        setFilteredClients(data.clients || []);
      }
    } catch (error) {
      console.error('クライアントデータの取得に失敗しました:', error);
      // エラートースト表示（shadcn/ui toast推奨）
    } finally {
      setLoading(false);
    }
  }
  fetchClients();
}, [mentorId]);
```

### エラー種別と対処

| エラー種別 | HTTPステータス | フロントエンド対処 |
|-----------|---------------|------------------|
| 認証エラー | 401 | `/auth`にリダイレクト |
| 権限エラー | 403 | エラートースト表示 + `/` にリダイレクト |
| ネットワークエラー | - | エラートースト表示 + リトライボタン表示 |
| サーバーエラー | 500 | エラートースト表示 + リトライボタン表示 |
| タイムアウト | 504 | エラートースト表示 + リトライボタン表示 |

### リトライロジック

```typescript
// 推奨: React Query使用
import { useQuery } from '@tanstack/react-query';

const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['mentorDashboard', mentorId],
  queryFn: () => fetchMentorDashboard(mentorId),
  staleTime: 5 * 60 * 1000, // 5分
  retry: 3, // 最大3回リトライ
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});
```

---

## モックサービス参照

### DashboardStats.tsx

**@MOCK_TO_APIマーク**: L24-L26
```typescript
// @MOCK_TO_API: メンターダッシュボード統計データ取得
// 本番: /api/mentor/dashboard から取得
```

**現在の実装**:
```typescript
const response = await fetch(`/api/mentor/dashboard?mentorId=${mentorId}`);
if (response.ok) {
  const data = await response.json();
  setStats(data.statistics); // DashboardStatistics型
}
```

**必要な型**:
- `DashboardStatistics` (`types/index.ts` L545-L550)

---

### ClientList.tsx

**@MOCK_TO_APIマーク**: L25-L27
```typescript
// @MOCK_TO_API: メンターダッシュボードクライアント一覧取得
// 本番: /api/mentor/dashboard から取得
```

**現在の実装**:
```typescript
const response = await fetch(`/api/mentor/dashboard?mentorId=${mentorId}`);
if (response.ok) {
  const data = await response.json();
  setClients(data.clients || []); // ClientSummary[]型
  setFilteredClients(data.clients || []);
}
```

**必要な型**:
- `ClientSummary` (`types/index.ts` L553-L564)
- `ClientFilterType` (`types/index.ts` L542)
- `ClientSortOrder` (`types/index.ts` L539)

---

## バックエンド実装ガイド

### FastAPI エンドポイント実装例

```python
# backend/app/routers/mentor.py

from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime, timedelta

from app.schemas.mentor import MentorDashboardData, DashboardStatistics, ClientSummary
from app.services.auth import get_current_user, verify_mentor_role
from app.services.mentor_service import MentorService

router = APIRouter(prefix="/api/mentor", tags=["mentor"])

@router.get("/dashboard", response_model=MentorDashboardData)
async def get_mentor_dashboard(
    current_user = Depends(verify_mentor_role),
    mentor_service: MentorService = Depends()
):
    """
    メンターダッシュボードデータ取得
    - 統計サマリー
    - クライアント一覧
    """
    try:
        # 担当クライアント取得
        relationships = await mentor_service.get_active_relationships(
            mentor_id=current_user.id
        )

        # クライアントサマリー生成
        clients: List[ClientSummary] = []
        for rel in relationships:
            client_data = await mentor_service.calculate_client_summary(
                client_id=rel.client_id,
                relationship_id=rel.id
            )
            clients.append(client_data)

        # 統計サマリー集計
        statistics = DashboardStatistics(
            totalClients=len(clients),
            activeClients=len([c for c in clients if c.is_active_this_week()]),
            needsFollowUp=len([c for c in clients if c.status == 'needs_followup']),
            averageProgress=sum(c.overallProgress for c in clients) / len(clients) if clients else 0
        )

        return MentorDashboardData(
            statistics=statistics,
            clients=clients
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Prismaスキーマ参照

```prisma
model MentorClientRelationship {
  id               String   @id @default(uuid())
  mentorId         String
  clientId         String
  status           String   @default("pending") // 'pending' | 'active' | 'terminated'
  invitedBy        String
  invitedAt        DateTime @default(now())
  acceptedAt       DateTime?
  terminatedAt     DateTime?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  mentor           User     @relation("MentorRelations", fields: [mentorId], references: [id])
  client           User     @relation("ClientRelations", fields: [clientId], references: [id])

  @@unique([mentorId, clientId])
  @@map("mentor_client_relationships")
}
```

---

## テストケース

### 正常系

1. **メンターが担当クライアント0人の場合**
   - 統計: totalClients=0, activeClients=0, needsFollowUp=0, averageProgress=0
   - クライアント一覧: 空配列

2. **メンターが担当クライアント複数人の場合**
   - 統計が正しく集計される
   - クライアント一覧がすべて取得される
   - 各クライアントの進捗率が正しく計算される

3. **クライアントのステータス判定**
   - on_track: 3日以内活動 & 進捗率70%以上
   - stagnant: 7日以内活動 & 進捗率50%以上
   - needs_followup: 上記以外

### 異常系

1. **認証なしでアクセス**
   - 401 Unauthorized

2. **MENTORロールでないユーザーがアクセス**
   - 403 Forbidden

3. **存在しないmentorIdを指定**
   - 404 Not Found

4. **データベース接続エラー**
   - 500 Internal Server Error

---

## セキュリティ要件

### 認証・認可

- **認証**: Auth.js (NextAuth v5) Session必須
- **認可**: Data Access Layer (DAL)パターンによるロール検証
  ```typescript
  // lib/dal.ts
  export const verifyMentor = cache(async () => {
    return verifyRole('MENTOR');
  });
  ```

### データアクセス制御

- メンターは自分の担当クライアントのデータのみ取得可能
- 他のメンターのクライアントデータは取得不可
- クライアントが許可したデータのみ閲覧可能（ClientDataAccessPermission）

### 監査ログ

- データ閲覧時に`ClientDataViewLog`に記録
- GDPR対応のため、データアクセス履歴を保持

---

## 変更履歴

| バージョン | 日付 | 変更内容 | 担当者 |
|-----------|------|---------|--------|
| 1.0.0 | 2025-11-02 | 初版作成 | Claude |

---

**API仕様書 完**
