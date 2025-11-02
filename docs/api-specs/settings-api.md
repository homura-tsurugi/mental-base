# 設定ページAPI仕様書

生成日: 2025-11-01
収集元: lib/services/SettingsService.ts
@MOCK_TO_APIマーク数: 6

## エンドポイント一覧

### 1. プロフィール情報取得
- **エンドポイント**: `GET /api/users/profile`
- **収集元**: lib/services/SettingsService.ts:37
- **Request**: なし（認証トークンから userId を取得）
- **Response**: `User`
- **説明**: 現在ログイン中のユーザーのプロフィール情報を取得

**Response 例:**
```typescript
{
  id: "user-123",
  email: "test@example.com",
  name: "山田太郎",
  emailVerified: new Date("2025-01-15"),
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-15")
}
```

---

### 2. プロフィール情報更新
- **エンドポイント**: `PUT /api/users/profile`
- **収集元**: lib/services/SettingsService.ts:48
- **Request**: `ProfileUpdateForm`
- **Response**: `User`
- **説明**: ユーザーのプロフィール情報（名前、メールアドレス）を更新

**Request 例:**
```typescript
{
  name: "山田太郎",
  email: "yamada@example.com"
}
```

**Response 例:**
```typescript
{
  id: "user-123",
  email: "yamada@example.com",
  name: "山田太郎",
  emailVerified: new Date("2025-01-15"),
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-11-01") // 更新日時が変更される
}
```

**バリデーション:**
- `name`: 1文字以上必須
- `email`: 有効なメール形式、ユニーク制約

**エラー:**
- 400: バリデーションエラー（無効なメール形式等）
- 409: メールアドレス重複
- 401: 認証エラー

---

### 3. パスワード変更
- **エンドポイント**: `POST /api/users/password`
- **収集元**: lib/services/SettingsService.ts:80
- **Request**: `PasswordChangeForm`
- **Response**: `{ success: boolean, message: string }`
- **説明**: ユーザーのパスワードを変更

**Request 例:**
```typescript
{
  currentPassword: "OldPassword123!",
  newPassword: "NewPassword456!",
  confirmPassword: "NewPassword456!"
}
```

**Response 例:**
```typescript
{
  success: true,
  message: "パスワードを変更しました"
}
```

**バリデーション:**
- `currentPassword`: 必須、現在のパスワードと一致する必要がある
- `newPassword`: 8文字以上必須
- `confirmPassword`: `newPassword`と一致する必要がある

**エラー:**
- 400: バリデーションエラー（パスワード不一致、8文字未満等）
- 401: 現在のパスワードが間違っている
- 401: 認証エラー

**セキュリティ要件:**
- パスワードはbcryptでハッシュ化（ソルトラウンド: 10）
- HTTPS必須（本番環境）

---

### 4. ユーザー設定取得
- **エンドポイント**: `GET /api/users/settings`
- **収集元**: lib/services/SettingsService.ts:112
- **Request**: なし（認証トークンから userId を取得）
- **Response**: `UserSettings`
- **説明**: 現在ログイン中のユーザーの設定情報を取得

**Response 例:**
```typescript
{
  userId: "user-123",
  emailNotifications: true,
  reminderTime: "09:00",
  theme: "professional",
  updatedAt: new Date("2025-01-15")
}
```

---

### 5. 通知設定更新
- **エンドポイント**: `PUT /api/users/settings`
- **収集元**: lib/services/SettingsService.ts:123
- **Request**: `NotificationSettingsForm`
- **Response**: `UserSettings`
- **説明**: ユーザーの通知設定を更新

**Request 例:**
```typescript
{
  emailNotifications: false,
  reminderTime: "10:00"
}
```

**Response 例:**
```typescript
{
  userId: "user-123",
  emailNotifications: false,
  reminderTime: "10:00",
  theme: "professional",
  updatedAt: new Date("2025-11-01") // 更新日時が変更される
}
```

