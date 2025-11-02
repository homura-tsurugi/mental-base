# 認証API仕様書

生成日: 2025-11-01
収集元: components/auth/AuthPage.tsx
@MOCK_TO_APIマーク数: 4

## エンドポイント一覧

### 1. ログイン

- **認証方式**: Auth.js (NextAuth v5) Credentials Provider
- **関数**: `signIn('credentials', options)`
- **Request**:
  ```typescript
  {
    email: string;      // メールアドレス
    password: string;   // パスワード（8文字以上）
  }
  ```
- **Response**:
  ```typescript
  {
    ok: boolean;        // 認証成功フラグ
    error?: string;     // エラーメッセージ（失敗時）
    url?: string;       // リダイレクト先URL
  }
  ```
- **成功時の挙動**: `/` (ホーム) にリダイレクト
- **説明**: Auth.jsのCredentials Providerを使用したログイン処理

---

### 2. 新規登録

- **エンドポイント**: `POST /api/auth/register`
- **Request**:
  ```typescript
  {
    name: string;       // ユーザー名（2文字以上）
    email: string;      // メールアドレス
    password: string;   // パスワード（8文字以上、英数字混在推奨）
  }
  ```
- **Response**:
  ```typescript
  {
    success: boolean;   // 成功フラグ
    message?: string;   // メッセージ
    user?: {            // ユーザー情報（成功時）
      id: string;
      email: string;
      name: string;
    };
    error?: string;     // エラーメッセージ（失敗時）
  }
  ```
- **成功後の処理**: 自動ログイン → `/` (ホーム) にリダイレクト
- **説明**: 新規ユーザー登録。パスワードはbcryptでハッシュ化してDBに保存

---

### 3. パスワードリセットリクエスト

- **エンドポイント**: `POST /api/auth/password-reset`
- **Request**:
  ```typescript
  {
    email: string;      // メールアドレス
  }
  ```
- **Response**:
  ```typescript
  {
    success: boolean;   // 成功フラグ
    message?: string;   // メッセージ
    error?: string;     // エラーメッセージ（失敗時）
  }
  ```
- **成功後の処理**: `password-reset-success` ビューに遷移
- **説明**: パスワードリセット用のトークンを生成し、メールでリセットリンクを送信

---

### 4. 新しいパスワード設定

- **エンドポイント**: `POST /api/auth/password-reset/confirm`
- **Request**:
  ```typescript
  {
    token: string;          // リセットトークン（URLパラメータから取得）
    newPassword: string;    // 新しいパスワード（8文字以上）
    confirmPassword: string; // パスワード確認（newPasswordと一致必須）
  }
  ```
- **Response**:
  ```typescript
  {
    success: boolean;   // 成功フラグ
    message?: string;   // メッセージ
    error?: string;     // エラーメッセージ（失敗時）
  }
  ```
- **成功後の処理**: `login` ビューに遷移
- **説明**: トークンを検証し、新しいパスワードに更新

---

## バリデーションルール

### クライアントサイド（lib/validation.ts）

#### メールアドレス
- 形式: RFC 5322準拠の正規表現チェック
- エラーメッセージ: "有効なメールアドレスを入力してください"

#### パスワード
- 最小文字数: 8文字
- エラーメッセージ: "パスワードは8文字以上で入力してください"

#### 名前
- 最小文字数: 2文字
- エラーメッセージ: "名前は2文字以上で入力してください"

#### パスワード確認
- ルール: newPasswordと完全一致
- エラーメッセージ: "パスワードが一致しません"

### サーバーサイド（実装時）

#### メールアドレス
- ユニークチェック（新規登録時）
- 存在チェック（パスワードリセット時）

#### パスワード
- 最小8文字
- 英数字混在推奨（警告レベル）
- bcryptハッシュ化（ソルトラウンド: 10）

#### リセットトークン
- 有効期限: 1時間
- 使用済みトークンの無効化

---

## セキュリティ要件

### 認証
- **CSRF保護**: Auth.js標準実装
- **セッション管理**: JWT (JWE, A256GCM)
- **Cookie設定**:
  - HttpOnly: true（XSS攻撃防止）
  - Secure: true（HTTPS必須、本番環境）
  - SameSite: Lax

### パスワード
- **ハッシュ化**: bcrypt、ソルトラウンド10
- **平文保存禁止**: DBには必ずハッシュ化後のパスワードを保存

### メール送信
- **リセットリンク**: トークンをURLパラメータに含む
- **トークン生成**: ランダム生成、UUIDまたはcrypto.randomBytes
- **有効期限**: 1時間

### レート制限（実装推奨）
- ログイン: 5回/分
- 新規登録: 3回/時間
- パスワードリセット: 3回/時間

---

## エラーハンドリング

### クライアントサイド
- フォームバリデーションエラー: フィールド別にエラーメッセージ表示
- API呼び出しエラー: エラーメッセージをアラート表示（実装時はToast推奨）

### サーバーサイド（実装時）
- **400 Bad Request**: バリデーションエラー
- **401 Unauthorized**: 認証失敗
- **404 Not Found**: ユーザーまたはトークンが見つからない
- **409 Conflict**: メールアドレス重複（新規登録時）
- **500 Internal Server Error**: サーバーエラー

---

## モックAPI実装参照

現在のモック実装は以下のファイルにあります:
```
components/auth/AuthPage.tsx
- handleLogin (lines 48-67)
- handleRegister (lines 70-90)
- handlePasswordReset (lines 93-112)
- handleNewPassword (lines 115-134)
```

各関数は1秒の待機後に成功を返すモック実装になっています。

---

## 実装時の注意事項

### Auth.js設定 (`lib/auth.ts`)
```typescript
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export const { auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }
    })
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth',
  },
});
```

### 新規登録API (`app/api/auth/register/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { validateRegister } from '@/lib/validation';

export async function POST(request: NextRequest) {
  const body = await request.json();

  // バリデーション
  const errors = validateRegister(body);
  if (errors.length > 0) {
    return NextResponse.json({
      success: false,
      error: errors[0].message
    }, { status: 400 });
  }

  // メールアドレス重複チェック
  const existingUser = await prisma.user.findUnique({
    where: { email: body.email }
  });

  if (existingUser) {
    return NextResponse.json({
      success: false,
      error: 'このメールアドレスは既に登録されています'
    }, { status: 409 });
  }

  // パスワードハッシュ化
  const hashedPassword = await bcrypt.hash(body.password, 10);

  // ユーザー作成
  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: hashedPassword,
    },
  });

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    }
  });
}
```

---

## 関連ドキュメント

- 要件定義書: `docs/requirements.md` - P-001仕様
- 型定義: `types/index.ts` - 認証関連型定義
- バリデーション: `lib/validation.ts` - フォームバリデーション
- E2Eテスト仕様書: `docs/e2e-specs/auth-e2e.md`（作成予定）
