# メール送信機能セットアップガイド

## 概要

Mental-Baseでは、Resend APIを使用してメール送信機能を実装しています。

### 対応機能
- ✅ クライアント登録時の初期パスワード送信
- 🚧 パスワードリセット（将来実装）
- 🚧 メンター招待（将来実装）

## セットアップ手順

### 1. Resend アカウント作成

1. [Resend](https://resend.com/) にアクセス
2. 無料アカウントを作成（月100通まで無料）
3. API Keyを取得

### 2. ドメイン検証（本番環境）

#### オプションA: 独自ドメインを使用（推奨）

1. Resendダッシュボードで「Domains」を選択
2. 自分のドメイン（例: `mentalbase.com`）を追加
3. DNSレコードを設定:
   ```
   TXT _resend.mentalbase.com → resend-verification-code
   MX mentalbase.com → feedback-smtp.resend.com (Priority: 10)
   ```
4. 検証完了後、送信元アドレスを設定:
   ```
   COM:PASS <noreply@mentalbase.com>
   ```

#### オプションB: Resendのテストドメインを使用（開発用）

検証なしで使用可能ですが、送信先が限定されます:
```
送信元: onboarding@resend.dev
送信先: 自分のメールアドレスのみ
```

### 3. 環境変数設定

`.env.local` に以下を追加:

```bash
# Resend API Key
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx

# 送信元メールアドレス（独自ドメイン検証後）
EMAIL_FROM=COM:PASS <noreply@yourdomain.com>

# または開発環境でテストドメインを使用
EMAIL_FROM=COM:PASS <onboarding@resend.dev>
```

### 4. 動作確認

1. 開発サーバーを起動:
   ```bash
   npm run dev
   ```

2. メンターダッシュボードでクライアントを登録

3. 以下をチェック:
   - コンソールに「✓ メール送信成功」が表示される
   - 登録したメールアドレスにメールが届く
   - メールに初期パスワードが記載されている

## メール送信のエラーハンドリング

### メール送信失敗時の動作

メール送信に失敗しても、**クライアント登録は正常に完了**します。

```typescript
// APIレスポンス例
{
  "data": {
    "clientId": "user123",
    "clientName": "山田太郎",
    "clientEmail": "yamada@example.com",
    "temporaryPassword": "Abc12345",
    "emailSent": false,  // メール送信失敗
    "message": "クライアントを登録しました（メール送信に失敗しました）"
  }
}
```

### 失敗時の対応

1. フロントエンドのモーダルに警告メッセージが表示されます
2. メンターは初期パスワードをクライアントに直接伝える必要があります
3. サーバーログに警告が記録されます:
   ```
   ⚠️ メール送信に失敗しましたが、アカウント登録は完了しました: RESEND_API_KEY not configured
   ```

## メールテンプレート

### クライアント登録メール

**件名**: 【COM:PASS】アカウントが作成されました

**内容**:
- メンター名による登録の通知
- 初期パスワード（モノスペースフォントで強調）
- ログインURL
- パスワード変更の案内
- COM:PASSの機能紹介

**デザイン**:
- レスポンシブHTML（モバイル・デスクトップ対応）
- グラデーション背景（ブランドカラー）
- 警告ボックス（セキュリティ注意事項）

## 開発時のテスト

### RESEND_API_KEY なしでテスト

環境変数 `RESEND_API_KEY` を設定しない場合:

```
⚠️ RESEND_API_KEY が設定されていません。メール送信をスキップします。
```

- クライアント登録は正常に完了
- メール送信は実行されない
- フロントエンドに警告メッセージが表示される
- 初期パスワードはモーダルに表示される

### メール送信のデバッグ

```bash
# ログを確認
npm run dev

# クライアント登録実行後、以下のいずれかが表示される:
✓ メール送信成功: message-id-xxxx
⚠️ メール送信に失敗しましたが、アカウント登録は完了しました: Error message
```

## よくある問題と解決方法

### 1. メールが届かない

**原因A: ドメイン検証が未完了**
- Resendダッシュボードで「Domains」のステータスを確認
- DNSレコードが正しく設定されているか確認

**原因B: スパムフォルダに入っている**
- 受信ボックスのスパムフォルダを確認
- SPF/DKIM/DMARCレコードを設定（推奨）

**原因C: API Keyが無効**
- `.env.local` の `RESEND_API_KEY` を確認
- Resendダッシュボードで新しいAPI Keyを生成

### 2. "Unauthorized" エラー

```
Error: Unauthorized
```

**解決方法**:
- `RESEND_API_KEY` が正しく設定されているか確認
- API Keyの前後にスペースがないか確認
- サーバーを再起動（環境変数の再読み込み）

### 3. "Domain not verified" エラー

```
Error: Domain not verified
```

**解決方法**:
- 独自ドメインのDNS検証を完了させる
- または開発環境では `onboarding@resend.dev` を使用

## 料金プラン

### Resend 無料プラン
- 月100通まで無料
- 1日あたり上限なし
- ドメイン1つ
- API制限: 2リクエスト/秒

### 有料プラン（必要に応じて）
- Pro: $20/月（月50,000通）
- Business: カスタム料金

## セキュリティベストプラクティス

1. ✅ `.env.local` を `.gitignore` に追加（既に設定済み）
2. ✅ API Keyは絶対にコミットしない
3. ✅ 本番環境では独自ドメインを使用
4. ✅ HTTPS必須（本番環境）
5. ✅ メール内のリンクはHTTPSを使用
6. ✅ 初期パスワードは十分な複雑さを確保（8文字、英数字混合）

## 参考リンク

- [Resend 公式ドキュメント](https://resend.com/docs)
- [Resend Next.js ガイド](https://resend.com/docs/send-with-nextjs)
- [Resend API リファレンス](https://resend.com/docs/api-reference/introduction)
- [Resend ダッシュボード](https://resend.com/dashboard)

---

**最終更新**: 2025-11-03
**関連ファイル**:
- `lib/email.ts` - メール送信ユーティリティ
- `app/api/admin/register-client/route.ts` - クライアント登録API
- `components/mentor/RegisterClientModal.tsx` - 登録モーダル
