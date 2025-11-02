# Supabase接続問題トラブルシューティングガイド

## 問題の概要

Prisma CLIを使用してSupabaseデータベースにスキーマを反映しようとすると、接続後にハングアップする問題が発生しています。

### 症状
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "postgres", schema "public" at "aws-1-ap-southeast-1.pooler.supabase.com:6543"

# ここで処理が停止し、先に進まない
```

### 試行済みの対処法
- ✅ `prisma db push` (transaction pooler port 6543)
- ✅ `prisma db pull` (接続テスト)
- ✅ `prisma migrate dev`
- ✅ Direct URL追加 (session pooler port 6432)
- ❌ すべて同じ箇所でハングアップ

## 考えられる原因

### 1. Connection Poolerの制限
Supabaseの**Transaction Pooler** (port 6543) はDDL操作（CREATE TABLE等）をサポートしていない可能性があります。

### 2. ネットワーク/ファイアウォール
- ローカルネットワークがSupabaseへの接続を制限している
- Supabase側でIP制限が設定されている
- プロキシ/VPNの干渉

### 3. データベースの状態
- Supabaseプロジェクトが一時停止している
- データベースのメンテナンス中
- 無料枠の制限に達している

## 推奨対処手順

### ステップ1: Supabaseダッシュボードで確認

1. https://app.supabase.com にアクセス
2. プロジェクト `vfpdnjqxxtmmpbcnhqsw` を開く
3. 以下を確認:
   - **Project Status**: Active（緑色）であることを確認
   - **Database**: 正常に動作しているか
   - **Settings > Database**: 接続文字列が正しいか

### ステップ2: 直接接続URLを取得

Supabaseダッシュボードで:

1. **Settings** → **Database** を開く
2. **Connection String** セクションで以下を確認:

   **Transaction Mode (現在使用中):**
   ```
   postgresql://postgres.vfpdnjqxxtmmpbcnhqsw:XFy9lNaZnEnPLKLC@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```

   **Session Mode (マイグレーション推奨):**
   ```
   postgresql://postgres.vfpdnjqxxtmmpbcnhqsw:XFy9lNaZnEnPLKLC@aws-1-ap-southeast-1.pooler.supabase.com:6432/postgres
   ```

   **Direct Connection (最も信頼性が高い):**
   ```
   postgresql://postgres:XFy9lNaZnEnPLKLC@db.vfpdnjqxxtmmpbcnhqsw.supabase.co:5432/postgres
   ```

3. **Direct Connection** URLを `.env.local` の `DIRECT_DATABASE_URL` に設定

### ステップ3: `.env.local` を更新

```env
# 現在の設定
DATABASE_URL=postgresql://postgres.vfpdnjqxxtmmpbcnhqsw:XFy9lNaZnEnPLKLC@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres

# 以下をSupabaseダッシュボードから取得したDirect Connection URLに更新
DIRECT_DATABASE_URL=postgresql://postgres:XFy9lNaZnEnPLKLC@db.vfpdnjqxxtmmpbcnhqsw.supabase.co:5432/postgres
```

### ステップ4: 再度スキーマをプッシュ

```bash
npx prisma db push
```

### ステップ5: 代替手段 - Supabase SQL Editorで手動作成

Prismaでの自動マイグレーションが困難な場合、Supabase StudioのSQL Editorから手動でテーブルを作成できます。

1. Supabaseダッシュボード → **SQL Editor**
2. 以下のSQLを実行:

```sql
-- Users テーブル
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  email_verified TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sessions テーブル
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);

-- PasswordResetToken テーブル
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- UserSettings テーブル
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light',
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 以降、必要に応じて他のテーブル（goals, tasks, logs等）も作成
```

3. テーブル作成後、Prisma Clientを再生成:
```bash
npx prisma generate
```

### ステップ6: Supabase CLIを使用（上級者向け）

```bash
# Supabase CLIをインストール
npm install -g supabase

# プロジェクトにリンク
npx supabase link --project-ref vfpdnjqxxtmmpbcnhqsw

# マイグレーション作成
npx supabase db diff -f init_schema

# マイグレーション実行
npx supabase db push
```

## 接続テスト

以下のNode.jsスクリプトで接続をテスト:

```javascript
// test-connection.js
const { PrismaClient } = require('./lib/generated/prisma');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('✅ Connection successful!');

    const result = await prisma.$queryRaw`SELECT NOW()`;
    console.log('✅ Query successful:', result);
  } catch (error) {
    console.error('❌ Connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
```

実行:
```bash
node test-connection.js
```

## よくある問題と解決策

### Q1: "Can't reach database server" エラー
**A:** ネットワーク/ファイアウォールの問題です。以下を確認:
- VPN/プロキシを無効化
- 別のネットワークから試す
- Supabaseのステータスページを確認: https://status.supabase.com

### Q2: "Authentication failed" エラー
**A:** パスワードが間違っています。Supabaseダッシュボードから新しいパスワードを生成してください。

### Q3: タイムアウトエラー
**A:** 接続タイムアウトを延長:
```typescript
// prisma/schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}

// .env.local に追加
DATABASE_URL="postgresql://...?connect_timeout=30"
```

## サポート

上記の対処法で解決しない場合:
1. Supabase公式ドキュメント: https://supabase.com/docs/guides/database/connecting-to-postgres
2. Prisma公式ドキュメント: https://www.prisma.io/docs/guides/database/troubleshooting-orm
3. GitHub Issues: https://github.com/prisma/prisma/issues

## 次のステップ

データベース接続が確立できたら:
1. `npx prisma db push` でスキーマを反映
2. `npx prisma generate` でPrisma Clientを再生成
3. 認証APIの統合テストを作成
4. Slice 2 (ユーザー管理・目標管理) の実装に進む

---

**作成日**: 2025-11-02
**最終更新**: 2025-11-02
**関連ファイル**: `prisma/schema.prisma`, `.env.local`, `lib/prisma.ts`