**バリデーション:**
- `emailNotifications`: boolean必須
- `reminderTime`: HH:mm形式（任意）

**エラー:**
- 400: バリデーションエラー（無効な時刻形式等）
- 401: 認証エラー

---

### 6. アカウント削除
- **エンドポイント**: `DELETE /api/users/account`
- **収集元**: lib/services/SettingsService.ts:144
- **処理タイプ**: @BACKEND_COMPLEX（複合API処理-UAS-001）
- **Request**: `AccountDeletionRequest`
- **Response**: `{ success: boolean, message: string }`
- **説明**: ユーザーアカウントと関連するすべてのデータを削除

**Request 例:**
```typescript
{
  userId: "user-123",
  confirmationText: "削除する"
}
```

**Response 例:**
```typescript
{
  success: true,
  message: "アカウントを削除しました"
}
```

#### 複合処理-UAS-001: アカウント削除処理

**バックエンド内部処理フロー:**

1. **認証確認**
   - リクエストトークンからuserIdを取得
   - リクエストボディのuserIdと一致するか確認

2. **関連データ削除（トランザクション内）**
   ```
   DELETE FROM Goal WHERE userId = :userId
   DELETE FROM Task WHERE userId = :userId
   DELETE FROM Log WHERE userId = :userId
   DELETE FROM Reflection WHERE userId = :userId
   DELETE FROM AIAnalysisReport WHERE userId = :userId
   DELETE FROM ActionPlan WHERE userId = :userId
   DELETE FROM ChatMessage WHERE userId = :userId
   DELETE FROM Notification WHERE userId = :userId (将来実装)
   DELETE FROM UserSettings WHERE userId = :userId
   DELETE FROM Session WHERE userId = :userId
   DELETE FROM PasswordResetToken WHERE userId = :userId
   DELETE FROM User WHERE id = :userId
   ```

3. **セッション無効化**
   - すべてのSessionレコードを削除
   - JWTトークンをブラックリスト追加（Redis利用時）

4. **応答準備**
   - 処理完了通知
   - フロントエンドでログアウト処理

**外部サービス依存:**
- Supabase（データベース）
- Redis（オプション、セッション管理）

**セキュリティ要件:**
- CSRF保護必須
- 本人確認（currentPasswordの入力を求める実装も検討）
- トランザクション処理（削除失敗時は全ロールバック）
- 削除前にバックアップ作成（オプション）

**エラー:**
- 400: バリデーションエラー
- 401: 認証エラー
- 403: 権限エラー（他人のアカウント削除試行）
- 500: データベースエラー（トランザクション失敗）

**警告:**
この操作は取り消せません。ユーザーに十分な警告を表示する必要があります。

---

## モックサービス参照

```typescript
// 実装時はこのモックサービスの挙動を参考にする
lib/services/SettingsService.ts
```

---

## 要件定義書との整合性

要件定義書（docs/requirements.md）のC-005仕様（520-562行目）に準拠しています。

| 機能 | API | 対応状況 |
|------|-----|----------|
| プロフィール取得 | GET /api/users/profile | ✅ |
| プロフィール更新 | PUT /api/users/profile | ✅ |
| パスワード変更 | POST /api/users/password | ✅ |
| 通知設定変更 | PUT /api/users/settings | ✅ |
| アカウント削除 | DELETE /api/users/account | ✅ |

---

## 次のステップ

1. **バックエンドAPI実装**
   - FastAPIで各エンドポイントを実装
   - Pydanticスキーマ作成
   - 認証ミドルウェア適用
   - バリデーション実装

2. **API統合**
   - モックサービスから実APIへ切り替え
   - エラーハンドリング強化
   - ローディング状態の改善

3. **E2Eテスト実施**
   - テスト仕様書に基づくテスト実装
   - 正常系・異常系のカバレッジ確認

---

**API仕様書 完**
